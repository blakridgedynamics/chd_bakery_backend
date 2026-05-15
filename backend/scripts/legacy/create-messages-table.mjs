/**
 * create-messages-table.mjs
 * Creates the contact_messages table in Neon DB.
 * Run: node src/db/create-messages-table.mjs
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const pool = new Pool({ connectionString: dbUrl, ssl: true });

async function run() {
  const client = await pool.connect();
  console.log("✅ Connected\n");
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(120) NOT NULL,
        email       VARCHAR(255) NOT NULL,
        phone       VARCHAR(20),
        subject     VARCHAR(255),
        message     TEXT NOT NULL,
        is_read     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ contact_messages table created (or already exists)");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
