import { NextRequest } from "next/server";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { customCakePhotos } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { createCustomCakePhotoSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";

export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const photos = await db
      .select()
      .from(customCakePhotos)
      .orderBy(asc(customCakePhotos.sortOrder), desc(customCakePhotos.createdAt));

    return successResponse(photos, "Custom cake photos fetched");
  } catch (err) {
    console.error("[GET /admin/custom-cakes/photos]", err);
    return errorResponse("Server error", 500);
  }
});

export const POST = authorizeAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(createCustomCakePhotoSchema, body);
    if (!validation.success) return validation.error;

    const input = validation.data;
    const [photo] = await db
      .insert(customCakePhotos)
      .values({
        title: input.title,
        imageUrl: input.imageUrl,
        altText: input.altText ?? null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      })
      .returning();

    await clearPublicContentCache();
    return successResponse(photo, "Custom cake photo created", 201);
  } catch (err) {
    console.error("[POST /admin/custom-cakes/photos]", err);
    return errorResponse("Server error", 500);
  }
});
