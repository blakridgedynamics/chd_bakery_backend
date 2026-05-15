import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { registerVerifySchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authRateLimit, emailRateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";

function customerUser<T extends { role?: unknown }>(user: T) {
  const { role: _role, ...safeUser } = user;
  return safeUser;
}

export async function POST(req: NextRequest) {
  const ipLimit = await authRateLimit(req);
  if (!ipLimit.allowed) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await req.json();
    const validation = validateBody(registerVerifySchema, body);
    if (!validation.success) return validation.error;

    const emailLimit = await emailRateLimit(req, validation.data.email, {
      windowMs: 15 * 60 * 1000,
      max: 10,
      keyPrefix: "register_verify",
    });
    if (!emailLimit.allowed) {
      return errorResponse("Too many verification attempts. Please try again later.", 429);
    }

    const result = await AuthService.verifyRegistrationOtp(validation.data);
    return successResponse(
      {
        user: customerUser(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      "Registration verified",
      201
    );
  } catch (err) {
    const e = err as Error & { status?: number };
    return errorResponse(e.message ?? "Verification failed", e.status ?? 500);
  }
}
