import { NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return successResponse(rows, "Categories fetched");
  } catch (err) {
    console.error("[GET /admin/categories]", err);
    return errorResponse("Server error", 500);
  }
});
