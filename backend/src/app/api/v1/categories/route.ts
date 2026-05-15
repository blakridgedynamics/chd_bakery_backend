import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { cache, CacheKeys } from "@/lib/cache";
import {
  clearPublicContentCache,
  PUBLIC_CONTENT_TTL_SECONDS,
  publicJson,
} from "@/lib/public-cache";
import { eq, asc } from "drizzle-orm";

/* ==============================
   GET ALL CATEGORIES - Public
   Returns nested tree structure
================================*/
export async function GET() {
  try {
    const cached = await cache.get(CacheKeys.publicCategories());
    if (cached) {
      return publicJson({
        success: true,
        count: Array.isArray(cached) ? cached.length : 0,
        data: cached,
      });
    }

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    // Build tree: top-level categories with children nested inside
    const map = new Map<string, any>();
    const tree: any[] = [];

    // First pass: index all categories by id
    for (const cat of allCategories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    // Second pass: nest children under parents
    for (const cat of allCategories) {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(map.get(cat.id));
      } else {
        tree.push(map.get(cat.id));
      }
    }

    await cache.set(CacheKeys.publicCategories(), tree, PUBLIC_CONTENT_TTL_SECONDS);
    return publicJson({
      success: true,
      count: tree.length,
      data: tree,
    });
  } catch (error) {
    console.error(error);
    return publicJson({ success: false, message: "Server error" }, 500);
  }
}

/* ==============================
   CREATE CATEGORY (POST) - Admin only
================================*/
export const POST = authorizeAdmin(async (req) => {
  try {
    const body = await req.json();

    const {
      name,
      slug: slugFromBody,
      description,
      image,
      parent_id,
      parentId,
      sort_order,
      sortOrder,
      is_active,
      isActive,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "name is required" },
        { status: 400 }
      );
    }

    // Auto-generate slug from name if not provided
    const slug =
      slugFromBody ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const [duplicate] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    // If parent_id provided, verify it exists
    const normalizedParentId = parent_id ?? parentId ?? null;

    if (normalizedParentId) {
      const [parent] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, normalizedParentId))
        .limit(1);

      if (!parent) {
        return NextResponse.json(
          { success: false, message: "Parent category not found" },
          { status: 404 }
        );
      }
    }

    const [category] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description,
        image,
        parentId: normalizedParentId,
        sortOrder: sort_order ?? sortOrder ?? 0,
        isActive: is_active ?? isActive ?? true,
      })
      .returning();

    await clearPublicContentCache();
    return NextResponse.json(
      { success: true, message: "Category created", data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});
