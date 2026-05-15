import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { clearPublicContentCache } from "@/lib/public-cache";
import { siteSettingsSchema } from "@/lib/validations/admin";
import { validateBody } from "@/lib/validate";

export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const [settings] = await db
      .select()
      .from(siteSettings)
      .orderBy(asc(siteSettings.createdAt))
      .limit(1);

    return successResponse(settings ?? null, "Site settings fetched");
  } catch (err) {
    console.error("[GET /admin/site-settings]", err);
    return errorResponse("Server error", 500);
  }
});

export const PATCH = authorizeAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validation = validateBody(siteSettingsSchema, body);
    if (!validation.success) return validation.error;

    const input = validation.data;
    const values = {
      brandName: input.brandName,
      tagline: input.tagline ?? null,
      footerNote: input.footerNote ?? null,
      phone: input.phone ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      instagramUrl: input.instagramUrl ?? null,
      deliveryAreas: input.deliveryAreas ?? [],
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .orderBy(asc(siteSettings.createdAt))
      .limit(1);

    const [settings] = existing
      ? await db
          .update(siteSettings)
          .set(values)
          .where(eq(siteSettings.id, existing.id))
          .returning()
      : await db
          .insert(siteSettings)
          .values(values)
          .returning();

    await clearPublicContentCache();
    return successResponse(settings, "Site settings saved");
  } catch (err) {
    console.error("[PATCH /admin/site-settings]", err);
    return errorResponse("Server error", 500);
  }
});
