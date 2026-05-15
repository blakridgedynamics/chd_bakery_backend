// src/app/api/v1/reviews/[id]/route.ts
//
// FIX: The DELETE handler was in /reviews/route.ts but used { params: { id } }
//      which only works at /reviews/[id]/route.ts. Moved here so the route
//      actually receives the review ID from the URL segment.
//
// Place this file at:  src/app/api/v1/reviews/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/api-response";
import { idParamSchema } from "@/lib/validations/admin";
import { AdminService } from "@/services/admin.service";
import { eq, and, sql } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/v1/reviews/:id  (admin approve) ─────────────────────────── */
export const PATCH = authorizeAdmin(async (_req: NextRequest, _ctx: unknown) => {
  const { id } = await (_ctx as Ctx).params;
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid review id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const review = await AdminService.approveReview(id);
    return NextResponse.json({ success: true, data: review, message: "Review approved" });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
    const message = error instanceof Error ? error.message : "Server error";
    console.error("[PATCH /reviews/:id]", error);
    return errorResponse(message, status);
  }
});

/* ── DELETE /api/v1/reviews/:id  (admin only) ───────────────────────────── */
export const DELETE = authorizeAdmin(async (_req: NextRequest, _ctx: unknown) => {
  const { id } = await (_ctx as Ctx).params;
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid review id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    await db.delete(reviews).where(eq(reviews.id, id));

    // Recalculate product rating after deletion.
    const [stats] = await db
      .select({
        avgRating:   sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 2), 0)`,
        reviewCount: sql<number>`cast(count(*) as integer)`,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, review.productId),
          eq(reviews.isApproved, true)
        )
      );

    await db
      .update(products)
      .set({
        avgRating:   String(stats.avgRating),
        reviewCount: stats.reviewCount,
        updatedAt:   new Date(),
      })
      .where(eq(products.id, review.productId));

    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("[DELETE /reviews/:id]", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
});
