/**
 * Admin seeder — creates the first admin user.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Required env vars:
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 * Optional env vars:
 *   ADMIN_NAME
 *   ADMIN_RESET_PASSWORD=true  Update password if the user already exists.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Standalone pool for the script — mirrors your src/db/index.ts setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle(pool);

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() ?? "Bakery Admin";
  const shouldResetPassword = process.env.ADMIN_RESET_PASSWORD === "true";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  console.log("🔍  Checking for existing admin...");

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    if (!shouldResetPassword) {
      console.log(`⚠️   User already exists: ${email}`);
      console.log("    Set ADMIN_RESET_PASSWORD=true to update this admin password.");
      await pool.end();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        role: "admin",
        isEmailVerified: true,
        refreshToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    console.log("✅  Admin password updated:");
    console.log(`    Email:    ${email}`);
    console.log("    Existing sessions were revoked.");
    await pool.end();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [admin] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true,
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  console.log("✅  Admin created:");
  console.log(`    ID:       ${admin.id}`);
  console.log(`    Email:    ${admin.email}`);
  console.log(`    Role:     ${admin.role}`);
  console.log("");
  console.log("🔑  Login credentials:");
  console.log(`    Email:    ${email}`);
  console.log("    Password: <hidden>");
  console.log("⚠️   Change the password after first login!");

  await pool.end();
}

seedAdmin()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("❌  Seeder failed:", err);
    await pool.end();
    process.exit(1);
  });
