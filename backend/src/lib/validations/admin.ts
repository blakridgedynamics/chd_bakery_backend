import { z } from "zod";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const nullableString = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).optional().nullable());

const nullableUrl = z.preprocess(
  emptyToNull,
  z.string().trim().url().max(2048).optional().nullable()
);

const nullableDate = z.preprocess(
  emptyToNull,
  z.coerce.date().optional().nullable()
);

export const idParamSchema = z.string().uuid("Invalid id");

export const createAnnouncementSchema = z.object({
  text: z.string().trim().min(1).max(500),
  emoji: nullableString(10),
  linkUrl: nullableUrl,
  linkLabel: nullableString(60),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isActive: z.boolean().default(true),
  startsAt: nullableDate,
  endsAt: nullableDate,
});

export const updateAnnouncementSchema = z.object({
  text: z.string().trim().min(1).max(500).optional(),
  emoji: nullableString(10),
  linkUrl: nullableUrl,
  linkLabel: nullableString(60),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  startsAt: nullableDate,
  endsAt: nullableDate,
});

export const createBannerSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: nullableString(1000),
  imageUrl: z.string().trim().url().max(2048),
  linkUrl: nullableUrl,
  linkLabel: nullableString(80),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isActive: z.boolean().default(true),
  startsAt: nullableDate,
  endsAt: nullableDate,
});

export const updateBannerSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subtitle: nullableString(1000),
  imageUrl: z.string().trim().url().max(2048).optional(),
  linkUrl: nullableUrl,
  linkLabel: nullableString(80),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  startsAt: nullableDate,
  endsAt: nullableDate,
});

const phoneString = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .optional()
    .nullable()
);

export const siteSettingsSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  tagline: nullableString(255),
  footerNote: nullableString(255),
  phone: phoneString,
  whatsappNumber: phoneString,
  email: z.preprocess(emptyToNull, z.string().trim().email().max(255).optional().nullable()),
  address: nullableString(1000),
  instagramUrl: nullableUrl,
  deliveryAreas: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
});

export const createCustomCakePhotoSchema = z.object({
  title: z.string().trim().min(1).max(160),
  imageUrl: z.string().trim().url().max(2048),
  altText: nullableString(255),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isActive: z.boolean().default(true),
});

export const updateCustomCakePhotoSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  imageUrl: z.string().trim().url().max(2048).optional(),
  altText: nullableString(255),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
});
