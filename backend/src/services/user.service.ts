import { eq, and, desc, sql, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  addresses,
  wishlists,
  recentlyViewed,
  searchHistory,
  products,
  reviews,
} from "@/db/schema";
import { RECENTLY_VIEWED_MAX, SEARCH_HISTORY_MAX } from "@/lib/constants";
import type { AddressInput, UpdateProfileInput, CreateReviewInput } from "@/lib/validations/user";

export const UserService = {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const [updated] = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    const { password: _p, refreshToken: _r, ...safe } = updated;
    return safe;
  },

  // ─── Addresses ──────────────────────────────────────────────────────────────

  async getAddresses(userId: string) {
    return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
  },

  async addAddress(userId: string, input: AddressInput) {
    if (input.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [addr] = await db.insert(addresses).values({ ...input, userId }).returning();
    return addr;
  },

  async updateAddress(userId: string, addressId: string, input: AddressInput) {
    const [existing] = await db.select().from(addresses).where(
      and(eq(addresses.id, addressId), eq(addresses.userId, userId))
    ).limit(1);
    if (!existing) throw Object.assign(new Error("Address not found"), { status: 404 });

    if (input.isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(
        and(eq(addresses.userId, userId), ne(addresses.id, addressId))
      );
    }

    const [updated] = await db.update(addresses).set({ ...input }).where(
      and(eq(addresses.id, addressId), eq(addresses.userId, userId))
    ).returning();
    return updated;
  },

  async deleteAddress(userId: string, addressId: string) {
    const [deleted] = await db.delete(addresses).where(
      and(eq(addresses.id, addressId), eq(addresses.userId, userId))
    ).returning();
    if (!deleted) throw Object.assign(new Error("Address not found"), { status: 404 });
    return deleted;
  },

  async setDefaultAddress(userId: string, addressId: string) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    const [updated] = await db.update(addresses).set({ isDefault: true }).where(
      and(eq(addresses.id, addressId), eq(addresses.userId, userId))
    ).returning();
    if (!updated) throw Object.assign(new Error("Address not found"), { status: 404 });
    return updated;
  },

  // ─── Wishlist ──────────────────────────────────────────────────────────────

  async getWishlist(userId: string) {
    return db
      .select({
        id: wishlists.id,
        createdAt: wishlists.createdAt,
        product: {
          id: products.id,
          title: products.title,
          slug: products.slug,
          price: products.price,
          discountPrice: products.discountPrice,
          images: products.images,
          stock: products.stock,
          avgRating: products.avgRating,
        },
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));
  },

  async addToWishlist(userId: string, productId: string) {
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    await db.insert(wishlists).values({ userId, productId }).onConflictDoNothing();
    return { added: true };
  },

  async removeFromWishlist(userId: string, productId: string) {
    await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
    return { removed: true };
  },

  // ─── Recently Viewed ────────────────────────────────────────────────────────

  async getRecentlyViewed(userId: string) {
    return db
      .select({
        id: recentlyViewed.id,
        viewedAt: recentlyViewed.viewedAt,
        product: {
          id: products.id,
          title: products.title,
          slug: products.slug,
          price: products.price,
          discountPrice: products.discountPrice,
          images: products.images,
          avgRating: products.avgRating,
        },
      })
      .from(recentlyViewed)
      .innerJoin(products, eq(recentlyViewed.productId, products.id))
      .where(eq(recentlyViewed.userId, userId))
      .orderBy(desc(recentlyViewed.viewedAt))
      .limit(RECENTLY_VIEWED_MAX);
  },

  // ─── Search History ─────────────────────────────────────────────────────────

  async addSearchHistory(userId: string, query: string, resultCount: number) {
    await db.insert(searchHistory).values({ userId, query, resultCount }).catch(() => {});
    // Keep only last N searches
    const all = await db.select({ id: searchHistory.id }).from(searchHistory)
      .where(eq(searchHistory.userId, userId)).orderBy(desc(searchHistory.searchedAt));
    if (all.length > SEARCH_HISTORY_MAX) {
      const toDelete = all.slice(SEARCH_HISTORY_MAX).map((r) => r.id);
      await db.delete(searchHistory).where(sql`id = ANY(${toDelete})`);
    }
  },

  async getSearchHistory(userId: string) {
    return db.select().from(searchHistory).where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchedAt)).limit(SEARCH_HISTORY_MAX);
  },

  async clearSearchHistory(userId: string) {
    await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
  },

  // ─── Reviews ────────────────────────────────────────────────────────────────

  async createReview(userId: string, input: CreateReviewInput) {
    const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });

    const [review] = await db.insert(reviews).values({
      ...input,
      userId,
      isApproved: false,
    }).returning();

    // Recalculate product rating
    const stats = await db.select({
      avg: sql<number>`avg(rating)::numeric(3,2)`,
      count: sql<number>`count(*)::int`,
    }).from(reviews).where(and(eq(reviews.productId, input.productId), eq(reviews.isApproved, true)));

    await db.update(products).set({
      avgRating: String(stats[0]?.avg ?? 0),
      reviewCount: stats[0]?.count ?? 0,
      updatedAt: new Date(),
    }).where(eq(products.id, input.productId));

    return review;
  },

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [items, countResult] = await Promise.all([
      db.select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        helpfulVotes: reviews.helpfulVotes,
        images: reviews.images,
        createdAt: reviews.createdAt,
        user: { id: users.id, name: users.name },
      })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
        .orderBy(desc(reviews.helpfulVotes), desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true))),
    ]);
    return { items, total: countResult[0]?.count ?? 0 };
  },
};
