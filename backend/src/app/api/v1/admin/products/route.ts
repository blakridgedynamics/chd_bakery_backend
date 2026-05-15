import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { createProductSchema } from "@/lib/validations/product";
import { errorResponse, successResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { validateBody } from "@/lib/validate";
import { eq, desc } from "drizzle-orm";

export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const rows = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    const data = rows.map(({ products: p, categories: c }) => ({
      ...p,
      category: c ?? null,
    }));

    return successResponse(data, "Products fetched");
  } catch (err) {
    console.error("[GET /admin/products]", err);
    return errorResponse("Server error", 500);
  }
});

export const POST = authorizeAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createProductSchema, body);
    if (!validation.success) return validation.error;

    const input = validation.data;
    const slug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    const [product] = await db
      .insert(products)
      .values({
        title: input.title,
        slug,
        sku: input.sku,
        price: String(input.price),
        discountPrice:
          input.discountPrice != null ? String(input.discountPrice) : null,
        categoryId: input.categoryId ?? null,
        description: input.description,
        shortDescription: input.shortDescription ?? null,
        stock: input.stock,
        lowStockThreshold: input.lowStockThreshold,
        isFeatured: input.isFeatured,
        isActive: input.isActive,
        images: input.images,
        tags: input.tags,
        weight: input.weight != null ? String(input.weight) : null,
        dimensions: input.dimensions ?? null,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        soldCount: 0,
      })
      .returning();

    await clearPublicContentCache();
    return successResponse(product, "Product created", 201);
  } catch (err) {
    const e = err as Error & { code?: string };
    console.error("[POST /admin/products]", err);
    if (e.code === "23505") {
      return errorResponse("A product with this SKU or slug already exists", 409);
    }
    return errorResponse("Server error", 500);
  }
});
