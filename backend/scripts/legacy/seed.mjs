/**
 * seed.mjs — standalone seed script, no path aliases needed
 *
 * Run from your backend folder:
 *   node src/db/seed.mjs
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

// Strip channel_binding param — not supported by the pg driver
const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");

console.log("Connecting to DB...");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: true,
});

// ─── Category data ────────────────────────────────────────────────────────────

const categoryData = [
  { name: "Cookies",     slug: "cookies",     description: "Wholesome, hand-rolled, baked daily",    sort_order: 1 },
  { name: "Tea Cakes",   slug: "tea-cakes",   description: "Moist loaves for slow afternoons",        sort_order: 2 },
  { name: "Cheesecakes", slug: "cheesecakes", description: "Creamy, indulgent, unforgettable",         sort_order: 3 },
  { name: "Savory",      slug: "savory",      description: "Focaccia, pasta & sandwiches",             sort_order: 4 },
  { name: "Granola",     slug: "granola",     description: "Crunchy, nutty, naturally sweet",           sort_order: 5 },
  { name: "Munchies",    slug: "munchies",    description: "Traditional treats, lovingly made",         sort_order: 6 },
];

// ─── Product data ─────────────────────────────────────────────────────────────

const productData = [
  // Cookies
  {
    title: "Whole-Wheat Jaggery Oats & Almond Cookies",
    slug: "whole-wheat-jaggery-oats-almond-cookies",
    sku: "CK-001", category_slug: "cookies",
    price: "999.00", stock: 50, is_featured: true,
    short_description: "Jaggery-sweetened oat & almond cookies. Half kg.",
    description: "Crisp-edged, chewy-centred cookies sweetened with jaggery, packed with rolled oats and California almonds. Baked fresh daily with whole-wheat flour — no refined sugar.",
    tags: ["bestseller", "jaggery", "whole-wheat", "oats"],
  },
  {
    title: "Ragi Almond Cookies — Dates Sweetened",
    slug: "ragi-almond-cookies-dates-sweetened",
    sku: "CK-002", category_slug: "cookies",
    price: "999.00", stock: 40, is_featured: false,
    short_description: "Ragi cookies with dates & almonds. Sugar-free.",
    description: "Nutty ragi flour slow-baked with chopped dates and almonds. Completely refined-sugar free and naturally sweetened.",
    tags: ["sugar-free", "ragi", "dates", "almonds"],
  },
  {
    title: "Almond Cranberry White Chocolate Cookies",
    slug: "almond-cranberry-white-chocolate-cookies",
    sku: "CK-003", category_slug: "cookies",
    price: "1100.00", stock: 35, is_featured: false,
    short_description: "Almond, cranberry & white chocolate. Half kg.",
    description: "Buttery cookies studded with tart cranberries, roasted almonds and creamy white chocolate chunks. A crowd favourite.",
    tags: ["white-chocolate", "cranberry", "almonds"],
  },
  {
    title: "Chocolate Chunk Cookies",
    slug: "chocolate-chunk-cookies",
    sku: "CK-004", category_slug: "cookies",
    price: "1100.00", stock: 45, is_featured: true,
    short_description: "Classic gooey chocolate chunk. Gluten-free option available.",
    description: "Classic, gooey chocolate chunk cookies with a soft, fudgy centre. Gluten-free option available for +₹200.",
    tags: ["chocolate", "gluten-free-option"],
  },
  {
    title: "Double Chocolate Cookies",
    slug: "double-chocolate-cookies",
    sku: "CK-005", category_slug: "cookies",
    price: "1200.00", stock: 30, is_featured: true,
    short_description: "Double cocoa & dark chocolate. New arrival.",
    description: "Decadent cocoa cookies loaded with dark chocolate chunks. A chocolate lover's dream. Gluten-free option available for +₹200.",
    tags: ["new", "dark-chocolate", "gluten-free-option"],
  },

  // Savory
  {
    title: "Alfredo Spicy Fettuccine",
    slug: "alfredo-spicy-fettuccine",
    sku: "SV-001", category_slug: "savory",
    price: "950.00", stock: 20, is_featured: false,
    short_description: "Creamy spicy alfredo fettuccine.",
    description: "Creamy alfredo sauce with a chilli kick, tossed with hand-cut fettuccine. Serves 1–2.",
    tags: ["pasta", "spicy"],
  },
  {
    title: "Arrabiata Spaghetti",
    slug: "arrabiata-spaghetti",
    sku: "SV-002", category_slug: "savory",
    price: "750.00", stock: 20, is_featured: false,
    short_description: "Classic spicy tomato arrabiata pasta.",
    description: "Slow-cooked tomato arrabiata with garlic, chilli flakes and fresh basil over spaghetti.",
    tags: ["pasta", "vegan-option"],
  },
  {
    title: "Focaccia Sandwich",
    slug: "focaccia-sandwich",
    sku: "SV-003", category_slug: "savory",
    price: "550.00", stock: 15, is_featured: false,
    short_description: "House focaccia with veggies, pesto & cheese.",
    description: "House-baked focaccia layered with seasonal veggies, house-made pesto and melted cheese.",
    tags: ["sandwich", "focaccia"],
  },
  {
    title: "Focaccia Bread — Sea Salt & Rosemary",
    slug: "focaccia-bread-sea-salt-rosemary",
    sku: "SV-004", category_slug: "savory",
    price: "690.00", stock: 15, is_featured: true,
    short_description: "Classic focaccia with sea salt & rosemary.",
    description: "Pillowy, airy focaccia finished with flaky sea salt and fragrant fresh rosemary. Baked to order.",
    tags: ["focaccia", "vegan"],
  },
  {
    title: "Focaccia Bread — Olive & Cheddar",
    slug: "focaccia-bread-olive-cheddar",
    sku: "SV-005", category_slug: "savory",
    price: "750.00", stock: 15, is_featured: false,
    short_description: "Focaccia with olives & aged cheddar.",
    description: "Rich focaccia loaded with kalamata olives and sharp aged cheddar. Perfect with soup.",
    tags: ["focaccia", "cheese"],
  },
  {
    title: "Cinnamon Roll",
    slug: "cinnamon-roll",
    sku: "SV-006", category_slug: "savory",
    price: "750.00", stock: 20, is_featured: false,
    short_description: "Soft cinnamon roll with cream-cheese glaze.",
    description: "Soft, pillowy swirls of cinnamon-sugar dough finished with a tangy cream-cheese glaze.",
    tags: ["sweet", "baked"],
  },

  // Tea Cakes
  {
    title: "Dates & Walnut Tea Cake",
    slug: "dates-walnut-tea-cake",
    sku: "TC-001", category_slug: "tea-cakes",
    price: "1600.00", stock: 25, is_featured: false,
    short_description: "Moist dates & walnut loaf. No refined sugar.",
    description: "Moist, lightly spiced loaf with chopped Medjool dates and toasted walnuts. No refined sugar.",
    tags: ["dates", "walnut", "no-refined-sugar"],
  },
  {
    title: "Dates Walnut Dark Chocolate Tea Cake",
    slug: "dates-walnut-dark-chocolate-tea-cake",
    sku: "TC-002", category_slug: "tea-cakes",
    price: "1900.00", stock: 25, is_featured: true,
    short_description: "Dates, walnut & dark chocolate loaf. Bestseller.",
    description: "A richer take on our classic — dark chocolate chunks folded through a dates & walnut loaf.",
    tags: ["bestseller", "dark-chocolate", "dates", "walnut"],
  },
  {
    title: "Carrot Dates Walnut Tea Cake",
    slug: "carrot-dates-walnut-tea-cake",
    sku: "TC-003", category_slug: "tea-cakes",
    price: "1700.00", stock: 20, is_featured: false,
    short_description: "Classic carrot, dates & walnut loaf.",
    description: "Old-fashioned carrot cake with sweet dates and walnuts. Comfort in every bite.",
    tags: ["carrot", "dates", "walnut"],
  },
  {
    title: "Vegan Jaggery Chocolate Tea Cake",
    slug: "vegan-jaggery-chocolate-tea-cake",
    sku: "TC-004", category_slug: "tea-cakes",
    price: "1500.00", stock: 20, is_featured: false,
    short_description: "Vegan jaggery chocolate loaf.",
    description: "100% vegan loaf, sweetened with jaggery and rich cocoa. Dairy-free and egg-free.",
    tags: ["vegan", "jaggery", "dairy-free"],
  },

  // Munchies
  {
    title: "Desi Ghee Panjeeri",
    slug: "desi-ghee-panjeeri",
    sku: "MN-001", category_slug: "munchies",
    price: "1600.00", stock: 30, is_featured: true,
    short_description: "Traditional panjeeri in pure desi ghee. 1 kg.",
    description: "Traditional Punjabi panjeeri made with pure desi ghee, whole-wheat flour and premium dry fruits.",
    tags: ["traditional", "ghee", "dry-fruits"],
  },
  {
    title: "Khajoor Ladoos",
    slug: "khajoor-ladoos",
    sku: "MN-002", category_slug: "munchies",
    price: "1700.00", stock: 25, is_featured: false,
    short_description: "Date & nut ladoos. No added sugar. 1 kg.",
    description: "Date and nut ladoos — naturally sweet, no added sugar. Made with Medjool dates, cashews and almonds.",
    tags: ["no-added-sugar", "dates", "nuts"],
  },
  {
    title: "Cocktail Nuts",
    slug: "cocktail-nuts",
    sku: "MN-003", category_slug: "munchies",
    price: "1700.00", stock: 30, is_featured: false,
    short_description: "Spiced roasted mixed nuts. 1 kg.",
    description: "Perfectly spiced and roasted cashews, almonds and peanuts. Ideal for parties or gifting.",
    tags: ["nuts", "roasted", "gifting"],
  },
  {
    title: "Jaipur Namkeen Mix",
    slug: "jaipur-namkeen-mix",
    sku: "MN-004", category_slug: "munchies",
    price: "1500.00", stock: 25, is_featured: false,
    short_description: "Crunchy Jaipur-style namkeen mix. 1 kg.",
    description: "A regal blend of crunchy savouries inspired by Jaipur's classic namkeen traditions.",
    tags: ["namkeen", "savory", "traditional"],
  },
  {
    title: "Royal Choorna",
    slug: "royal-choorna",
    sku: "MN-005", category_slug: "munchies",
    price: "1600.00", stock: 20, is_featured: false,
    short_description: "Aromatic digestive churan. 1 kg.",
    description: "An aromatic digestive churan — tangy, sweet and spicy. Made with natural spices and herbs.",
    tags: ["digestive", "traditional", "spices"],
  },

  // Cheesecakes
  {
    title: "Biscoff Cheesecake",
    slug: "biscoff-cheesecake",
    sku: "CC-001", category_slug: "cheesecakes",
    price: "2100.00", stock: 15, is_featured: true,
    short_description: "NY cheesecake with Biscoff base & caramel glaze. 1 kg.",
    description: "Velvety NY-style cheesecake on a Biscoff crumb base, topped with a luscious Biscoff caramel glaze.",
    tags: ["bestseller", "biscoff", "caramel"],
  },
  {
    title: "Berry Blast Cheesecake",
    slug: "berry-blast-cheesecake",
    sku: "CC-002", category_slug: "cheesecakes",
    price: "2100.00", stock: 15, is_featured: false,
    short_description: "Creamy cheesecake with mixed berry compote. 1 kg.",
    description: "Fresh mixed-berry compote over a creamy classic cheesecake. Sweet, tart and indulgent.",
    tags: ["berry", "fruit"],
  },
  {
    title: "Blueberry Orange Cheesecake",
    slug: "blueberry-orange-cheesecake",
    sku: "CC-003", category_slug: "cheesecakes",
    price: "2200.00", stock: 15, is_featured: false,
    short_description: "Orange-zest cheesecake with blueberry compote. 1 kg.",
    description: "Bright orange-zest cheesecake crowned with a vibrant blueberry compote. Refreshingly fruity.",
    tags: ["blueberry", "orange", "fruit"],
  },
  {
    title: "Chocolate Nutella Ferrero Cheesecake",
    slug: "chocolate-nutella-ferrero-cheesecake",
    sku: "CC-004", category_slug: "cheesecakes",
    price: "2500.00", stock: 10, is_featured: true,
    short_description: "Chocolate cheesecake with Nutella & Ferrero crown. 1 kg.",
    description: "Decadent chocolate cheesecake with Nutella swirls, finished with a Ferrero Rocher crown. Our most premium creation.",
    tags: ["premium", "nutella", "ferrero", "chocolate"],
  },

  // Granola
  {
    title: "Nutty Granola Bars",
    slug: "nutty-granola-bars",
    sku: "GR-001", category_slug: "granola",
    price: "1400.00", stock: 30, is_featured: false,
    short_description: "Oat & honey granola bars with mixed nuts.",
    description: "Wholesome, chewy bars made with rolled oats, honey and a generous mix of almonds, cashews and walnuts.",
    tags: ["granola", "oats", "honey"],
  },
  {
    title: "Dates & Prunes Bars",
    slug: "dates-prunes-bars",
    sku: "GR-002", category_slug: "granola",
    price: "1400.00", stock: 30, is_featured: false,
    short_description: "Natural energy bars with dates, prunes & seeds.",
    description: "Naturally sweet energy bars with Medjool dates, prunes and chia seeds. No added sugar.",
    tags: ["no-added-sugar", "dates", "energy-bar"],
  },
  {
    title: "Almond Cranberry Granola",
    slug: "almond-cranberry-granola",
    sku: "GR-003", category_slug: "granola",
    price: "1600.00", stock: 25, is_featured: true,
    short_description: "Crunchy oat clusters with almonds & cranberries. 1 kg.",
    description: "Crunchy clusters of oats baked with California almonds and tart cranberries. Great with yogurt or milk.",
    tags: ["granola", "almonds", "cranberry"],
  },
  {
    title: "Dark Chocolate Granola",
    slug: "dark-chocolate-granola",
    sku: "GR-004", category_slug: "granola",
    price: "1900.00", stock: 20, is_featured: true,
    short_description: "Toasted oat granola with dark chocolate. 1 kg. New.",
    description: "Indulgent yet wholesome granola with dark chocolate shavings and toasted oats. New on the menu.",
    tags: ["new", "dark-chocolate", "granola"],
  },
];

// ─── Run ──────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  console.log("✅ Connected to Neon DB\n");

  try {
    // 1. Insert categories
    console.log("📂 Inserting categories...");
    for (const cat of categoryData) {
      const exists = await client.query(
        "SELECT id FROM categories WHERE slug = $1",
        [cat.slug]
      );
      if (exists.rows.length > 0) {
        console.log(`   ⏭  Skipped (exists): ${cat.name}`);
        continue;
      }
      await client.query(
        `INSERT INTO categories (id, name, slug, description, sort_order, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())`,
        [randomUUID(), cat.name, cat.slug, cat.description, cat.sort_order]
      );
      console.log(`   ✅ Inserted: ${cat.name}`);
    }

    // 2. Build category slug → id map
    const catRows = await client.query("SELECT id, slug FROM categories");
    const catMap = {};
    for (const row of catRows.rows) catMap[row.slug] = row.id;

    // 3. Insert products
    console.log("\n🧁 Inserting products...");
    for (const p of productData) {
      const exists = await client.query(
        "SELECT id FROM products WHERE sku = $1",
        [p.sku]
      );
      if (exists.rows.length > 0) {
        console.log(`   ⏭  Skipped (exists): ${p.title}`);
        continue;
      }
      const categoryId = catMap[p.category_slug] ?? null;
      await client.query(
        `INSERT INTO products
           (id, title, slug, sku, description, short_description, price,
            stock, images, category_id, tags, is_featured, is_active,
            avg_rating, review_count, sold_count, created_at, updated_at)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,0,0,0,NOW(),NOW())`,
        [
          randomUUID(),
          p.title,
          p.slug,
          p.sku,
          p.description,
          p.short_description ?? null,
          p.price,
          p.stock,
          JSON.stringify([]),           // images — add via Cloudinary later
          categoryId,
          JSON.stringify(p.tags),
          p.is_featured,
        ]
      );
      console.log(`   ✅ Inserted: ${p.title}`);
    }

    console.log("\n✨ Seed complete! Your menu is now in the database.");
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
