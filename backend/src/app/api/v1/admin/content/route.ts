import { NextRequest } from "next/server";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { announcements, banners, customCakePhotos, siteSettings } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const [bannerRows, announcementRows, photoRows, settingsRows] = await Promise.all([
      db
        .select()
        .from(banners)
        .orderBy(asc(banners.sortOrder), desc(banners.createdAt)),
      db
        .select()
        .from(announcements)
        .orderBy(asc(announcements.sortOrder), desc(announcements.createdAt)),
      db
        .select()
        .from(customCakePhotos)
        .orderBy(asc(customCakePhotos.sortOrder), desc(customCakePhotos.createdAt)),
      db
        .select()
        .from(siteSettings)
        .orderBy(asc(siteSettings.createdAt))
        .limit(1),
    ]);

    return successResponse(
      {
        banners: bannerRows,
        announcements: announcementRows,
        customCakePhotos: photoRows,
        siteSettings: settingsRows[0] ?? null,
      },
      "Admin content fetched"
    );
  } catch (err) {
    console.error("[GET /admin/content]", err);
    return errorResponse("Server error", 500);
  }
});
