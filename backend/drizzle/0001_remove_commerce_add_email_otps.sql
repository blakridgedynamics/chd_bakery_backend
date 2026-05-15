CREATE TABLE IF NOT EXISTS "email_otps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "purpose" varchar(32) NOT NULL,
  "name" varchar(120),
  "phone" varchar(20),
  "otp_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "resend_available_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_otps_email_purpose_idx" ON "email_otps" USING btree ("email","purpose");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_otps_expires_idx" ON "email_otps" USING btree ("expires_at");
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verify_token";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verify_expires";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_token";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_expires";
--> statement-breakpoint
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
DROP TABLE IF EXISTS "order_status_history" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "order_items" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "orders" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "cart_items" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "carts" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "coupons" CASCADE;
--> statement-breakpoint
DROP TYPE IF EXISTS "order_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "payment_status";
--> statement-breakpoint
DROP TYPE IF EXISTS "payment_method";
--> statement-breakpoint
DROP TYPE IF EXISTS "coupon_type";
