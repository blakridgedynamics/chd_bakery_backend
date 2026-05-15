// src/app/api/v1/announcements/route.ts
// Public endpoint — no auth required.
// Returns active announcements within their date window, ordered by sortOrder.

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { cache, CacheKeys } from "@/lib/cache";
import { PUBLIC_CONTENT_TTL_SECONDS, publicJson } from "@/lib/public-cache";
import { and, eq, or, isNull, lte, gt, asc } from "drizzle-orm";

export async function GET() {
  try {
    const cached = await cache.get(CacheKeys.announcements());
    if (cached) return publicJson({ success: true, data: cached });

    const now = new Date();

    const rows = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
          or(isNull(announcements.endsAt), gt(announcements.endsAt, now))
        )
      )
      .orderBy(asc(announcements.sortOrder), asc(announcements.createdAt));

    await cache.set(CacheKeys.announcements(), rows, PUBLIC_CONTENT_TTL_SECONDS);
    return publicJson({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /announcements]", err);
    return publicJson({ success: false, message: "Server error" }, 500);
  }
}
