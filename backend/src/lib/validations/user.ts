import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/)
    .optional()
    .nullable(),
});

export const addressSchema = z.object({
  label: z.string().max(50).optional().default("Home"),
  fullName: z.string().min(2).max(120),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  addressLine1: z.string().min(5).max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  country: z.string().min(2).max(100).default("India"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be 6 digits"),
  isDefault: z.boolean().default(false),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  image: z.string().url().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  body: z.string().max(2000).optional(),
  images: z.array(z.string().url()).default([]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
