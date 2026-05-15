import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

type Ctx = { params: Promise<{ slug: string }> };

/* ==============================
   GET PRODUCTS BY CATEGORY - Public
   GET /api/v1/categories/:slug/products

   Query params:
   - page        (default: 1)
   - limit       (default: 10, max: 100)
   - sort        (price_asc, price_desc, newest, oldest, popular)
================================*/
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;

    // Find the category first
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const offset = (page - 1) * limit;
    const sort = searchParams.get("sort") ?? "newest";

    const orderBy = {
      price_asc:  asc(products.price),
      price_desc: desc(products.price),
      newest:     desc(products.createdAt),
      oldest:     asc(products.createdAt),
      popular:    desc(products.soldCount),
    }[sort] ?? desc(products.createdAt);

    const whereClause = and(
      eq(products.categoryId, category.id),
      eq(products.isActive, true)
    );

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(products)
        .where(whereClause),
    ]);

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      success: true,
      category: { id: category.id, name: category.name, slug: category.slug },
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}