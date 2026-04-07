require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const cliTarget = process.argv
  .slice(2)
  .map((value) => Number.parseInt(value || "", 10))
  .find((value) => Number.isFinite(value) && value > 0);

const TARGET_TOTAL = Number.isFinite(cliTarget) ? cliTarget : 30;

const BASE_URL = "https://nguyencongpc.vn";
const SOURCE_URLS = [`${BASE_URL}/mainboard-bo-mach-chu`, `${BASE_URL}/mainboard`];
const CATEGORY = { name: "Linh kien", slug: "linh-kien" };
const NGUYEN_CONG_DOMAIN_REGEX = /https?:\/\/(?:www\.)?nguyencongpc\.vn\//i;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

const decodeHtmlEntities = (value) =>
  normalize(
    String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
  );

const toAbsoluteUrl = (value) => {
  const raw = normalize(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${BASE_URL}${raw}`;
  return `${BASE_URL}/${raw}`;
};

const extractField = (block, key) => {
  const regex = new RegExp(`\\[${key}\\]\\s*=>\\s*([^\\r\\n]*)`);
  const match = block.match(regex);
  return normalize(match ? match[1] : "");
};

const isLikelyMainboard = ({ name, sourceUrl, productCode }) => {
  const text = normalize(`${name} ${sourceUrl} ${productCode}`).toLowerCase();
  const include = [
    "mainboard",
    "bo mach chu",
    "motherboard",
    "chipset",
    "lga",
    "am4",
    "am5",
    "b660",
    "b760",
    "z690",
    "z790",
    "x670",
    "h610",
  ];
  const exclude = [
    "laptop",
    "macbook",
    "pc gaming",
    "bo pc",
    "man hinh",
    "monitor",
    "chuot",
    "ban phim",
    "tai nghe",
    "vga",
    "card man hinh",
  ];

  const hasInclude = include.some((keyword) => text.includes(keyword));
  const hasExclude = exclude.some((keyword) => text.includes(keyword));
  return hasInclude && !hasExclude;
};

const parseProductsFromHtml = (html) => {
  const chunks = String(html || "").split(/\[productId\]\s*=>\s*/g).slice(1);
  const uniqueBySku = new Map();

  for (const chunk of chunks) {
    const productId = normalize((chunk.match(/^(\d+)/) || [])[1]);
    const sku = normalize((chunk.match(/\[productSKU\]\s*=>\s*([A-Za-z0-9-]{4,32})/) || [])[1]);
    const name = decodeHtmlEntities(extractField(chunk, "productName"));
    const price = Number.parseInt(normalize((chunk.match(/\[price\]\s*=>\s*([0-9]+)/) || [])[1]), 10);
    const stockQty = Number.parseInt(normalize((chunk.match(/\[quantity\]\s*=>\s*([0-9]+)/) || [])[1]), 10);
    const productUrl = toAbsoluteUrl(extractField(chunk, "productUrl"));

    const largeImage = normalize(
      (chunk.match(/\[productImage\]\s*=>\s*Array[\s\S]*?\[large\]\s*=>\s*([^\r\n]*)/) || [])[1]
    );
    const smallImage = normalize(
      (chunk.match(/\[productImage\]\s*=>\s*Array[\s\S]*?\[small\]\s*=>\s*([^\r\n]*)/) || [])[1]
    );
    const imageUrl = toAbsoluteUrl(largeImage || smallImage);

    if (!productId || !sku || !name || !productUrl || !imageUrl) continue;
    if (!Number.isFinite(price) || price <= 0) continue;
    if (!NGUYEN_CONG_DOMAIN_REGEX.test(imageUrl)) continue;

    const candidate = {
      sourceId: productId,
      productCode: sku,
      name,
      slug: slugify(`${sku}-${name}`),
      price,
      stockQty: Number.isFinite(stockQty) && stockQty >= 0 ? stockQty : 0,
      imageUrl,
      sourceUrl: productUrl,
    };

    if (!isLikelyMainboard(candidate)) continue;

    if (!uniqueBySku.has(sku)) {
      uniqueBySku.set(sku, candidate);
    }
  }

  return [...uniqueBySku.values()];
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      referer: BASE_URL,
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Khong tai duoc ${url}. HTTP ${response.status}`);
  }

  return response.text();
};

const collectMainboardItems = async (targetTotal) => {
  const bySku = new Map();

  for (const sourceUrl of SOURCE_URLS) {
    let noGrowthCount = 0;
    for (let page = 1; page <= 12 && bySku.size < targetTotal; page += 1) {
      const url = page === 1 ? sourceUrl : `${sourceUrl}?page=${page}`;
      let html = "";

      try {
        html = await fetchHtml(url);
      } catch (error) {
        if (page === 1) {
          break;
        }
        noGrowthCount += 1;
        if (noGrowthCount >= 2) break;
        continue;
      }

      const items = parseProductsFromHtml(html);
      const before = bySku.size;

      items.forEach((item) => {
        if (!bySku.has(item.productCode)) {
          bySku.set(item.productCode, item);
        }
      });

      if (bySku.size === before) {
        noGrowthCount += 1;
      } else {
        noGrowthCount = 0;
      }

      if (noGrowthCount >= 2) break;
    }

    if (bySku.size >= targetTotal) break;
  }

  return [...bySku.values()];
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

const ensureCategory = async () => {
  await query(
    `INSERT INTO categories (name, slug)
     VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
    [CATEGORY.name, CATEGORY.slug]
  );

  const result = await query("SELECT id FROM categories WHERE slug = $1 LIMIT 1", [CATEGORY.slug]);
  const categoryId = Number(result.rows[0]?.id || 0);
  if (!categoryId) {
    throw new Error("Khong tao duoc category linh-kien.");
  }
  return categoryId;
};

async function main() {
  if (!Number.isFinite(TARGET_TOTAL) || TARGET_TOTAL <= 0) {
    throw new Error("So luong mainboard phai > 0.");
  }

  await ensureSchema();
  const categoryId = await ensureCategory();
  const sourceItems = await collectMainboardItems(TARGET_TOTAL);

  if (sourceItems.length < TARGET_TOTAL) {
    throw new Error(`Khong du du lieu mainboard tu NguyenCong (${sourceItems.length}/${TARGET_TOTAL}).`);
  }

  const records = sourceItems.slice(0, TARGET_TOTAL).map((item) => ({
    ...item,
    description: `PART: MAINBOARD | SKU: ${item.productCode} | SOURCE: ${item.sourceUrl}`,
  }));

  let inserted = 0;
  let updated = 0;

  await query("BEGIN");
  try {
    for (const item of records) {
      const existing = await query("SELECT id FROM products WHERE product_code = $1 LIMIT 1", [item.productCode]);
      const existingId = Number(existing.rows[0]?.id || 0);

      let productId = existingId;
      if (existingId > 0) {
        await query(
          `UPDATE products
           SET category_id = $1,
               name = $2,
               slug = $3,
               description = $4,
               price = $5,
               stock_qty = $6,
               image_url = $7,
               status = 'active'
           WHERE id = $8`,
          [
            categoryId,
            item.name,
            item.slug,
            item.description,
            item.price,
            item.stockQty,
            item.imageUrl,
            existingId,
          ]
        );
        updated += 1;
      } else {
        const insertedProduct = await query(
          `INSERT INTO products (category_id, product_code, name, slug, description, price, stock_qty, image_url, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
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
          ]
        );
        productId = Number(insertedProduct.rows[0]?.id || 0);
        inserted += 1;
      }

      if (productId > 0) {
        await query(
          "INSERT INTO product_images (product_id, url) VALUES ($1, $2) ON CONFLICT (product_id, url) DO NOTHING",
          [productId, item.imageUrl]
        );
      }
    }

    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }

  const totalMainboardResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM products
     WHERE category_id = $1
       AND LOWER(COALESCE(description, '')) LIKE '%part: mainboard%'`,
    [categoryId]
  );

  console.log(`Seed mainboard (NguyenCong) complete: inserted=${inserted}, updated=${updated}`);
  console.log(`Mainboard marker total in DB: ${totalMainboardResult.rows[0]?.total || 0}`);
}

main()
  .catch((error) => {
    console.error("Seed mainboard failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
