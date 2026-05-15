import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { changePasswordSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticate } from "@/lib/auth-middleware";
import { validateBody } from "@/lib/validate";

export const POST = authenticate(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const validation = validateBody(changePasswordSchema, body);
    if (!validation.success) return validation.error;

    await AuthService.changePassword(
      user.userId,
      validation.data.currentPassword,
      validation.data.newPassword
    );
    return successResponse(null, "Password changed successfully");
  } catch (err) {
    const e = err as Error & { status?: number };
    return errorResponse(e.message ?? "Password change failed", e.status ?? 500);
  }
});
