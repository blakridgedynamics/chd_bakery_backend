// src/app/api/v1/admin/banners/[id]/route.ts
// PATCH to edit. DELETE with safety guard — cannot delete the last active banner.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { idParamSchema, updateBannerSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";
import { eq, and, ne, count } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

/* ─── PATCH /api/v1/admin/banners/:id ────────────────────────────────────── */
export const PATCH = authorizeAdmin(async (req: NextRequest, _ctx: unknown) => {
  const { id } = await ((_ctx as Ctx).params);
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid banner id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const body = await req.json();
    const validation = validateBody(updateBannerSchema, body);
    if (!validation.success) return validation.error;
    const input = validation.data;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.title !== undefined)     updateData.title      = input.title;
    if (input.imageUrl !== undefined)  updateData.imageUrl   = input.imageUrl;
    if (input.subtitle !== undefined)  updateData.subtitle   = input.subtitle ?? null;
    if (input.linkUrl !== undefined)   updateData.linkUrl    = input.linkUrl ?? null;
    if (input.linkLabel !== undefined) updateData.linkLabel  = input.linkLabel ?? null;
    if (input.sortOrder !== undefined) updateData.sortOrder  = input.sortOrder;
    if (input.isActive !== undefined)  updateData.isActive   = input.isActive;
    if (input.startsAt !== undefined)  updateData.startsAt   = input.startsAt ?? null;
    if (input.endsAt !== undefined)    updateData.endsAt     = input.endsAt ?? null;

    // If admin is deactivating a banner, make sure at least one other is active.
    if (input.isActive === false) {
      const [{ value: activeCount }] = await db
        .select({ value: count() })
        .from(banners)
        .where(and(eq(banners.isActive, true), ne(banners.id, id)));

      if (Number(activeCount) === 0) {
        return NextResponse.json(
          { success: false, message: "Cannot deactivate the last active banner. Add or activate another banner first." },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    await clearPublicContentCache();
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /admin/banners/:id]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
});

/* ─── DELETE /api/v1/admin/banners/:id ───────────────────────────────────── */
export const DELETE = authorizeAdmin(async (_req: NextRequest, _ctx: unknown) => {
  const { id } = await ((_ctx as Ctx).params);
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid banner id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    // Safety: don't allow deleting the last active banner.
    const [{ value: activeCount }] = await db
      .select({ value: count() })
      .from(banners)
      .where(and(eq(banners.isActive, true), ne(banners.id, id)));

    const [target] = await db
      .select({ isActive: banners.isActive })
      .from(banners)
      .where(eq(banners.id, id))
      .limit(1);

    if (!target) {
      return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    if (target.isActive && Number(activeCount) === 0) {
      return NextResponse.json(
        { success: false, message: "Cannot delete the last active banner. Add another banner first." },
        { status: 400 }
      );
    }

    await db.delete(banners).where(eq(banners.id, id));

    await clearPublicContentCache();
    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    console.error("[DELETE /admin/banners/:id]", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
});
