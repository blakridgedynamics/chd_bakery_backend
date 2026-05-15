import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticate } from "@/lib/auth-middleware";

export const GET = authenticate(async (_req: NextRequest, { user }) => {
  try {
    if (user.role !== "customer") {
      return errorResponse("Customer account required", 403);
    }

    const profile = await AuthService.getProfile(user.userId);
    const { role: _role, ...customerProfile } = profile;
    return successResponse(customerProfile, "Profile fetched");
  } catch (err) {
    const e = err as Error & { status?: number };
    return errorResponse(e.message ?? "Failed to fetch profile", e.status ?? 500);
  }
});
