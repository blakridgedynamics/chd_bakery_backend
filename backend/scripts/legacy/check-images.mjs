import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const pool = new Pool({ connectionString: dbUrl, ssl: true });

const client = await pool.connect();
const result = await client.query("SELECT sku, images FROM products ORDER BY sku LIMIT 5");
result.rows.forEach(r => console.log(r.sku, "→", JSON.parse(r.images)[0]));
client.release();
await pool.end();
