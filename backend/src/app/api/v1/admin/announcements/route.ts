// src/app/api/v1/admin/announcements/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { clearPublicContentCache } from "@/lib/public-cache";
import { createAnnouncementSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";
import { asc, desc } from "drizzle-orm";

/* ─── GET /api/v1/admin/announcements ────────────────────────────────────── */
export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const rows = await db
      .select()
      .from(announcements)
      .orderBy(asc(announcements.sortOrder), desc(announcements.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error("[GET /admin/announcements]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
});

/* ─── POST /api/v1/admin/announcements ───────────────────────────────────── */
export const POST = authorizeAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createAnnouncementSchema, body);
    if (!validation.success) return validation.error;

    const { text, emoji, linkUrl, linkLabel, sortOrder, isActive, startsAt, endsAt } =
      validation.data;

    const [announcement] = await db
      .insert(announcements)
      .values({
        text,
        emoji: emoji ?? null,
        linkUrl: linkUrl ?? null,
        linkLabel: linkLabel ?? null,
        sortOrder,
        isActive,
        startsAt: startsAt ?? null,
        endsAt: endsAt ?? null,
      })
      .returning();

    await clearPublicContentCache();
    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (err) {
    console.error("[POST /admin/announcements]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
});
