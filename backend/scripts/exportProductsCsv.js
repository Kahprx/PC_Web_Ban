require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { query, pool } = require("../utils/db");

const OUT_DIR = path.join(__dirname, "..", "exports");
const OUT_FILE = path.join(OUT_DIR, `products_3000_${new Date().toISOString().slice(0, 10)}.csv`);

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

async function run() {
  const result = await query(`
    SELECT
      p.id,
      p.product_code,
      p.name,
      c.name AS category_name,
      c.slug AS category_slug,
      p.price,
      p.stock_qty,
      p.status,
      p.image_url,
      p.slug,
      p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.id ASC
  `);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const headers = [
    "id",
    "product_code",
    "name",
    "category_name",
    "category_slug",
    "price",
    "stock_qty",
    "status",
    "image_url",
    "slug",
    "created_at",
  ];

  const lines = [headers.join(",")];
  for (const row of result.rows) {
    const line = headers.map((key) => csvEscape(row[key])).join(",");
    lines.push(line);
  }

  const withBom = `\uFEFF${lines.join("\n")}`;
  fs.writeFileSync(OUT_FILE, withBom, "utf8");

  console.log(`CSV exported: ${OUT_FILE}`);
  console.log(`Rows: ${result.rows.length}`);
}

run()
  .catch((error) => {
    console.error("Export CSV failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
