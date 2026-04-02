require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const TARGET_TOTAL = Number.parseInt(process.argv[2] || "100", 10);
const SOURCE_FILE = process.argv[3] || "products_3000_2026-03-31.csv";

const categorySeeds = [
  { name: "PC Gaming", slug: "pc-gaming" },
  { name: "Linh kien", slug: "linh-kien" },
  { name: "Man hinh", slug: "man-hinh" },
  { name: "Chuot", slug: "chuot" },
  { name: "Pad", slug: "pad" },
  { name: "Ban phim", slug: "ban-phim" },
  { name: "Tai nghe", slug: "tai-nghe" },
];

const baseQuota = {
  "pc-gaming": 30,
  "linh-kien": 25,
  "man-hinh": 15,
  chuot: 10,
  "ban-phim": 8,
  "tai-nghe": 7,
  pad: 5,
};

const PRODUCT_CODE_MAX_LENGTH = 24;

const parseCsvRows = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
};

const toInt = (value, fallback = 0) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n);
};

const fitCode = (value) => String(value || "").trim().slice(0, PRODUCT_CODE_MAX_LENGTH);

const ensureCategories = async () => {
  for (const category of categorySeeds) {
    await query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
      [category.name, category.slug]
    );
  }

  const result = await query("SELECT id, slug FROM categories WHERE slug = ANY($1::text[])", [categorySeeds.map((x) => x.slug)]);
  return new Map(result.rows.map((row) => [String(row.slug), Number(row.id)]));
};

const ensureSchema = async () => {
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(24)");
  await query("CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code ON products(product_code) WHERE product_code IS NOT NULL");
  await query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL
    )
  `);
  await query("CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)");
  await query("CREATE UNIQUE INDEX IF NOT EXISTS ux_product_images_product_url ON product_images(product_id, url)");
};

const scaleQuota = (target) => {
  const totalBase = Object.values(baseQuota).reduce((sum, value) => sum + value, 0);
  const scaled = {};
  let current = 0;
  for (const [slug, count] of Object.entries(baseQuota)) {
    const next = Math.floor((count * target) / totalBase);
    scaled[slug] = next;
    current += next;
  }

  const ordered = Object.entries(baseQuota)
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => slug);

  let cursor = 0;
  while (current < target) {
    const slug = ordered[cursor % ordered.length];
    scaled[slug] += 1;
    current += 1;
    cursor += 1;
  }

  return scaled;
};

const loadCsvRecords = () => {
  const csvPath = path.isAbsolute(SOURCE_FILE) ? SOURCE_FILE : path.join(__dirname, "..", "exports", SOURCE_FILE);
  const text = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("CSV khong co du lieu.");

  const headers = rows[0];
  const indexBy = Object.fromEntries(headers.map((h, i) => [h, i]));
  const required = ["product_code", "name", "category_slug", "price", "stock_qty", "status", "image_url", "slug"];
  required.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(indexBy, key)) {
      throw new Error(`CSV thieu cot bat buoc: ${key}`);
    }
  });

  const records = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cols = rows[i];
    const status = String(cols[indexBy.status] || "").trim().toLowerCase();
    if (status !== "active") continue;

    const categorySlug = String(cols[indexBy.category_slug] || "").trim().toLowerCase();
    if (!baseQuota[categorySlug]) continue;

    const productCode = fitCode(cols[indexBy.product_code]);
    const name = String(cols[indexBy.name] || "").trim();
    const imageUrl = String(cols[indexBy.image_url] || "").trim();
    const slugRaw = String(cols[indexBy.slug] || "").trim();
    const price = toInt(cols[indexBy.price], 0);
    const stockQty = Math.max(0, toInt(cols[indexBy.stock_qty], 0));

    if (!productCode || !name || !imageUrl || !Number.isFinite(price) || price <= 0) continue;

    records.push({
      categorySlug,
      productCode,
      name,
      slug: slugRaw || slugify(`${name}-${productCode}`),
      description: `Gia theo du lieu thi truong (snapshot 2026-03-31). Ma san pham: ${productCode}.`,
      price,
      stockQty,
      imageUrl,
      status: "active",
    });
  }

  return records;
};

const pickTopByQuota = (records, target) => {
  const quota = scaleQuota(target);
  const grouped = new Map();
  for (const item of records) {
    if (!grouped.has(item.categorySlug)) grouped.set(item.categorySlug, []);
    grouped.get(item.categorySlug).push(item);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => String(a.productCode).localeCompare(String(b.productCode)));
  }

  const selected = [];
  const usedCodes = new Set();

  for (const [slug, takeCount] of Object.entries(quota)) {
    const list = grouped.get(slug) || [];
    let picked = 0;
    for (const item of list) {
      if (picked >= takeCount) break;
      if (usedCodes.has(item.productCode)) continue;
      selected.push(item);
      usedCodes.add(item.productCode);
      picked += 1;
    }
  }

  if (selected.length < target) {
    for (const item of records) {
      if (selected.length >= target) break;
      if (usedCodes.has(item.productCode)) continue;
      selected.push(item);
      usedCodes.add(item.productCode);
    }
  }

  return selected.slice(0, target);
};

async function main() {
  const target = Number.isFinite(TARGET_TOTAL) && TARGET_TOTAL > 0 ? TARGET_TOTAL : 100;
  const records = loadCsvRecords();
  const selected = pickTopByQuota(records, target);

  if (selected.length === 0) {
    throw new Error("Khong lay duoc ban ghi nao tu CSV de seed.");
  }

  await ensureSchema();
  await query("BEGIN");

  try {
    const categoryMap = await ensureCategories();
    await query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    let inserted = 0;
    for (const item of selected) {
      const categoryId = categoryMap.get(item.categorySlug);
      if (!categoryId) continue;

      const insertResult = await query(
        `INSERT INTO products (category_id, product_code, name, slug, description, price, stock_qty, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          categoryId,
          item.productCode,
          item.name,
          item.slug,
          item.description,
          item.price,
          item.stockQty,
          item.imageUrl,
          item.status,
        ]
      );

      const productId = Number(insertResult.rows[0]?.id || 0);
      if (productId > 0) {
        await query("INSERT INTO product_images (product_id, url) VALUES ($1, $2) ON CONFLICT (product_id, url) DO NOTHING", [
          productId,
          item.imageUrl,
        ]);
      }
      inserted += 1;
    }

    const totalResult = await query("SELECT COUNT(*)::int AS total FROM products");
    const byCategory = await query(`
      SELECT c.slug, COUNT(*)::int AS total
      FROM products p
      JOIN categories c ON c.id = p.category_id
      GROUP BY c.slug
      ORDER BY c.slug
    `);

    await query("COMMIT");

    console.log(`Seed market complete. Inserted: ${inserted}`);
    console.log(`Products in DB: ${totalResult.rows[0].total}`);
    byCategory.rows.forEach((row) => console.log(` - ${row.slug}: ${row.total}`));
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Seed market failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
