import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { refreshTokenSchema } from "@/lib/validations/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateBody } from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(refreshTokenSchema, body);
    if (!validation.success) return validation.error;

    const tokens = await AuthService.refreshTokens(validation.data.refreshToken);
    return successResponse(tokens, "Tokens refreshed");
  } catch (err) {
    const e = err as Error & { status?: number };
    return errorResponse(e.message ?? "Token refresh failed", e.status ?? 500);
  }
}
