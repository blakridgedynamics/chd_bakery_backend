import { eq, and, ilike, gte, lte, inArray, desc, asc, sql, or, ne } from "drizzle-orm";
import { db } from "@/db";
import { products, categories, reviews, recentlyViewed, wishlists } from "@/db/schema";
import { cache, CacheKeys } from "@/lib/cache";
import { makeUniqueSlug } from "@/lib/slugify";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validations/product";
import { v4 as uuidv4 } from "uuid";

export interface ProductFilters {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  tags?: string[];
  isFeatured?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular" | "rating";
  page?: number;
  limit?: number;
}

export const ProductService = {
  async create(input: CreateProductInput) {
    const slug = makeUniqueSlug(input.title, uuidv4().slice(0, 6));
    const [product] = await db
      .insert(products)
      .values({
        ...input,
        slug,
        price: String(input.price),
        discountPrice: input.discountPrice != null ? String(input.discountPrice) : null,
        weight: input.weight != null ? String(input.weight) : null,
        images: input.images ?? [],
        tags: input.tags ?? [],
        dimensions: input.dimensions ?? null,
      })
      .returning();
    await cache.delPattern("products:*");
    return product;
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing.length) {
      throw Object.assign(new Error("Product not found"), { status: 404 });
    }
    const updateData: Record<string, unknown> = {
      ...input,
      updatedAt: new Date(),
    };
    if (input.price !== undefined) updateData.price = String(input.price);
    if (input.discountPrice !== undefined) updateData.discountPrice = input.discountPrice != null ? String(input.discountPrice) : null;
    if (input.weight !== undefined) updateData.weight = input.weight != null ? String(input.weight) : null;
    if (input.title && input.title !== existing[0].title) {
      updateData.slug = makeUniqueSlug(input.title, uuidv4().slice(0, 6));
    }

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    await cache.del(CacheKeys.product(id));
    await cache.delPattern("products:*");
    return updated;
  },

  async updateRaw(id: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    await cache.del(CacheKeys.product(id));
    return updated;
  },

  async delete(id: string) {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) throw Object.assign(new Error("Product not found"), { status: 404 });
    await cache.del(CacheKeys.product(id));
    await cache.delPattern("products:*");
    return deleted;
  },

  async getById(id: string) {
    const cached = await cache.get(CacheKeys.product(id));
    if (cached) return cached;
    const [product] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .limit(1);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    const result = { ...product.products, category: product.categories };
    await cache.set(CacheKeys.product(id), result, 600);
    return result;
  },

  async getBySlug(slug: string) {
    const cached = await cache.get(CacheKeys.productSlug(slug));
    if (cached) return cached;
    const [product] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    const result = { ...product.products, category: product.categories };
    await cache.set(CacheKeys.productSlug(slug), result, 600);
    return result;
  },

  async list(filters: ProductFilters) {
    const cacheKey = CacheKeys.products(JSON.stringify(filters));
    const cached = await cache.get(cacheKey);
    if (cached) return cached as { items: unknown[]; total: number };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(products.isActive, true)];

    if (filters.keyword) {
      conditions.push(
        or(
          ilike(products.title, `%${filters.keyword}%`),
          ilike(products.description, `%${filters.keyword}%`)
        )!
      );
    }
    if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
    if (filters.minPrice != null) conditions.push(gte(products.price, String(filters.minPrice)));
    if (filters.maxPrice != null) conditions.push(lte(products.price, String(filters.maxPrice)));
    if (filters.minRating != null) conditions.push(gte(products.avgRating, String(filters.minRating)));
    if (filters.inStock) conditions.push(gte(products.stock, 1));
    if (filters.isFeatured != null) conditions.push(eq(products.isFeatured, filters.isFeatured));

    let orderBy;
    switch (filters.sortBy) {
      case "price_asc": orderBy = asc(products.price); break;
      case "price_desc": orderBy = desc(products.price); break;
      case "popular": orderBy = desc(products.soldCount); break;
      case "rating": orderBy = desc(products.avgRating); break;
      default: orderBy = desc(products.createdAt);
    }

    const [items, countResult] = await Promise.all([
      db.select().from(products).where(and(...conditions)).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(and(...conditions)),
    ]);

    const result = { items, total: countResult[0]?.count ?? 0 };
    await cache.set(cacheKey, result, 120);
    return result;
  },

  async getFeatured() {
    const cached = await cache.get(CacheKeys.featured());
    if (cached) return cached;
    const items = await db
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt))
      .limit(12);
    await cache.set(CacheKeys.featured(), items, 300);
    return items;
  },

  async getTrending() {
    const cached = await cache.get(CacheKeys.trending());
    if (cached) return cached;
    const items = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), gte(products.stock, 1)))
      .orderBy(desc(products.soldCount))
      .limit(20);
    await cache.set(CacheKeys.trending(), items, 600);
    return items;
  },

  async getSimilar(productId: string) {
    const cached = await cache.get(CacheKeys.similar(productId));
    if (cached) return cached;
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return [];
    const similar = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          ne(products.id, productId),
          product.categoryId ? eq(products.categoryId, product.categoryId) : sql`1=1`
        )
      )
      .orderBy(desc(products.avgRating))
      .limit(10);
    await cache.set(CacheKeys.similar(productId), similar, 300);
    return similar;
  },

  async getRecommended(userId: string) {
    const cached = await cache.get(CacheKeys.recommended(userId));
    if (cached) return cached;

    // Get user's recently viewed product categories
    const viewed = await db
      .select({ categoryId: products.categoryId })
      .from(recentlyViewed)
      .innerJoin(products, eq(recentlyViewed.productId, products.id))
      .where(eq(recentlyViewed.userId, userId))
      .limit(10);

    // Get user's wishlist categories
    const wished = await db
      .select({ categoryId: products.categoryId })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .limit(10);

const rawIds: (string | null)[] = [
  ...viewed.map((v) => v.categoryId),
  ...wished.map((w) => w.categoryId),
];
const categoryIds = Array.from(new Set(rawIds.filter((id): id is string => id !== null)));

    let recommended;
    if (categoryIds.length > 0) {
      recommended = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            gte(products.stock, 1),
            inArray(products.categoryId, categoryIds)
          )
        )
        .orderBy(desc(products.avgRating), desc(products.soldCount))
        .limit(20);
    } else {
      // Fallback to trending
      recommended = await db
        .select()
        .from(products)
        .where(and(eq(products.isActive, true), gte(products.stock, 1)))
        .orderBy(desc(products.soldCount))
        .limit(20);
    }

    await cache.set(CacheKeys.recommended(userId), recommended, 600);
    return recommended;
  },

  async trackView(userId: string, productId: string) {
    try {
      await db
        .insert(recentlyViewed)
        .values({ userId, productId })
        .onConflictDoUpdate({
          target: [recentlyViewed.userId, recentlyViewed.productId],
          set: { viewedAt: new Date() },
        });
      await cache.del(CacheKeys.recommended(userId));
    } catch {
      // Non-blocking
    }
  },

  async getLowStock(threshold = 5) {
    return db.select().from(products)
      .where(and(eq(products.isActive, true), lte(products.stock, threshold)))
      .orderBy(asc(products.stock));
  },

  async bulkUpdateStock(items: { productId: string; stock: number }[]) {
    const results = await Promise.all(
      items.map(({ productId, stock }) =>
        db.update(products).set({ stock, updatedAt: new Date() }).where(eq(products.id, productId)).returning()
      )
    );
    await cache.delPattern("products:*");
    return results.flat();
  },
};
