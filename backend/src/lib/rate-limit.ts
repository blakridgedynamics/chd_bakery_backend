import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();
const redisLimiters = new Map<string, Ratelimit>();
let redis: Redis | null = null;
let warnedAboutMemoryFallback = false;

// Cleanup expired entries every 5 minutes to prevent memory leaks.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    // FIX: use Array.from() instead of for...of on Map iterator
    Array.from(store.entries()).forEach(([key, val]) => {
      if (val.resetTime < now) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

/**
 * Extracts a rate-limit key from the request.
 *
 * SECURITY NOTE: x-forwarded-for is set by proxies and CAN be spoofed by
 * clients unless your infrastructure (e.g. Vercel, Nginx) strips or
 * overwrites it before it reaches this server.
 *
 * - On Vercel: x-forwarded-for is trustworthy (platform sets it).
 * - On raw Node / self-hosted: use a reverse-proxy that sets x-real-ip,
 *   and strip client-provided x-forwarded-for headers in your Nginx/Caddy config.
 * - For production safety: move to Upstash Redis + their ratelimit library.
 */
function getClientKey(req: NextRequest, prefix: string): string {
  // Prefer x-real-ip (single value, harder to spoof when nginx sets it).
  // Fall back to the first address in x-forwarded-for.
  const ip =
    req.headers.get("x-real-ip")?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  return `${prefix}:${ip}`;
}

function getEmailClientKey(req: NextRequest, email: string, prefix: string): string {
  const ip =
    req.headers.get("x-real-ip")?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  return `${prefix}:${email.toLowerCase()}:${ip}`;
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production" && !warnedAboutMemoryFallback) {
      warnedAboutMemoryFallback = true;
      console.warn(
        "UPSTASH_REDIS_REST_URL/TOKEN are not set; falling back to per-instance memory rate limits."
      );
    }
    return null;
  }

  redis ??= Redis.fromEnv();
  return redis;
}

function getRedisLimiter(prefix: string, windowMs: number, max: number) {
  const client = getRedis();
  if (!client) return null;

  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  const key = `${prefix}:${max}:${seconds}`;
  let limiter = redisLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(max, `${seconds} s`),
      prefix,
    });
    redisLimiters.set(key, limiter);
  }
  return limiter;
}

async function limitKey(
  key: string,
  windowMs: number,
  max: number,
  prefix: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redisLimiter = getRedisLimiter(prefix, windowMs, max);
  if (redisLimiter) {
    const result = await redisLimiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  }

  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: max - 1, resetTime: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  return {
    allowed: true,
    remaining: max - entry.count,
    resetTime: entry.resetTime,
  };
}

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const windowMs = config.windowMs ?? 15 * 60 * 1000; // 15 min
  const max = config.max ?? 100;
  const prefix = config.keyPrefix ?? "rl";

  return limitKey(getClientKey(req, prefix), windowMs, max, prefix);
}

export async function emailRateLimit(
  req: NextRequest,
  email: string,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const windowMs = config.windowMs ?? 15 * 60 * 1000;
  const max = config.max ?? 5;
  const prefix = config.keyPrefix ?? "email";
  return limitKey(getEmailClientKey(req, email, prefix), windowMs, max, prefix);
}

// Stricter limit for auth endpoints (10 attempts per 15 min per IP).
export async function authRateLimit(req: NextRequest) {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: "auth",
  });
}
