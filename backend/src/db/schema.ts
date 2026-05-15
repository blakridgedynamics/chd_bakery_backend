import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: text("password").notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").notNull().default("customer"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    refreshToken: text("refresh_token"),
    avatar: text("avatar"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
  ]
);

export const emailOtps = pgTable(
  "email_otps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    name: varchar("name", { length: 120 }),
    phone: varchar("phone", { length: 20 }),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    resendAvailableAt: timestamp("resend_available_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("email_otps_email_purpose_idx").on(t.email, t.purpose),
    index("email_otps_expires_idx").on(t.expiresAt),
  ]
);

// ─── Addresses ────────────────────────────────────────────────────────────────

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 50 }).default("Home"),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    country: varchar("country", { length: 100 }).notNull().default("India"),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)]
);

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    description: text("description"),
    image: text("image"),
    parentId: uuid("parent_id"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ]
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    description: text("description").notNull(),
    shortDescription: text("short_description"),
    sku: varchar("sku", { length: 100 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    images: jsonb("images").notNull().default([]),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    tags: jsonb("tags").notNull().default([]),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    avgRating: decimal("avg_rating", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    weight: decimal("weight", { precision: 8, scale: 3 }),
    dimensions: jsonb("dimensions"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_category_idx").on(t.categoryId),
    index("products_featured_idx").on(t.isFeatured),
    index("products_active_idx").on(t.isActive),
    index("products_price_idx").on(t.price),
    index("products_rating_idx").on(t.avgRating),
  ]
);

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 255 }),
    body: text("body"),
    isVerifiedPurchase: boolean("is_verified_purchase")
      .notNull()
      .default(false),
    isApproved: boolean("is_approved").notNull().default(false),
    helpfulVotes: integer("helpful_votes").notNull().default(0),
    images: jsonb("images").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("reviews_product_idx").on(t.productId),
    index("reviews_user_idx").on(t.userId),
    uniqueIndex("reviews_user_product_idx").on(t.userId, t.productId),
  ]
);

// ─── Wishlists ────────────────────────────────────────────────────────────────

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("wishlists_user_product_idx").on(t.userId, t.productId),
    index("wishlists_user_idx").on(t.userId),
  ]
);

// ─── Recently Viewed ──────────────────────────────────────────────────────────

export const recentlyViewed = pgTable(
  "recently_viewed",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  },
  (t) => [
    index("rv_user_idx").on(t.userId),
    uniqueIndex("rv_user_product_idx").on(t.userId, t.productId),
  ]
);

// ─── Search History ───────────────────────────────────────────────────────────

export const searchHistory = pgTable(
  "search_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: varchar("query", { length: 500 }).notNull(),
    resultCount: integer("result_count").notNull().default(0),
    searchedAt: timestamp("searched_at").notNull().defaultNow(),
  },
  (t) => [index("sh_user_idx").on(t.userId)]
);

export const frequentlyBoughtTogether = pgTable(
  "frequently_bought_together",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    relatedProductId: uuid("related_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(1),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("fbt_pair_idx").on(t.productId, t.relatedProductId),
    index("fbt_product_idx").on(t.productId),
  ]
);

// ─── Banners ──────────────────────────────────────────────────────────────────
// Homepage hero/promotional banners (like Blinkit / Flipkart top carousel).
// Admin can add, edit, reorder, and toggle them at any time.
// Public endpoint only returns banners where isActive = true AND within date window.

export const banners = pgTable(
  "banners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    subtitle: text("subtitle"),
    imageUrl: text("image_url").notNull(),
    linkUrl: text("link_url"),
    linkLabel: varchar("link_label", { length: 80 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("banners_active_order_idx").on(t.isActive, t.sortOrder),
  ]
);

// ─── Announcements ────────────────────────────────────────────────────────────
// Short text notices displayed near the banner area (ticker / info bar).
// Admin can stack multiple; frontend can rotate/scroll them.

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    text: text("text").notNull(),
    emoji: varchar("emoji", { length: 10 }),
    linkUrl: text("link_url"),
    linkLabel: varchar("link_label", { length: 60 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("announcements_active_order_idx").on(t.isActive, t.sortOrder),
  ]
);

// ─── Contact Messages ─────────────────────────────────────────────────────────
// Previously managed via raw SQL in create-messages-table.mjs.
// Now part of the schema for consistency.

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    subject: varchar("subject", { length: 255 }),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("contact_messages_read_idx").on(t.isRead),
    index("contact_messages_created_idx").on(t.createdAt),
  ]
);

// Site-wide business profile/content that should not be hardcoded in clients.
export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandName: varchar("brand_name", { length: 120 }).notNull().default("Chandigarh Bakery"),
    tagline: varchar("tagline", { length: 255 }).default("Premium egg-free, healthy bakes handcrafted in Chandigarh."),
    footerNote: varchar("footer_note", { length: 255 }).default("Crafted with warmth and whole-wheat."),
    phone: varchar("phone", { length: 20 }),
    whatsappNumber: varchar("whatsapp_number", { length: 20 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    instagramUrl: text("instagram_url"),
    deliveryAreas: jsonb("delivery_areas").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

export const customCakePhotos = pgTable(
  "custom_cake_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 160 }).notNull(),
    imageUrl: text("image_url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("custom_cake_photos_active_order_idx").on(t.isActive, t.sortOrder),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  wishlists: many(wishlists),
  recentlyViewed: many(recentlyViewed),
  searchHistory: many(searchHistory),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
  wishlists: many(wishlists),
  recentlyViewed: many(recentlyViewed),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, { fields: [wishlists.userId], references: [users.id] }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));
