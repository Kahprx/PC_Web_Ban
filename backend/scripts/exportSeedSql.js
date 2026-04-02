require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { query, pool } = require("../utils/db");

const TARGET_TOTAL = Number.parseInt(process.argv[2] || "1990", 10);
const OUT_FILE = path.join(__dirname, "..", "sql", "seed_1990.sql");

const sqlString = (value) => {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlNumber = (value, fallback = "0") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return text;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed.toFixed(2);
};

const sqlInteger = (value, fallback = "0") => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return String(parsed);
};

async function run() {
  const categoryResult = await query(`
    SELECT DISTINCT c.name, c.slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY c.slug ASC
  `);

  const productResult = await query(`
    SELECT
      c.slug AS category_slug,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.stock_qty,
      p.image_url,
      p.status
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY c.slug ASC, p.id ASC
  `);

  if (Number.isFinite(TARGET_TOTAL) && TARGET_TOTAL > 0 && productResult.rows.length !== TARGET_TOTAL) {
    throw new Error(
      `So luong san pham hien tai la ${productResult.rows.length}, khong dung target ${TARGET_TOTAL}. Hay seed lai truoc khi export.`
    );
  }

  const categoryValues = categoryResult.rows
    .map((row) => `  (${sqlString(row.name)}, ${sqlString(row.slug)})`)
    .join(",\n");

  const productValues = productResult.rows
    .map(
      (row) =>
        `  ((SELECT id FROM c WHERE slug = ${sqlString(row.category_slug)}), ` +
        `${sqlString(row.name)}, ${sqlString(row.slug)}, ${sqlString(row.description)}, ` +
        `${sqlNumber(row.price, "0")}, ${sqlInteger(row.stock_qty, "0")}, ` +
        `${sqlString(row.image_url)}, ${sqlString(row.status || "active")})`
    )
    .join(",\n");

  const now = new Date().toISOString();
  const sql = [
    "-- Auto-generated seed file for PC Store",
    `-- Generated at: ${now}`,
    `-- Product rows: ${productResult.rows.length}`,
    "",
    "BEGIN;",
    "",
    "-- Ensure categories exist",
    "INSERT INTO categories (name, slug)",
    "VALUES",
    categoryValues,
    "ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;",
    "",
    "-- Reset products and all dependent rows",
    "TRUNCATE TABLE products RESTART IDENTITY CASCADE;",
    "",
    "-- Insert products",
    "WITH c AS (",
    "  SELECT id, slug FROM categories",
    ")",
    "INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)",
    "VALUES",
    productValues,
    "ON CONFLICT (slug) DO NOTHING;",
    "",
    "COMMIT;",
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, sql, "utf8");

  console.log(`Seed SQL exported: ${OUT_FILE}`);
  console.log(`Categories: ${categoryResult.rows.length}`);
  console.log(`Products: ${productResult.rows.length}`);
}

run()
  .catch((error) => {
    console.error("Export seed SQL failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
