import { NextResponse } from "next/server";
import { cache, CacheKeys } from "@/lib/cache";

export const PUBLIC_CONTENT_TTL_SECONDS = 5 * 60;
export const PUBLIC_CONTENT_STALE_SECONDS = 30 * 60;

export const publicCacheHeaders = {
  "Cache-Control": `public, max-age=60, s-maxage=${PUBLIC_CONTENT_TTL_SECONDS}, stale-while-revalidate=${PUBLIC_CONTENT_STALE_SECONDS}`,
};

export function publicJson<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: publicCacheHeaders });
}

export async function clearPublicContentCache() {
  await Promise.all([
    cache.del(CacheKeys.home()),
    cache.del(CacheKeys.siteSettings()),
    cache.del(CacheKeys.banners()),
    cache.del(CacheKeys.announcements()),
    cache.del(CacheKeys.categories()),
    cache.del(CacheKeys.publicCategories()),
    cache.del(CacheKeys.featured()),
    cache.del(CacheKeys.customCakePhotos()),
    cache.del(CacheKeys.adminContent()),
    cache.delPattern("products:*"),
  ]);
}
