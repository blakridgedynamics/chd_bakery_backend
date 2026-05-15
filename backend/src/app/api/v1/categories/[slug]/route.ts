import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { clearPublicContentCache } from "@/lib/public-cache";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ slug: string }> };

/* ==============================
   GET SINGLE CATEGORY - Public
================================*/
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Get children of this category
    const children = await db
      .select()
      .from(categories)
      .where(and(eq(categories.parentId, category.id), eq(categories.isActive, true)));

    return NextResponse.json({
      success: true,
      data: { ...category, children },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/* ==============================
   UPDATE CATEGORY (PUT) - Admin only
================================*/
export const PUT = authorizeAdmin(async (authedReq: NextRequest, ctx: unknown) => {
  const { slug } = await (ctx as Ctx).params;

    try {
      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 }
        );
      }

      const body = await authedReq.json();
      const {
        name,
        description,
        image,
        parent_id,
        parentId,
        sort_order,
        sortOrder,
        is_active,
        isActive,
      } = body;
      const normalizedParentId = parent_id ?? parentId;

      // Prevent a category from being its own parent
      if (normalizedParentId === existing.id) {
        return NextResponse.json(
          { success: false, message: "Category cannot be its own parent" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(categories)
        .set({
          ...(name        !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(image       !== undefined && { image }),
          ...(normalizedParentId !== undefined && { parentId: normalizedParentId }),
          ...(sort_order  !== undefined && { sortOrder: sort_order }),
          ...(sortOrder   !== undefined && { sortOrder }),
          ...(is_active   !== undefined && { isActive: is_active }),
          ...(isActive    !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(categories.id, existing.id))
        .returning();

      await clearPublicContentCache();
      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "Server error" },
        { status: 500 }
      );
    }
});

/* ==============================
   DELETE CATEGORY - Admin only
================================*/
export const DELETE = authorizeAdmin(async (_req: NextRequest, ctx: unknown) => {
  const { slug } = await (ctx as Ctx).params;

    try {
      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 }
        );
      }

      // Check if category has children
      const [child] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, existing.id))
        .limit(1);

      if (child) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot delete category with subcategories. Delete or reassign subcategories first.",
          },
          { status: 400 }
        );
      }

      await db.delete(categories).where(eq(categories.id, existing.id));

      await clearPublicContentCache();
      return NextResponse.json({
        success: true,
        message: "Category deleted",
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { success: false, message: "Server error" },
        { status: 500 }
      );
    }
});
