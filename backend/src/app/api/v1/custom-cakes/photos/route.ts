import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customCakePhotos } from "@/db/schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { cache, CacheKeys } from "@/lib/cache";
import { PUBLIC_CONTENT_TTL_SECONDS, publicCacheHeaders } from "@/lib/public-cache";

export async function GET(_req: NextRequest) {
  try {
    const cached = await cache.get(CacheKeys.customCakePhotos());
    if (cached) {
      const res = successResponse(cached, "Custom cake photos fetched");
      Object.entries(publicCacheHeaders).forEach(([key, value]) => res.headers.set(key, value));
      return res;
    }

    const photos = await db
      .select()
      .from(customCakePhotos)
      .where(eq(customCakePhotos.isActive, true))
      .orderBy(asc(customCakePhotos.sortOrder), asc(customCakePhotos.createdAt));

    await cache.set(CacheKeys.customCakePhotos(), photos, PUBLIC_CONTENT_TTL_SECONDS);
    const res = successResponse(photos, "Custom cake photos fetched");
    Object.entries(publicCacheHeaders).forEach(([key, value]) => res.headers.set(key, value));
    return res;
  } catch (err) {
    console.error("[GET /custom-cakes/photos]", err);
    return errorResponse("Server error", 500);
  }
}
