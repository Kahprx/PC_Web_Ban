require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const argA = Number.parseInt(process.argv[2] || "", 10);
const argB = Number.parseInt(process.argv[3] || "", 10);
const TARGET_TOTAL = Number.isFinite(argA) && argA > 0 ? argA : Number.isFinite(argB) && argB > 0 ? argB : 20;

const BASE_URL = "https://nguyencongpc.vn";
const CATEGORY = { name: "Laptop", slug: "laptop" };
const NGUYEN_CONG_DOMAIN_REGEX = /https?:\/\/(?:www\.)?nguyencongpc\.vn\//i;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const LAPTOP_TYPE_SOURCES = {
  gaming: [`${BASE_URL}/laptop-gaming`],
  creator: [`${BASE_URL}/laptop-do-hoa-kien-truc`],
  mainstream: [`${BASE_URL}/laptop-van-phong`, `${BASE_URL}/laptop-mong-nhe`],
};

const BASE_QUOTA = {
  gaming: 8,
  creator: 6,
  mainstream: 6,
};

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
    throw new Error("Khong tao duoc category laptop.");
  }
  return categoryId;
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

const parseProductsFromHtml = (html) => {
  const chunks = String(html || "").split(/\[productId\]\s*=>\s*/g).slice(1);
  const bySku = new Map();

  for (const chunk of chunks) {
    const productId = normalize((chunk.match(/^(\d+)/) || [])[1]);
    const sku = normalize((chunk.match(/\[productSKU\]\s*=>\s*([A-Za-z0-9-]{4,24})/) || [])[1]);
    const name = decodeHtmlEntities(normalize((chunk.match(/\[productName\]\s*=>\s*([^\r\n]*)/) || [])[1]));
    const price = Number.parseInt(normalize((chunk.match(/\[price\]\s*=>\s*([0-9]+)/) || [])[1]), 10);
    const stockQty = Number.parseInt(normalize((chunk.match(/\[quantity\]\s*=>\s*([0-9]+)/) || [])[1]), 10);
    const productUrl = toAbsoluteUrl(normalize((chunk.match(/\[productUrl\]\s*=>\s*([^\r\n]*)/) || [])[1]));

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

    if (!bySku.has(sku)) {
      bySku.set(sku, {
        sourceId: productId,
        productCode: sku,
        name,
        slug: slugify(`${sku}-${name}`),
        price,
        stockQty: Number.isFinite(stockQty) && stockQty >= 0 ? stockQty : 0,
        imageUrl,
        sourceUrl: productUrl,
      });
    }
  }

  return [...bySku.values()];
};

const buildQuota = (targetTotal) => {
  const entries = Object.entries(BASE_QUOTA);
  const baseSum = entries.reduce((sum, [, value]) => sum + value, 0);
  const quota = {};
  let current = 0;

  entries.forEach(([key, value]) => {
    const count = Math.floor((value * targetTotal) / baseSum);
    quota[key] = count;
    current += count;
  });

  const order = entries.map(([key]) => key);
  let idx = 0;
  while (current < targetTotal) {
    const key = order[idx % order.length];
    quota[key] += 1;
    idx += 1;
    current += 1;
  }

  return quota;
};

const collectBySources = async (sourceUrls, target, usedCodes) => {
  const selected = [];
  const localSeen = new Set();

  for (const baseUrl of sourceUrls) {
    for (let page = 1; page <= 5 && selected.length < target; page += 1) {
      const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
      const html = await fetchHtml(url);
      const items = parseProductsFromHtml(html);

      let added = 0;
      for (const item of items) {
        if (selected.length >= target) break;
        if (localSeen.has(item.productCode)) continue;
        if (usedCodes.has(item.productCode)) continue;

        localSeen.add(item.productCode);
        usedCodes.add(item.productCode);
        selected.push(item);
        added += 1;
      }

      if (added === 0) {
        break;
      }
    }
  }

  return selected;
};

const buildRecords = async (targetTotal) => {
  const quota = buildQuota(targetTotal);
  const usedCodes = new Set();
  const records = [];

  for (const [laptopType, sourceUrls] of Object.entries(LAPTOP_TYPE_SOURCES)) {
    const need = Number(quota[laptopType] || 0);
    if (need <= 0) continue;

    const items = await collectBySources(sourceUrls, need, usedCodes);
    if (items.length < need) {
      throw new Error(`Danh muc laptop ${laptopType} khong du du lieu (${items.length}/${need}).`);
    }

    records.push(
      ...items.map((item) => ({
        ...item,
        laptopType,
        description: `LAPTOP_TYPE: ${laptopType} | SKU: ${item.productCode} | SOURCE: ${item.sourceUrl}`,
      }))
    );
  }

  return records;
};

async function main() {
  if (!Number.isFinite(TARGET_TOTAL) || TARGET_TOTAL <= 0) {
    throw new Error("So luong laptop phai > 0.");
  }

  await ensureSchema();
  const categoryId = await ensureCategory();
  const records = await buildRecords(TARGET_TOTAL);

  await query("BEGIN");
  try {
    await query("DELETE FROM products WHERE category_id = $1", [categoryId]);

    for (const item of records) {
      const insert = await query(
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

      const productId = Number(insert.rows[0]?.id || 0);
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

  const totalResult = await query("SELECT COUNT(*)::int AS total FROM products WHERE category_id = $1", [categoryId]);
  const byTypeResult = await query(
    `SELECT
       REGEXP_REPLACE(COALESCE(description, ''), '^.*LAPTOP_TYPE:\\s*([a-z]+).*$','\\1') AS laptop_type,
       COUNT(*)::int AS total
     FROM products
     WHERE category_id = $1
     GROUP BY 1
     ORDER BY 1`,
    [categoryId]
  );

  console.log(`Seed laptop (NguyenCong) complete. Total: ${totalResult.rows[0]?.total || 0}`);
  byTypeResult.rows.forEach((row) => {
    console.log(` - ${row.laptop_type}: ${row.total}`);
  });
}

main()
  .catch((error) => {
    console.error("Seed laptop failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
