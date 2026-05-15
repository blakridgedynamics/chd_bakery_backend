import { and, desc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, reviews, users } from "@/db/schema";
import { cache, CacheKeys } from "@/lib/cache";
import { hashPassword } from "@/lib/password";
import type { CreateCategoryInput } from "@/lib/validations/user";

export const AdminService = {
  async getDashboardStats() {
    const cached = await cache.get(CacheKeys.analytics());
    if (cached) return cached;

    const [totalUsers, totalProducts, activeProducts, lowStock, pendingReviews] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.role, "customer")),
        db.select({ count: sql<number>`count(*)::int` }).from(products),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.isActive, true)),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(
            and(eq(products.isActive, true), lte(products.stock, products.lowStockThreshold))
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(reviews)
          .where(eq(reviews.isApproved, false)),
      ]);

    const stats = {
      totalUsers: totalUsers[0]?.count ?? 0,
      totalProducts: totalProducts[0]?.count ?? 0,
      activeProducts: activeProducts[0]?.count ?? 0,
      lowStockProducts: lowStock[0]?.count ?? 0,
      pendingReviews: pendingReviews[0]?.count ?? 0,
    };

    await cache.set(CacheKeys.analytics(), stats, 300);
    return stats;
  },

  async getTopProducts(limit = 10) {
    return db
      .select({
        id: products.id,
        title: products.title,
        soldCount: products.soldCount,
        stock: products.stock,
        price: products.price,
        images: products.images,
        avgRating: products.avgRating,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.soldCount), desc(products.createdAt))
      .limit(limit);
  },

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    const condition = search
      ? sql`(name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})`
      : undefined;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
          isEmailVerified: users.isEmailVerified,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(condition)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(condition),
    ]);

    return { items, total: countResult[0]?.count ?? 0 };
  },

  async toggleUserStatus(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const [updated] = await db
      .update(users)
      .set({ isActive: !user.isActive, updatedAt: new Date(), refreshToken: null })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
      });

    return updated;
  },

  async makeAdmin(userId: string) {
    const [updated] = await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date(), refreshToken: null })
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, role: users.role });
    return updated;
  },

  async createCategory(input: CreateCategoryInput) {
    const { makeSlug } = await import("@/lib/slugify");
    const slug = makeSlug(input.name) + "-" + Date.now().toString(36);
    const [cat] = await db.insert(categories).values({ ...input, slug }).returning();
    await cache.del(CacheKeys.categories());
    return cat;
  },

  async updateCategory(id: string, input: Partial<CreateCategoryInput>) {
    const [updated] = await db
      .update(categories)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) throw Object.assign(new Error("Category not found"), { status: 404 });

    await cache.del(CacheKeys.categories());
    await cache.del(CacheKeys.category(id));
    return updated;
  },

  async deleteCategory(id: string) {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) throw Object.assign(new Error("Category not found"), { status: 404 });
    await cache.del(CacheKeys.categories());
    return deleted;
  },

  async getCategories() {
    const cached = await cache.get(CacheKeys.categories());
    if (cached) return cached;

    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    await cache.set(CacheKeys.categories(), cats, 600);
    return cats;
  },

  async getAllCategories() {
    return db.select().from(categories).orderBy(categories.sortOrder);
  },

  async getPendingReviews(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, countResult] = await Promise.all([
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          body: reviews.body,
          images: reviews.images,
          createdAt: reviews.createdAt,
          user: { id: users.id, name: users.name, email: users.email },
          product: { id: products.id, title: products.title, slug: products.slug },
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .leftJoin(products, eq(reviews.productId, products.id))
        .where(eq(reviews.isApproved, false))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.isApproved, false)),
    ]);
    return { items, total: countResult[0]?.count ?? 0 };
  },

  async approveReview(reviewId: string) {
    const [review] = await db
      .update(reviews)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();
    if (!review) throw Object.assign(new Error("Review not found"), { status: 404 });

    const stats = await db
      .select({
        avg: sql<number>`avg(rating)::numeric(3,2)`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, review.productId), eq(reviews.isApproved, true)));

    await db
      .update(products)
      .set({
        avgRating: String(stats[0]?.avg ?? 0),
        reviewCount: stats[0]?.count ?? 0,
      })
      .where(eq(products.id, review.productId));

    return review;
  },

  async deleteReview(reviewId: string) {
    const [deleted] = await db.delete(reviews).where(eq(reviews.id, reviewId)).returning();
    if (!deleted) throw Object.assign(new Error("Review not found"), { status: 404 });
    return deleted;
  },

  async createAdminUser(name: string, email: string, password: string) {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      throw Object.assign(new Error("Email already exists"), { status: 409 });
    }

    const hashed = await hashPassword(password);
    const [admin] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: "admin",
        isEmailVerified: true,
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return admin;
  },
};
