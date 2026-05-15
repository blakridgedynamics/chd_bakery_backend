// src/db/create-banner-tables.mjs
// Run once: node src/db/create-banner-tables.mjs
// Or better: use drizzle-kit after adding tables to schema.ts
//   npx drizzle-kit generate
//   npx drizzle-kit migrate

import { config } from "dotenv";
import pg from "pg";

config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS banners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    subtitle        TEXT,
    image_url       TEXT NOT NULL,
    link_url        TEXT,
    link_label      VARCHAR(80),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at       TIMESTAMP,
    ends_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS banners_active_order_idx ON banners (is_active, sort_order);
`);

await client.query(`
  CREATE TABLE IF NOT EXISTS announcements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text            TEXT NOT NULL,
    emoji           VARCHAR(10),
    link_url        TEXT,
    link_label      VARCHAR(60),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at       TIMESTAMP,
    ends_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS announcements_active_order_idx ON announcements (is_active, sort_order);
`);

console.log("✅  banners and announcements tables created.");

await client.end();
