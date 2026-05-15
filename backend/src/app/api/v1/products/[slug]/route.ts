import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ slug: string }> };

/* ==============================
   GET SINGLE PRODUCT - Public
================================*/
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

