import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";

export const GET = authorizeAdmin(async (_req: NextRequest) => {
  try {
    const stats = await AdminService.getDashboardStats();
    return successResponse(stats, "Stats fetched");
  } catch (err) {
    console.error("[GET /admin/stats]", err);
    return errorResponse("Server error", 500);
  }
});
