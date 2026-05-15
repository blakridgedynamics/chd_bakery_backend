import { NextRequest } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const GET = authorizeAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20) || 20));
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;
    const where =
      status === "approved"
        ? eq(reviews.isApproved, true)
        : status === "pending"
          ? eq(reviews.isApproved, false)
          : undefined;

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          body: reviews.body,
          isApproved: reviews.isApproved,
          isVerifiedPurchase: reviews.isVerifiedPurchase,
          helpfulVotes: reviews.helpfulVotes,
          images: reviews.images,
          createdAt: reviews.createdAt,
          user: { id: users.id, name: users.name, email: users.email },
          product: { id: products.id, title: products.title, slug: products.slug },
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .leftJoin(products, eq(reviews.productId, products.id))
        .where(where)
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(reviews).where(where),
    ]);

    const totalPages = Math.ceil(Number(total) / limit);
    return successResponse(
      items,
      "Reviews fetched",
      200,
      {
        page,
        limit,
        total: Number(total),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    );
  } catch (err) {
    console.error("[GET /admin/reviews]", err);
    return errorResponse("Server error", 500);
  }
});
