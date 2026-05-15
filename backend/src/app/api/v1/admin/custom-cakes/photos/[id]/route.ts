import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customCakePhotos } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { idParamSchema, updateCustomCakePhotoSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = authorizeAdmin(async (req: NextRequest, _ctx: unknown) => {
  const { id } = await ((_ctx as Ctx).params);
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid photo id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const body = await req.json();
    const validation = validateBody(updateCustomCakePhotoSchema, body);
    if (!validation.success) return validation.error;

    const input = validation.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
    if (input.altText !== undefined) updateData.altText = input.altText ?? null;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [photo] = await db
      .update(customCakePhotos)
      .set(updateData)
      .where(eq(customCakePhotos.id, id))
      .returning();

    if (!photo) return errorResponse("Custom cake photo not found", 404);
    await clearPublicContentCache();
    return successResponse(photo, "Custom cake photo updated");
  } catch (err) {
    console.error("[PATCH /admin/custom-cakes/photos/:id]", err);
    return errorResponse("Server error", 500);
  }
});

export const DELETE = authorizeAdmin(async (_req: NextRequest, _ctx: unknown) => {
  const { id } = await ((_ctx as Ctx).params);
  const idValidation = idParamSchema.safeParse(id);
  if (!idValidation.success) {
    return errorResponse("Invalid photo id", 400, idValidation.error.issues[0]?.message);
  }

  try {
    const [deleted] = await db
      .delete(customCakePhotos)
      .where(eq(customCakePhotos.id, id))
      .returning();

    if (!deleted) return errorResponse("Custom cake photo not found", 404);
    await clearPublicContentCache();
    return successResponse(null, "Custom cake photo deleted");
  } catch (err) {
    console.error("[DELETE /admin/custom-cakes/photos/:id]", err);
    return errorResponse("Server error", 500);
  }
});
