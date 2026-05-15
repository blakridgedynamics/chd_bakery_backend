import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const pool = new Pool({ connectionString: dbUrl, ssl: true });

const BASE = "https://res.cloudinary.com/dupqpgaor/image/upload/v1777619904";

const CAT_IMAGES = {
  cookies:     `${BASE}/cat-cookies_y6de7e.jpg`,
  teacakes:    `${BASE}/cat-teacakes_g3sfwd.jpg`,
cheesecakes: `${BASE}/cat-cheesecake_twslmh.jpg`,
  savory:      `${BASE}/cat-savory_ofr7dy.jpg`,
  granola:     `${BASE}/cat-granola_kw6byy.jpg`,
  munchies:    `${BASE}/cat-munchies_aid3mc.jpg`,
};

const imageMap = {
  "CK-001": CAT_IMAGES.cookies,
  "CK-002": CAT_IMAGES.cookies,
  "CK-003": CAT_IMAGES.cookies,
  "CK-004": CAT_IMAGES.cookies,
  "CK-005": CAT_IMAGES.cookies,
  "SV-001": CAT_IMAGES.savory,
  "SV-002": CAT_IMAGES.savory,
  "SV-003": CAT_IMAGES.savory,
  "SV-004": CAT_IMAGES.savory,
  "SV-005": CAT_IMAGES.savory,
  "SV-006": CAT_IMAGES.savory,
  "TC-001": CAT_IMAGES.teacakes,
  "TC-002": CAT_IMAGES.teacakes,
  "TC-003": CAT_IMAGES.teacakes,
  "TC-004": CAT_IMAGES.teacakes,
  "MN-001": CAT_IMAGES.munchies,
  "MN-002": CAT_IMAGES.munchies,
  "MN-003": CAT_IMAGES.munchies,
  "MN-004": CAT_IMAGES.munchies,
  "MN-005": CAT_IMAGES.munchies,
  "CC-001": CAT_IMAGES.cheesecakes,
  "CC-002": CAT_IMAGES.cheesecakes,
  "CC-003": CAT_IMAGES.cheesecakes,
  "CC-004": CAT_IMAGES.cheesecakes,
  "GR-001": CAT_IMAGES.granola,
  "GR-002": CAT_IMAGES.granola,
  "GR-003": CAT_IMAGES.granola,
  "GR-004": CAT_IMAGES.granola,
};

async function updateImages() {
  const client = await pool.connect();
  console.log("✅ Connected\n📸 Updating product images...\n");
  let updated = 0;
  try {
    for (const [sku, imageUrl] of Object.entries(imageMap)) {
      const result = await client.query(
        `UPDATE products SET images = $1::jsonb, updated_at = NOW() WHERE sku = $2 RETURNING title`,
        [JSON.stringify([imageUrl]), sku]
      );
      if (result.rows.length > 0) {
        console.log(`   ✅ ${sku} — ${result.rows[0].title}`);
        updated++;
      } else {
        console.log(`   ⚠️  ${sku} — not found in DB`);
      }
    }
    console.log(`\n✨ Done! ${updated} products updated.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updateImages();
