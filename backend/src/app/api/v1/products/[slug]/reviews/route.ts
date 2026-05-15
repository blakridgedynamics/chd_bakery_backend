import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

type Ctx = { params: Promise<{ slug: string }> };

/* ==============================
   GET REVIEWS FOR A PRODUCT - Public
   GET /api/v1/products/:slug/reviews
================================*/
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const productReviews = await db
      .select({
        id:                 reviews.id,
        rating:             reviews.rating,
        title:              reviews.title,
        body:               reviews.body,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        helpfulVotes:       reviews.helpfulVotes,
        images:             reviews.images,
        createdAt:          reviews.createdAt,
        userId:             reviews.userId,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, product.id),
          eq(reviews.isApproved, true)
        )
      )
      .orderBy(sql`${reviews.createdAt} desc`);

    return NextResponse.json({
      success: true,
      count:   productReviews.length,
      rating:  product.avgRating,
      data:    productReviews,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Customer review submission is disabled",
    },
    { status: 403 }
  );
}
