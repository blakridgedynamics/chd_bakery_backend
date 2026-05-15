import { NextRequest } from "next/server";
import { authorizeAdmin } from "@/lib/auth-middleware";
import { successResponse } from "@/lib/api-response";

export const GET = authorizeAdmin(async (_req: NextRequest, { user }) => {
  return successResponse(user, "Admin session valid");
});
