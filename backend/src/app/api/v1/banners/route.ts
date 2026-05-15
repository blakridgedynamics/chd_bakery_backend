// src/app/api/v1/banners/route.ts
// Public endpoint — no auth required.
// Returns active banners within their date window, ordered by sortOrder.

import { db } from "@/db";
import { banners } from "@/db/schema";
import { cache, CacheKeys } from "@/lib/cache";
import { PUBLIC_CONTENT_TTL_SECONDS, publicJson } from "@/lib/public-cache";
import { and, eq, or, isNull, lte, gt, asc } from "drizzle-orm";

export async function GET() {
  try {
    const cached = await cache.get(CacheKeys.banners());
    if (cached) return publicJson({ success: true, data: cached });

    const now = new Date();

    const rows = await db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          // startsAt is null OR startsAt <= now
          or(isNull(banners.startsAt), lte(banners.startsAt, now)),
          // endsAt is null OR endsAt > now
          or(isNull(banners.endsAt), gt(banners.endsAt, now))
        )
      )
      .orderBy(asc(banners.sortOrder), asc(banners.createdAt));

    // Safety: frontend should always have at least something to show.
    // We return whatever is active. Admin is responsible for keeping at least
    // one banner live (validated on the admin side before delete).

    await cache.set(CacheKeys.banners(), rows, PUBLIC_CONTENT_TTL_SECONDS);
    return publicJson({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /banners]", err);
    return publicJson({ success: false, message: "Server error" }, 500);
  }
}
