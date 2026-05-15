// src/app/api/v1/admin/announcements/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { idParamSchema, updateAnnouncementSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

/* ─── PATCH /api/v1/admin/announcements/:id ──────────────────────────────── */
export const PATCH = authorizeAdmin(async (req: NextRequest, _ctx: unknown) => {
  const { id } = await ((_ctx as Ctx).params);
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid announcement id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const body = await req.json();
    const validation = validateBody(updateAnnouncementSchema, body);
    if (!validation.success) return validation.error;
    const input = validation.data;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.text !== undefined)      updateData.text       = input.text;
    if (input.emoji !== undefined)     updateData.emoji      = input.emoji ?? null;
    if (input.linkUrl !== undefined)   updateData.linkUrl    = input.linkUrl ?? null;
    if (input.linkLabel !== undefined) updateData.linkLabel  = input.linkLabel ?? null;
    if (input.sortOrder !== undefined) updateData.sortOrder  = input.sortOrder;
    if (input.isActive !== undefined)  updateData.isActive   = input.isActive;
    if (input.startsAt !== undefined)  updateData.startsAt   = input.startsAt ?? null;
    if (input.endsAt !== undefined)    updateData.endsAt     = input.endsAt ?? null;

    const [updated] = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 });
    }

    await clearPublicContentCache();
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /admin/announcements/:id]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
});

/* ─── DELETE /api/v1/admin/announcements/:id ─────────────────────────────── */
export const DELETE = authorizeAdmin(async (_req: NextRequest, _ctx: unknown) => {
  const { id } = await ((_ctx as Ctx).params);
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid announcement id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const [deleted] = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 });
    }

    await clearPublicContentCache();
    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    console.error("[DELETE /admin/announcements/:id]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
});
