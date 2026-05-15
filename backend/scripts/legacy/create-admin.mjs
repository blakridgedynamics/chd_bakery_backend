/**
 * Creates or promotes an admin user.
 *
 * Required env vars:
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 * Optional env vars:
 *   ADMIN_NAME
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || "Bakery Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const pool = new Pool({ connectionString: dbUrl, ssl: true });

async function createAdmin() {
  const client = await pool.connect();

  try {
    const existing = await client.query(
      "SELECT id, email, role FROM users WHERE email = $1",
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      await client.query(
        "UPDATE users SET role = 'admin', is_email_verified = true, refresh_token = NULL, updated_at = NOW() WHERE email = $1",
        [ADMIN_EMAIL]
      );
      console.log(`Admin user is ready: ${ADMIN_EMAIL}`);
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await client.query(
      `INSERT INTO users (name, email, password, role, is_email_verified)
       VALUES ($1, $2, $3, 'admin', true)`,
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
    );

    console.log(`Admin user created: ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error("Admin creation failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
