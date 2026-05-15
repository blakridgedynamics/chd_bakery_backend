import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { passwordOtpRequestSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authRateLimit, emailRateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const ipLimit = await authRateLimit(req);
  if (!ipLimit.allowed) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await req.json();
    const validation = validateBody(passwordOtpRequestSchema, body);
    if (!validation.success) return validation.error;

    const emailLimit = await emailRateLimit(req, validation.data.email, {
      windowMs: 15 * 60 * 1000,
      max: 3,
      keyPrefix: "password_otp",
    });
    if (!emailLimit.allowed) {
      return errorResponse("Too many OTP requests. Please try again later.", 429);
    }

    await AuthService.requestPasswordResetOtp(validation.data);
    return successResponse(null, "If that email exists, an OTP has been sent.");
  } catch (err) {
    const e = err as Error & { status?: number };
    return errorResponse(e.message ?? "Could not send OTP", e.status ?? 500);
  }
}
