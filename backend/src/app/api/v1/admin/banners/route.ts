// src/app/api/v1/admin/banners/route.ts
// Admin-only. GET all banners (including inactive). POST to create.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { clearPublicContentCache } from "@/lib/public-cache";
import { createBannerSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";
import { asc, desc } from "drizzle-orm";

/* ─── GET /api/v1/admin/banners ─────────────────────────────────────────── */
export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const rows = await db
      .select()
      .from(banners)
      .orderBy(asc(banners.sortOrder), desc(banners.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /admin/banners]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});

/* ─── POST /api/v1/admin/banners ─────────────────────────────────────────── */
export const POST = authorizeAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createBannerSchema, body);
    if (!validation.success) return validation.error;

    const { title, imageUrl, subtitle, linkUrl, linkLabel, sortOrder, isActive, startsAt, endsAt } =
      validation.data;

    const [banner] = await db
      .insert(banners)
      .values({
        title,
        imageUrl,
        subtitle: subtitle ?? null,
        linkUrl: linkUrl ?? null,
        linkLabel: linkLabel ?? null,
        sortOrder,
        isActive,
        startsAt: startsAt ?? null,
        endsAt: endsAt ?? null,
      })
      .returning();

    await clearPublicContentCache();
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (err) {
    console.error("[POST /admin/banners]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});
