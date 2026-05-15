// src/app/api/v1/admin/products/[id]/route.ts
// FIX: replaced local adminAuth() with authorizeAdmin() wrapper.
// FIX: PATCH now validates via updateProductSchema.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { idParamSchema } from "@/lib/validations/admin";
import { updateProductSchema } from "@/lib/validations/product";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/v1/admin/products/:id ───────────────────────────────────── */
export const PATCH = authorizeAdmin(async (req: NextRequest, _ctx: unknown) => {
  const { id } = await (_ctx as Ctx).params;
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid product id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const body = await req.json();

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.title !== undefined)            updateData.title            = data.title;
    if (data.description !== undefined)      updateData.description      = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription  = data.shortDescription ?? null;
    if (data.sku !== undefined)              updateData.sku              = data.sku;
    if (data.price !== undefined)            updateData.price            = String(data.price);
    if (data.discountPrice !== undefined)    updateData.discountPrice    = data.discountPrice ? String(data.discountPrice) : null;
    if (data.stock !== undefined)            updateData.stock            = data.stock;
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
    if (data.categoryId !== undefined)       updateData.categoryId       = data.categoryId ?? null;
    if (data.tags !== undefined)             updateData.tags             = data.tags;
    if (data.images !== undefined)           updateData.images           = data.images;
    if (data.isFeatured !== undefined)       updateData.isFeatured       = data.isFeatured;
    if (data.isActive !== undefined)         updateData.isActive         = data.isActive;
    if (data.weight !== undefined)           updateData.weight           = data.weight ? String(data.weight) : null;
    if (data.dimensions !== undefined)       updateData.dimensions       = data.dimensions ?? null;
    if (data.metaTitle !== undefined)        updateData.metaTitle        = data.metaTitle ?? null;
    if (data.metaDescription !== undefined)  updateData.metaDescription  = data.metaDescription ?? null;
    // a dedicated activate/deactivate endpoint if needed — prevents accidents.

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await clearPublicContentCache();
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /admin/products/:id]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});

/* ── DELETE /api/v1/admin/products/:id ──────────────────────────────────── */
export const DELETE = authorizeAdmin(async (_req: NextRequest, _ctx: unknown) => {
  const { id } = await (_ctx as Ctx).params;
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid product id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await clearPublicContentCache();
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("[DELETE /admin/products/:id]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});
