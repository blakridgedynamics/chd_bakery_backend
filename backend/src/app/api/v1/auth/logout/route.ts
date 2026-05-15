import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticate } from "@/lib/auth-middleware";

export const POST = authenticate(async (_req: NextRequest, { user }) => {
  try {
    await AuthService.logout(user.userId);
    return successResponse(null, "Logged out successfully");
  } catch (err) {
    const e = err as Error & { status?: number };
    return errorResponse(e.message ?? "Logout failed", e.status ?? 500);
  }
});
