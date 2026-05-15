import { NextRequest } from "next/server";
import { z } from "zod";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, users } from "@/db/schema";
import { authorizeAdmin, optionalAuth } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return `${hasPlus ? "+" : ""}${digits}`;
};

const guestMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z
    .preprocess(
      normalizePhone,
      z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number").optional().nullable()
    ),
  subject: z.preprocess(
    emptyToNull,
    z.string().trim().max(255).optional().nullable()
  ),
  message: z.string().trim().min(5).max(5000),
});

const authedMessageSchema = z.object({
  subject: z.preprocess(
    emptyToNull,
    z.string().trim().max(255).optional().nullable()
  ),
  message: z.string().trim().min(5).max(5000),
});

export const POST = optionalAuth(async (req: NextRequest, { user }) => {
  const limitResult = await rateLimit(req, {
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "contact",
  });
  if (!limitResult.allowed) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await req.json();
    const validation = validateBody(
      user ? authedMessageSchema : guestMessageSchema,
      body
    );
    if (!validation.success) return validation.error;

    if (user) {
      const input = validation.data as z.infer<typeof authedMessageSchema>;
      const [sender] = await db
        .select({
          name: users.name,
          email: users.email,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, user.userId))
        .limit(1);

      if (!sender) {
        return errorResponse("Account not found", 404);
      }

      await db.insert(contactMessages).values({
        name: sender.name,
        email: sender.email,
        phone: sender.phone ?? null,
        subject: input.subject ?? null,
        message: input.message,
      });
    } else {
      const input = validation.data as z.infer<typeof guestMessageSchema>;
      await db.insert(contactMessages).values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject ?? null,
        message: input.message,
      });
    }

    return successResponse(null, "Message received. We'll get back to you soon.", 201);
  } catch (err) {
    console.error("[POST /messages]", err);
    return errorResponse("Server error", 500);
  }
});

export const GET = authorizeAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20) || 20));
    const unreadOnly = searchParams.get("unread") === "true";
    const offset = (page - 1) * limit;
    const where = unreadOnly ? eq(contactMessages.isRead, false) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(contactMessages)
        .where(where)
        .orderBy(desc(contactMessages.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(contactMessages).where(where),
    ]);

    return successResponse(
      {
        data: rows,
        pagination: {
          page,
          limit,
          total: Number(total),
          pages: Math.ceil(Number(total) / limit),
        },
      },
      "Messages fetched"
    );
  } catch (err) {
    console.error("[GET /messages]", err);
    return errorResponse("Server error", 500);
  }
});
