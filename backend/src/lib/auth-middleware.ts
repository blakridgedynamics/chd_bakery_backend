import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAccessToken, JWTPayload } from "./jwt";
import { errorResponse } from "./api-response";

export type AuthedRequest = NextRequest & { user: JWTPayload };

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return req.cookies.get("access_token")?.value ?? null;
}

async function getCurrentUser(req: NextRequest): Promise<JWTPayload | Response> {
  const token = extractToken(req);
  if (!token) {
    return errorResponse("Authentication required", 401);
  }

  let payload: JWTPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return errorResponse("Invalid or expired token", 401);
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      isEmailVerified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user || !user.isActive) {
    return errorResponse("Account is not active", 403);
  }

  if (!user.isEmailVerified) {
    return errorResponse("Email verification required", 403);
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

function isResponse(value: JWTPayload | Response): value is Response {
  return typeof (value as Response).status === "number";
}

export function authenticate(
  handler: (
    req: NextRequest,
    ctx: { user: JWTPayload } & Record<string, unknown>
  ) => Promise<Response>
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const user = await getCurrentUser(req);
    if (isResponse(user)) return user;
    const routeCtx =
      args[0] && typeof args[0] === "object" ? (args[0] as Record<string, unknown>) : {};
    return handler(req, { ...routeCtx, user });
  };
}

export function authorizeAdmin(
  handler: (
    req: NextRequest,
    ctx: { user: JWTPayload } & Record<string, unknown>
  ) => Promise<Response>
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const user = await getCurrentUser(req);
    if (isResponse(user)) return user;
    if (user.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }
    const routeCtx =
      args[0] && typeof args[0] === "object" ? (args[0] as Record<string, unknown>) : {};
    return handler(req, { ...routeCtx, user });
  };
}

export function optionalAuth(
  handler: (
    req: NextRequest,
    ctx: { user: JWTPayload | null }
  ) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const token = extractToken(req);
    if (!token) {
      return handler(req, { user: null });
    }

    try {
      const payload = verifyAccessToken(token);
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          isEmailVerified: users.isEmailVerified,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user || !user.isActive || !user.isEmailVerified) {
        return handler(req, { user: null });
      }

      return handler(req, {
        user: { userId: user.id, email: user.email, role: user.role },
      });
    } catch {
      return handler(req, { user: null });
    }
  };
}
