require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { query, pool } = require("../utils/db");

const SOURCE_FILE = process.argv[2] || "products_3000_2026-03-31.csv";
const FOURTH_BUCKET = String(process.argv[3] || "laptop")
  .trim()
  .toLowerCase();

const BASE_TARGETS = {
  "pc-gaming": 100,
  "man-hinh": 100,
};
const FOURTH_BUCKET_TARGET = 100;

const GEAR_TARGETS = {
  chuot: 25,
  "ban-phim": 25,
  "tai-nghe": 25,
  pad: 25,
};

const PRODUCT_CODE_MAX_LENGTH = 24;
const laptopIncludeRegex =
  /(?:\blaptop\b|\bmacbook\b|\bthinkpad\b|\bideapad\b|\bvivobook\b|\bzenbook\b|\bsurface\b|\blegion\b|\bgram\s*book\b|\bnotebook\b|\brog\s*flow\b|\bxps\b|\binspiron\b|\bvostro\b|\bprobook\b|\belitebook\b|\bmatebook\b)/i;
const laptopExcludeRegex =
  /(?:ram\s*laptop|m[aà]n\s*h[iì]nh|monitor|card\s*m[aà]n\s*h[iì]nh|b[aà]n\s*ph[ií]m|chu[oộ]t|mousepad|tai\s*nghe|ngu[oồ]n|psu|case|fan|t[aâ]n\s*nhi[eệ]t|aio|router|webcam|mic|loa|pad)/i;

const categorySeeds = [
  { name: "PC Gaming", slug: "pc-gaming" },
  { name: "Laptop", slug: "laptop" },
  { name: "Man hinh", slug: "man-hinh" },
  { name: "Chuot", slug: "chuot" },
  { name: "Ban phim", slug: "ban-phim" },
  { name: "Tai nghe", slug: "tai-nghe" },
  { name: "Pad", slug: "pad" },
  { name: "Linh kien", slug: "linh-kien" },
];

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
const isStrictLaptopRecord = (item) => {
  const name = String(item?.name || "");
  return laptopIncludeRegex.test(name) && !laptopExcludeRegex.test(name);
};

const loadCsvSnapshot = () => {
  const csvPath = path.isAbsolute(SOURCE_FILE)
    ? SOURCE_FILE
    : path.join(__dirname, "..", "exports", SOURCE_FILE);
  const text = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("CSV khong co du lieu.");

  const headers = rows[0];
  const indexBy = Object.fromEntries(headers.map((h, i) => [h, i]));
  const required = [
    "product_code",
    "name",
    "category_name",
    "category_slug",
    "price",
    "stock_qty",
    "status",
    "image_url",
    "slug",
  ];

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

    const productCode = fitCode(cols[indexBy.product_code]);
    const categorySlug = String(cols[indexBy.category_slug] || "").trim().toLowerCase();
    const categoryName = String(cols[indexBy.category_name] || "").trim();
    const name = String(cols[indexBy.name] || "").trim();
    const imageUrl = String(cols[indexBy.image_url] || "").trim();
    const slug = String(cols[indexBy.slug] || "").trim();
    const price = toInt(cols[indexBy.price], 0);
    const stockQty = Math.max(0, toInt(cols[indexBy.stock_qty], 0));

    if (!productCode || !categorySlug || !name || !imageUrl || !slug || price <= 0) continue;

    records.push({
      productCode,
      categorySlug,
      categoryName,
      name,
      slug,
      price,
      stockQty,
      imageUrl,
    });
  }

  records.sort((a, b) => String(a.productCode).localeCompare(String(b.productCode)));
  return records;
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

const ensureCategories = async () => {
  for (const category of categorySeeds) {
    await query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
      [category.name, category.slug]
    );
  }

  const result = await query("SELECT id, slug FROM categories WHERE slug = ANY($1::text[])", [
    categorySeeds.map((x) => x.slug),
  ]);
  return new Map(result.rows.map((row) => [String(row.slug), Number(row.id)]));
};

const pickBySlug = (records, slug, limit, usedCodes) => {
  const selected = [];
  for (const item of records) {
    if (item.categorySlug !== slug) continue;
    if (usedCodes.has(item.productCode)) continue;
    selected.push(item);
    usedCodes.add(item.productCode);
    if (selected.length >= limit) break;
  }
  return selected;
};

const pickLaptopRecords = (records, limit, usedCodes) => {
  const allRecords = records.filter((item) => !usedCodes.has(item.productCode));
  const laptopLike = allRecords.filter((item) => isStrictLaptopRecord(item));

  const selected = [];
  for (const item of laptopLike) {
    if (selected.length >= limit) break;
    if (usedCodes.has(item.productCode)) continue;
    usedCodes.add(item.productCode);
    selected.push({
      ...item,
      categorySlug: "laptop",
      categoryName: "Laptop",
    });
  }

  return selected;
};

async function main() {
  if (!["laptop", "linh-kien"].includes(FOURTH_BUCKET)) {
    throw new Error("Bucket thu 4 khong hop le. Dung 'laptop' hoac 'linh-kien'.");
  }

  const records = loadCsvSnapshot();
  const usedCodes = new Set();
  const selected = [];

  selected.push(...pickBySlug(records, "pc-gaming", BASE_TARGETS["pc-gaming"], usedCodes));
  selected.push(...pickBySlug(records, "man-hinh", BASE_TARGETS["man-hinh"], usedCodes));

  Object.entries(GEAR_TARGETS).forEach(([slug, count]) => {
    selected.push(...pickBySlug(records, slug, count, usedCodes));
  });

  if (FOURTH_BUCKET === "laptop") {
    selected.push(...pickLaptopRecords(records, FOURTH_BUCKET_TARGET, usedCodes));
  } else {
    selected.push(...pickBySlug(records, "linh-kien", FOURTH_BUCKET_TARGET, usedCodes));
  }

  const expectedTotal =
    BASE_TARGETS["pc-gaming"] +
    BASE_TARGETS["man-hinh"] +
    FOURTH_BUCKET_TARGET +
    Object.values(GEAR_TARGETS).reduce((sum, v) => sum + v, 0);

  if (FOURTH_BUCKET === "laptop") {
    const actualLaptop = selected.filter((item) => item.categorySlug === "laptop").length;
    if (actualLaptop < FOURTH_BUCKET_TARGET) {
      console.warn(
        `Laptop source shortage: need ${FOURTH_BUCKET_TARGET}, found ${actualLaptop}. ` +
          `Seed will keep only strict laptop products to avoid wrong-category data.`
      );
    }
  }

  if (FOURTH_BUCKET === "linh-kien" && selected.length < expectedTotal) {
    throw new Error(`Khong du du lieu de tao ${expectedTotal} san pham.`);
  }

  if (FOURTH_BUCKET === "linh-kien" && selected.length > expectedTotal) {
    selected.length = expectedTotal;
  }

  if (FOURTH_BUCKET === "laptop" && selected.length > expectedTotal) {
    selected.length = expectedTotal;
  }

  if (FOURTH_BUCKET === "laptop" && selected.length < expectedTotal) {
    console.warn(
      `Seed result has ${selected.length}/${expectedTotal} products because laptop source is not enough.`
    );
  }

  await ensureSchema();
  await query("BEGIN");
  try {
    const categoryMap = await ensureCategories();
    await query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    for (const item of selected) {
      const categoryId = categoryMap.get(item.categorySlug);
      if (!categoryId) {
        throw new Error(`Khong tim thay category: ${item.categorySlug}`);
      }

      const description =
        `Snapshot 2026-03-31. Source category: ${item.categoryName || item.categorySlug}. ` +
        `Product code: ${item.productCode}.`;

      const result = await query(
        `INSERT INTO products (category_id, product_code, name, slug, description, price, stock_qty, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
         RETURNING id`,
        [categoryId, item.productCode, item.name, item.slug, description, item.price, item.stockQty, item.imageUrl]
      );

      const productId = Number(result.rows[0]?.id || 0);
      if (productId > 0) {
        await query(
          "INSERT INTO product_images (product_id, url) VALUES ($1, $2) ON CONFLICT (product_id, url) DO NOTHING",
          [productId, item.imageUrl]
        );
      }
    }

    const byCategory = await query(`
      SELECT c.slug, COUNT(*)::int AS total
      FROM products p
      JOIN categories c ON c.id = p.category_id
      GROUP BY c.slug
      ORDER BY c.slug
    `);

    await query("COMMIT");

    console.log(`Seed 400 complete. Inserted: ${selected.length}`);
    byCategory.rows.forEach((row) => console.log(` - ${row.slug}: ${row.total}`));
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Seed 400 failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
