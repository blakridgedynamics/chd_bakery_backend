/**
 * Creates the email_otps table used for registration and password reset OTPs.
 * Prefer Drizzle migrations in production; this script is for manual repair.
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const pool = new Pool({ connectionString: dbUrl, ssl: true });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        purpose VARCHAR(32) NOT NULL,
        name VARCHAR(120),
        phone VARCHAR(20),
        otp_hash TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP NOT NULL,
        resend_available_at TIMESTAMP NOT NULL,
        consumed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS email_otps_email_purpose_idx
      ON email_otps (email, purpose);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS email_otps_expires_idx
      ON email_otps (expires_at);
    `);
    console.log("email_otps table is ready");
  } catch (err) {
    console.error("Failed to create email_otps:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
