import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email("Invalid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase and a number"
  );

const otpSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "OTP must be a 6 digit code");

export const registerRequestOtpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .optional(),
});

export const registerVerifySchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  audience: z.enum(["customer", "admin"]).default("customer"),
});

export const passwordOtpRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetWithOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterRequestOtpInput = z.infer<typeof registerRequestOtpSchema>;
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordOtpRequestInput = z.infer<typeof passwordOtpRequestSchema>;
export type PasswordResetWithOtpInput = z.infer<typeof passwordResetWithOtpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
