require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const argA = Number.parseInt(process.argv[2] || "", 10);
const argB = Number.parseInt(process.argv[3] || "", 10);
const EACH_PART = Number.isFinite(argA) && argA > 0 ? argA : Number.isFinite(argB) && argB > 0 ? argB : 20;

const BASE_URL = "https://nguyencongpc.vn";
const CATEGORY = { name: "Linh kien", slug: "linh-kien" };
const NGUYEN_CONG_DOMAIN_REGEX = /https?:\/\/(?:www\.)?nguyencongpc\.vn\//i;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const PRODUCT_CODE_MAX_LENGTH = 24;

const PART_SOURCES = [
  { key: "cpu", label: "CPU", sourceUrl: `${BASE_URL}/cpu-bo-vi-xu-ly` },
  { key: "mainboard", label: "Mainboard", sourceUrl: `${BASE_URL}/mainboard-bo-mach-chu` },
  { key: "gpu", label: "GPU", sourceUrl: `${BASE_URL}/vga-card-man-hinh` },
  { key: "ram", label: "RAM", sourceUrl: `${BASE_URL}/ram` },
  { key: "ssd", label: "SSD", sourceUrl: `${BASE_URL}/o-cung-ssd` },
  { key: "hdd", label: "HDD", sourceUrl: `${BASE_URL}/o-cung-hdd` },
  { key: "cooler", label: "Tan nhiet", sourceUrl: `${BASE_URL}/tan-nhiet` },
  { key: "psu", label: "Nguon", sourceUrl: `${BASE_URL}/psu-nguon-may-tinh` },
  { key: "case", label: "Case PC", sourceUrl: `${BASE_URL}/case-vo-may-tinh` },
];

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

const fitCodeLength = (value) => String(value || "").trim().slice(0, PRODUCT_CODE_MAX_LENGTH);

const ensureUniqueCode = (baseCode, usedCodes) => {
  const base = fitCodeLength(baseCode) || "LK-AUTO";
  if (!usedCodes.has(base)) {
    usedCodes.add(base);
    return base;
  }

  let suffix = 2;
  while (true) {
    const suffixText = `-${suffix}`;
    const prefixText = base.slice(0, Math.max(1, PRODUCT_CODE_MAX_LENGTH - suffixText.length));
    const candidate = `${prefixText}${suffixText}`;
    if (!usedCodes.has(candidate)) {
      usedCodes.add(candidate);
      return candidate;
    }
    suffix += 1;
  }
};

const ensureUniqueSlug = (baseSlug, usedSlugs) => {
  const base = normalize(baseSlug) || "linh-kien";
  if (!usedSlugs.has(base)) {
    usedSlugs.add(base);
    return base;
  }

  let suffix = 2;
  while (true) {
    const candidate = `${base}-${suffix}`;
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate);
      return candidate;
    }
    suffix += 1;
  }
};

const extractField = (block, key) => {
  const regex = new RegExp(`\\[${key}\\]\\s*=>\\s*([^\\r\\n]*)`);
  const match = block.match(regex);
  return normalize(match ? match[1] : "");
};

const parseProductsFromHtml = (html, sourceUrl) => {
  const chunks = String(html || "").split(/\[productId\]\s*=>\s*/g).slice(1);
  const uniqueBySku = new Map();

  for (const chunk of chunks) {
    const productId = normalize((chunk.match(/^(\d+)/) || [])[1]);
    const sku = normalize((chunk.match(/\[productSKU\]\s*=>\s*([A-Za-z0-9-]{4,24})/) || [])[1]);
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
    if (!uniqueBySku.has(sku)) {
      uniqueBySku.set(sku, {
        sourceId: productId,
        productCode: sku,
        name,
        slug: slugify(`${sku}-${name}`),
        description: "",
        price,
        stockQty: Number.isFinite(stockQty) && stockQty > 0 ? stockQty : 10,
        imageUrl,
        sourceUrl: productUrl,
      });
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

const collectBySource = async (sourceUrl, target) => {
  const bySku = new Map();

  for (let page = 1; page <= 5 && bySku.size < target; page += 1) {
    const url = page === 1 ? sourceUrl : `${sourceUrl}?page=${page}`;
    const html = await fetchHtml(url);
    const products = parseProductsFromHtml(html, sourceUrl);
    const before = bySku.size;

    products.forEach((item) => {
      if (!bySku.has(item.productCode)) {
        bySku.set(item.productCode, item);
      }
    });

    if (bySku.size === before) {
      break;
    }
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

const buildRecords = async () => {
  const records = [];
  const seenCodes = new Set();

  for (const part of PART_SOURCES) {
    const sourceItems = await collectBySource(part.sourceUrl, EACH_PART);
    if (sourceItems.length < EACH_PART) {
      throw new Error(
        `Danh muc ${part.key} khong du du lieu tu NguyenCong (${sourceItems.length}/${EACH_PART}). URL: ${part.sourceUrl}`
      );
    }

    const selected = sourceItems.slice(0, EACH_PART);
    for (const item of selected) {
      if (seenCodes.has(item.productCode)) {
        throw new Error(`Trung product_code tu nguon NguyenCong: ${item.productCode}`);
      }
      seenCodes.add(item.productCode);
      records.push({
        ...item,
        partKey: part.key,
        description: `PART: ${part.key.toUpperCase()} | SKU: ${item.productCode} | SOURCE: ${item.sourceUrl}`,
      });
    }
  }

  return records;
};

async function main() {
  if (!Number.isFinite(EACH_PART) || EACH_PART <= 0) {
    throw new Error("So luong moi nhom phai > 0.");
  }

  await ensureSchema();
  const categoryId = await ensureCategory();
  const records = await buildRecords();
  const existingCodeRows = await query(
    `SELECT product_code
     FROM products
     WHERE category_id <> $1
       AND product_code IS NOT NULL
       AND product_code <> ''`,
    [categoryId]
  );
  const existingSlugRows = await query(
    `SELECT slug
     FROM products
     WHERE category_id <> $1
       AND slug IS NOT NULL
       AND slug <> ''`,
    [categoryId]
  );
  const usedCodes = new Set(existingCodeRows.rows.map((row) => normalize(row.product_code)).filter(Boolean));
  const usedSlugs = new Set(existingSlugRows.rows.map((row) => normalize(row.slug)).filter(Boolean));

  const normalizedRecords = records.map((item, index) => {
    const safeCode = ensureUniqueCode(item.productCode || `LK-AUTO-${index + 1}`, usedCodes);
    const safeSlug = ensureUniqueSlug(item.slug || slugify(`${safeCode}-${item.name}`), usedSlugs);
    return {
      ...item,
      productCode: safeCode,
      slug: safeSlug,
    };
  });

  await query("BEGIN");
  try {
    await query("DELETE FROM products WHERE category_id = $1", [categoryId]);

    for (const item of normalizedRecords) {
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

  const totalResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM products
     WHERE category_id = $1`,
    [categoryId]
  );

  const byPart = await query(
    `SELECT
       REGEXP_REPLACE(COALESCE(description, ''), '^.*PART:\\s*([A-Z]+).*$','\\1') AS part,
       COUNT(*)::int AS total
     FROM products
     WHERE category_id = $1
     GROUP BY 1
     ORDER BY 1`,
    [categoryId]
  );

  console.log(`Seed linh-kien (NguyenCong) complete. Total: ${totalResult.rows[0]?.total || 0}`);
  byPart.rows.forEach((row) => {
    console.log(` - ${String(row.part || "").toLowerCase()}: ${row.total}`);
  });
}

main()
  .catch((error) => {
    console.error("Seed linh-kien failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
