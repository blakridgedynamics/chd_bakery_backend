import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const pool = new Pool({ connectionString: dbUrl, ssl: true });

const BASE = "https://res.cloudinary.com/dupqpgaor/image/upload/v1777619904";

const categoryImages = {
  "cookies":     `${BASE}/cat-cookies_y6de7e.jpg`,
  "tea-cakes":   `${BASE}/cat-teacakes_g3sfwd.jpg`,
  "cheesecakes": `${BASE}/cat-cheesecake_twslmh.jpg`,
  "savory":      `${BASE}/cat-savory_ofr7dy.jpg`,
  "granola":     `${BASE}/cat-granola_kw6byy.jpg`,
  "munchies":    `${BASE}/cat-munchies_aid3mc.jpg`,
};

async function updateCategories() {
  const client = await pool.connect();
  console.log("✅ Connected\n🗂  Updating category images...\n");
  let updated = 0;
  try {
    for (const [slug, imageUrl] of Object.entries(categoryImages)) {
      const result = await client.query(
        `UPDATE categories SET image = $1, updated_at = NOW() WHERE slug = $2 RETURNING name`,
        [imageUrl, slug]
      );
      if (result.rows.length > 0) {
        console.log(`   ✅ ${slug} — ${result.rows[0].name}`);
        updated++;
      } else {
        console.log(`   ⚠️  ${slug} — not found in DB`);
      }
    }
    console.log(`\n✨ Done! ${updated} categories updated.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCategories();
