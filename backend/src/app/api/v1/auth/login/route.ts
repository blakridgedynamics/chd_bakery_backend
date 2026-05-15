import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authRateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";

function customerUser<T extends { role?: unknown }>(user: T) {
  const { role: _role, ...safeUser } = user;
  return safeUser;
}

export async function POST(req: NextRequest) {
  const limit = await authRateLimit(req);
  if (!limit.allowed) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  let audience: "customer" | "admin" = "customer";

  try {
    const body = await req.json();
    const validation = validateBody(loginSchema, body);
    if (!validation.success) return validation.error;
    audience = validation.data.audience;

    const result = await AuthService.login(validation.data);
    const user =
      validation.data.audience === "admin" ? result.user : customerUser(result.user);

    return successResponse(
      { user, accessToken: result.accessToken, refreshToken: result.refreshToken },
      "Login successful"
    );
  } catch (err) {
    const e = err as Error & { status?: number };
    if (audience === "customer" && e.status && e.status < 500) {
      return errorResponse("Invalid credentials", 401);
    }
    return errorResponse(e.message ?? "Login failed", e.status ?? 500);
  }
}
