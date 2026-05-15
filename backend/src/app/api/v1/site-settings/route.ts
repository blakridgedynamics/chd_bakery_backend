import { NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cache, CacheKeys } from "@/lib/cache";
import { PUBLIC_CONTENT_TTL_SECONDS, publicCacheHeaders } from "@/lib/public-cache";

export async function GET(_req: NextRequest) {
  try {
    const cached = await cache.get(CacheKeys.siteSettings());
    if (cached !== null) {
      const res = successResponse(cached, "Site settings fetched");
      Object.entries(publicCacheHeaders).forEach(([key, value]) => res.headers.set(key, value));
      return res;
    }

    const [settings] = await db
      .select()
      .from(siteSettings)
      .orderBy(asc(siteSettings.createdAt))
      .limit(1);

    const data = settings ?? null;
    await cache.set(CacheKeys.siteSettings(), data, PUBLIC_CONTENT_TTL_SECONDS);
    const res = successResponse(data, "Site settings fetched");
    Object.entries(publicCacheHeaders).forEach(([key, value]) => res.headers.set(key, value));
    return res;
  } catch (err) {
    console.error("[GET /site-settings]", err);
    return errorResponse("Server error", 500);
  }
}
