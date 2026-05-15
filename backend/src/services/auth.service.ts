import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { emailOtps, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { sendOtpEmail } from "@/lib/email";
import type {
  LoginInput,
  PasswordOtpRequestInput,
  PasswordResetWithOtpInput,
  RegisterRequestOtpInput,
  RegisterVerifyInput,
} from "@/lib/validations/auth";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

type OtpPurpose = "registration" | "password_reset";

export type SafeUser = Omit<
  typeof users.$inferSelect,
  "password" | "refreshToken" | "avatar"
>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function stripSensitive(user: typeof users.$inferSelect): SafeUser {
  const {
    password: _password,
    refreshToken: _refreshToken,
    avatar: _avatar,
    ...safe
  } = user;
  return safe;
}

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashOtp(otp: string) {
  return hashToken(otp);
}

function safeCompareHash(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

async function issueTokens(user: typeof users.$inferSelect) {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await db
    .update(users)
    .set({ refreshToken: hashToken(refreshToken), lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  return { accessToken, refreshToken };
}

async function upsertOtp(input: {
  email: string;
  purpose: OtpPurpose;
  name?: string | null;
  phone?: string | null;
}) {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.email, input.email),
        eq(emailOtps.purpose, input.purpose),
        isNull(emailOtps.consumedAt)
      )
    )
    .limit(1);

  if (existing && existing.resendAvailableAt > now && existing.expiresAt > now) {
    throw Object.assign(new Error("Please wait before requesting another OTP"), {
      status: 429,
    });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const values = {
    email: input.email,
    purpose: input.purpose,
    name: input.name ?? null,
    phone: input.phone ?? null,
    otpHash,
    attempts: 0,
    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
    consumedAt: null,
    updatedAt: now,
  };

  await db
    .insert(emailOtps)
    .values(values)
    .onConflictDoUpdate({
      target: [emailOtps.email, emailOtps.purpose],
      set: values,
    });

  return otp;
}

async function verifyOtp(email: string, purpose: OtpPurpose, otp: string) {
  const now = new Date();
  const [record] = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.email, email),
        eq(emailOtps.purpose, purpose),
        isNull(emailOtps.consumedAt)
      )
    )
    .limit(1);

  if (!record || record.expiresAt <= now || record.attempts >= OTP_MAX_ATTEMPTS) {
    throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
  }

  const valid = record.otpHash.startsWith("$2")
    ? await verifyPassword(otp, record.otpHash)
    : safeCompareHash(hashOtp(otp), record.otpHash);
  if (!valid) {
    const attempts = record.attempts + 1;
    await db
      .update(emailOtps)
      .set({
        attempts,
        consumedAt: attempts >= OTP_MAX_ATTEMPTS ? now : null,
        updatedAt: now,
      })
      .where(eq(emailOtps.id, record.id));

    throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
  }

  return record;
}

async function consumeOtp(id: string) {
  await db
    .update(emailOtps)
    .set({ consumedAt: new Date(), updatedAt: new Date() })
    .where(eq(emailOtps.id, id));
}

export const AuthService = {
  async requestRegistrationOtp(input: RegisterRequestOtpInput) {
    const email = normalizeEmail(input.email);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw Object.assign(new Error("Email already registered"), { status: 409 });
    }

    const otp = await upsertOtp({
      email,
      purpose: "registration",
      name: input.name,
      phone: input.phone ?? null,
    });

    await sendOtpEmail(email, otp, "registration");
  },

  async verifyRegistrationOtp(input: RegisterVerifyInput) {
    const email = normalizeEmail(input.email);
    const record = await verifyOtp(email, "registration", input.otp);

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw Object.assign(new Error("Email already registered"), { status: 409 });
    }

    const hashed = await hashPassword(input.password);
    const [user] = await db
      .insert(users)
      .values({
        name: record.name ?? email.split("@")[0],
        email,
        password: hashed,
        phone: record.phone,
        role: "customer",
        isEmailVerified: true,
      })
      .returning();

    await consumeOtp(record.id);
    const tokens = await issueTokens(user);

    return { user: stripSensitive(user), ...tokens };
  },

  async login(input: LoginInput) {
    const email = normalizeEmail(input.email);
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error("Account is deactivated"), { status: 403 });
    }

    if (!user.isEmailVerified) {
      throw Object.assign(new Error("Please verify your email before logging in"), {
        status: 403,
      });
    }

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    if (input.audience === "customer" && user.role !== "customer") {
      throw Object.assign(new Error("Invalid credentials"), {
        status: 401,
      });
    }

    if (input.audience === "admin" && user.role !== "admin") {
      throw Object.assign(new Error("Admin access required"), { status: 403 });
    }

    const tokens = await issueTokens(user);
    return { user: stripSensitive(user), ...tokens };
  },

  async logout(userId: string) {
    await db.update(users).set({ refreshToken: null }).where(eq(users.id, userId));
  },

  async refreshTokens(token: string) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (
      !user ||
      !user.refreshToken ||
      user.refreshToken !== hashToken(token) ||
      !user.isActive ||
      !user.isEmailVerified
    ) {
      throw Object.assign(new Error("Refresh token revoked"), { status: 401 });
    }

    return issueTokens(user);
  },

  async requestPasswordResetOtp(input: PasswordOtpRequestInput) {
    const email = normalizeEmail(input.email);
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.isActive || !user.isEmailVerified) {
      return;
    }

    const otp = await upsertOtp({ email, purpose: "password_reset" });
    await sendOtpEmail(email, otp, "password_reset");
  },

  async resetPasswordWithOtp(input: PasswordResetWithOtpInput) {
    const email = normalizeEmail(input.email);
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.isActive || !user.isEmailVerified) {
      throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
    }

    const record = await verifyOtp(email, "password_reset", input.otp);
    const hashed = await hashPassword(input.password);

    await db
      .update(users)
      .set({ password: hashed, refreshToken: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await consumeOtp(record.id);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      throw Object.assign(new Error("Current password is incorrect"), { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ password: hashed, refreshToken: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  },

  async getProfile(userId: string): Promise<SafeUser> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    return stripSensitive(user);
  },
};
