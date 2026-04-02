require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const prefixByCategory = {
  "pc-gaming": "PC",
  "linh-kien": "LK",
  "man-hinh": "MH",
  "chuot": "MS",
  "ban-phim": "KB",
  "tai-nghe": "HP",
  "pad": "PD",
};

const labelByCategory = {
  "pc-gaming": "PC Gaming",
  "linh-kien": "Linh kien",
  "man-hinh": "Man hinh",
  "chuot": "Chuot",
  "ban-phim": "Ban phim",
  "tai-nghe": "Tai nghe",
  "pad": "Mousepad",
};

const brandDict = [
  "ASUS", "MSI", "GIGABYTE", "ASROCK", "COLORFUL", "GALAX", "NZXT", "CORSAIR", "LIAN LI", "THERMALTAKE",
  "LOGITECH", "PULSAR", "RAZER", "LAMZU", "WL MOUSE", "ATK", "FINALMOUSE", "MEGLEEK", "ZOWIE", "VAXEE",
  "RAWN", "TEEVOLUTION", "SCYROX", "MCHOUSE", "ARTISAN", "WALLHACK", "WOOTING", "FGG", "AULA",
  "EPZ", "SIMGOT", "MOONDROP", "TRUTHEAR", "THEAUDIO", "7HZ", "DELL", "ACER", "SAMSUNG", "LG",
  "BENQ", "VIEWSONIC", "AOC", "PHILIPS", "LENOVO",
];

const stripOldCodeSuffix = (name) => String(name || "").replace(/\s*-\s*(PC|LK|MH|MS|KB|HP|PD)-\d{6}$/i, "").trim();

const normalizeSpace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const detectBrand = (name, imageUrl) => {
  const text = `${name} ${imageUrl}`.toUpperCase();
  for (const brand of brandDict) {
    if (text.includes(brand)) return brand;
  }
  return "KAH";
};

const buildName = (categorySlug, baseName, brand, code) => {
  const label = labelByCategory[categorySlug] || "San pham";
  return `${label} ${brand} ${baseName} - ${code}`.replace(/\s+/g, " ").trim();
};

async function ensureSchema() {
  await query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS product_code VARCHAR(24)
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code
    ON products(product_code)
    WHERE product_code IS NOT NULL
  `);
}

async function run() {
  await ensureSchema();

  const result = await query(`
    SELECT p.id, p.name, p.slug, p.image_url, p.description, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY p.id ASC
  `);

  await query("BEGIN");
  try {
    for (const row of result.rows) {
      const categorySlug = row.category_slug;
      const prefix = prefixByCategory[categorySlug] || "SP";
      const code = `${prefix}-${String(row.id).padStart(6, "0")}`;

      const rawBase = stripOldCodeSuffix(row.name);
      const baseName = normalizeSpace(rawBase || `San pham ${row.id}`);
      const brand = detectBrand(baseName, row.image_url);
      const newName = buildName(categorySlug, baseName, brand, code);
      const newSlug = `${slugify(newName)}-${row.id}`;

      const oldDescription = normalizeSpace(row.description || "");
      const newDescription = normalizeSpace(`Ma san pham: ${code}. ${oldDescription}`.trim());

      await query(
        `UPDATE products
         SET product_code = $1,
             name = $2,
             slug = $3,
             description = $4
         WHERE id = $5`,
        [code, newName, newSlug, newDescription, row.id]
      );
    }

    await query("COMMIT");
    console.log(`Normalize complete: ${result.rows.length} products updated with product_code + standardized names.`);
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

run()
  .catch((error) => {
    console.error("Normalize failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
