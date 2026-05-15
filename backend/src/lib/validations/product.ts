import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 chars").max(255),
  description: z.string().min(10, "Description must be at least 10 chars"),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(2).max(100),
  price: z.coerce.number().positive("Price must be positive"),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  weight: z.coerce.number().positive().optional().nullable(),
  dimensions: z
    .object({
      length: z.coerce.number(),
      width: z.coerce.number(),
      height: z.coerce.number(),
      unit: z.enum(["cm", "in"]).default("cm"),
    })
    .optional()
    .nullable(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkUpdateStockSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      stock: z.number().int().min(0),
    })
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
