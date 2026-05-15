import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";

const file = process.argv[2];

if (!file) {
  console.error("Usage: node scripts/apply-sql-file.mjs <path-to-sql-file>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sqlPath = resolve(file);
const sql = await readFile(sqlPath, "utf8");
const statements = sql
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`Applied ${statements.length} SQL statements from ${sqlPath}`);
} catch (error) {
  console.error("SQL apply failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
