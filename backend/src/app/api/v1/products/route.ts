// src/app/api/v1/products/route.ts
// Public — no auth required.
// FIX: was returning ALL products (including inactive) with no pagination.
// Now: only active products, paginated, with optional search + category filter.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { cache, CacheKeys } from "@/lib/cache";
import { publicCacheHeaders } from "@/lib/public-cache";
import { eq, and, ilike, or, desc, asc, count } from "drizzle-orm";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cacheKey = CacheKeys.products(searchParams.toString() || "default");
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: publicCacheHeaders });
    }

    // ── Pagination ─────────────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    // ── Filters ────────────────────────────────────────────────────────────
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId")?.trim();
    const sortBy = searchParams.get("sortBy"); // "price_asc" | "price_desc" | "rating" | "newest"

    // Build WHERE clause — always restrict to active products.
    const conditions = [eq(products.isActive, true)];

    if (search) {
      conditions.push(
        or(
          ilike(products.title, `%${search}%`),
          ilike(products.shortDescription, `%${search}%`)
        )!
      );
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    const where = and(...conditions);

    // ── Sort ───────────────────────────────────────────────────────────────
    const orderBy = (() => {
      switch (sortBy) {
        case "price_asc":  return asc(products.price);
        case "price_desc": return desc(products.price);
        case "rating":     return desc(products.avgRating);
        default:           return desc(products.createdAt); // newest first
      }
    })();

    // ── Query ─────────────────────────────────────────────────────────────
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id:               products.id,
          title:            products.title,
          slug:             products.slug,
          description:      products.description,
          shortDescription: products.shortDescription,
          price:            products.price,
          discountPrice:    products.discountPrice,
          images:           products.images,
          avgRating:        products.avgRating,
          reviewCount:      products.reviewCount,
          stock:            products.stock,
          isFeatured:       products.isFeatured,
          categoryId:       products.categoryId,
          tags:             products.tags,
          createdAt:        products.createdAt,
        })
        .from(products)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(products)
        .where(where),
    ]);

    const totalPages = Math.ceil(Number(total) / limit);

    const payload = {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    await cache.set(cacheKey, payload, 120);
    return NextResponse.json(payload, { headers: publicCacheHeaders });
  } catch (error) {
    console.error("[GET /products]", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
