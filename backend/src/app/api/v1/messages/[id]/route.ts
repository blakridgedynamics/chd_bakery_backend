import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { idParamSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

const updateMessageSchema = z.object({
  isRead: z.boolean().default(true),
});

export const PATCH = authorizeAdmin(async (req: NextRequest, ctx) => {
  try {
    const { params } = ctx as unknown as Ctx;
    const { id } = await params;
    const idValidation = idParamSchema.safeParse(id);
    if (!idValidation.success) {
      return errorResponse("Invalid message id", 400, idValidation.error.issues[0]?.message);
    }

    const body = await req.json().catch(() => ({}));
    const validation = validateBody(updateMessageSchema, body);
    if (!validation.success) return validation.error;

    const [updated] = await db
      .update(contactMessages)
      .set({ isRead: validation.data.isRead, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();

    if (!updated) return errorResponse("Message not found", 404);
    return successResponse(updated, "Updated");
  } catch (err) {
    console.error("[PATCH /messages/:id]", err);
    return errorResponse("Server error", 500);
  }
});

export const DELETE = authorizeAdmin(async (_req: NextRequest, ctx) => {
  try {
    const { params } = ctx as unknown as Ctx;
    const { id } = await params;
    const idValidation = idParamSchema.safeParse(id);
    if (!idValidation.success) {
      return errorResponse("Invalid message id", 400, idValidation.error.issues[0]?.message);
    }

    const [deleted] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning();

    if (!deleted) return errorResponse("Message not found", 404);
    return successResponse(null, "Message deleted");
  } catch (err) {
    console.error("[DELETE /messages/:id]", err);
    return errorResponse("Server error", 500);
  }
});
