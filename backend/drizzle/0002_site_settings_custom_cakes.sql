CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_name" varchar(120) DEFAULT 'Chandigarh Bakery' NOT NULL,
  "tagline" varchar(255) DEFAULT 'Premium egg-free, healthy bakes handcrafted in Chandigarh.',
  "footer_note" varchar(255) DEFAULT 'Crafted with warmth and whole-wheat.',
  "phone" varchar(20),
  "whatsapp_number" varchar(20),
  "email" varchar(255),
  "address" text,
  "instagram_url" text,
  "delivery_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_cake_photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(160) NOT NULL,
  "image_url" text NOT NULL,
  "alt_text" varchar(255),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_cake_photos_active_order_idx" ON "custom_cake_photos" USING btree ("is_active","sort_order");
--> statement-breakpoint
INSERT INTO "site_settings" (
  "brand_name",
  "tagline",
  "footer_note",
  "phone",
  "whatsapp_number",
  "email",
  "address",
  "delivery_areas"
)
SELECT
  'Chandigarh Bakery',
  'Premium egg-free, healthy bakes handcrafted in Chandigarh.',
  'Crafted with warmth and whole-wheat.',
  '+919779474708',
  '919779474708',
  'hello@chandigarhbakery.in',
  'Chandigarh, India',
  '["Chandigarh","Mohali","Panchkula","Zirakpur","Kharar","New Chandigarh"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "site_settings");
