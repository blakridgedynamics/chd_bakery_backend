import { Redis } from "@upstash/redis";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface RedisCacheEntry<T> {
  value: T;
}

const memCache = new Map<string, CacheEntry<unknown>>();
let redis: Redis | null | undefined;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  redis ??= Redis.fromEnv();
  return redis;
}

function redisKey(key: string) {
  return `cb:${key}`;
}

function getFromMemory<T>(key: string): T | null {
  const entry = memCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function setInMemory<T>(key: string, value: T, ttlSeconds: number) {
  memCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// Prune expired fallback-memory entries periodically.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Array.from(memCache.entries()).forEach(([key, value]) => {
      if (value.expiresAt < now) memCache.delete(key);
    });
  }, 60 * 1000);
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (client) {
      try {
        const entry = await client.get<RedisCacheEntry<T>>(redisKey(key));
        return entry?.value ?? null;
      } catch {
        return getFromMemory<T>(key);
      }
    }

    return getFromMemory<T>(key);
  },

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const client = getRedis();
    if (client) {
      try {
        await client.set(redisKey(key), { value }, { ex: ttlSeconds });
        return;
      } catch {
        setInMemory(key, value, ttlSeconds);
        return;
      }
    }

    setInMemory(key, value, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    const client = getRedis();
    if (client) {
      try {
        await client.del(redisKey(key));
      } catch {
        // Fall through to memory cleanup.
      }
    }

    memCache.delete(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const client = getRedis();
    if (client) {
      try {
        const keys = await client.keys(redisKey(pattern));
        if (keys.length > 0) await client.del(...keys);
      } catch {
        // Fall through to memory cleanup.
      }
    }

    const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\*", ".*")}$`);
    Array.from(memCache.keys()).forEach((key) => {
      if (regex.test(key)) memCache.delete(key);
    });
  },
};

// Cache key factory
export const CacheKeys = {
  products: (filters: string) => `products:list:${filters}`,
  product: (id: string) => `product:${id}`,
  productSlug: (slug: string) => `product:slug:${slug}`,
  categories: () => `categories:all`,
  publicCategories: () => `content:categories-tree`,
  category: (id: string) => `category:${id}`,
  trending: () => `products:trending`,
  featured: () => `products:featured`,
  home: () => `content:home`,
  siteSettings: () => `content:site-settings`,
  banners: () => `content:banners`,
  announcements: () => `content:announcements`,
  customCakePhotos: () => `content:custom-cake-photos`,
  adminContent: () => `admin:content`,
  recommended: (userId: string) => `recommendations:${userId}`,
  similar: (productId: string) => `similar:${productId}`,
  analytics: () => `admin:analytics`,
};
