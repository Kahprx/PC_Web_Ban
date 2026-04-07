require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const argA = Number.parseInt(process.argv[2] || "", 10);
const argB = Number.parseInt(process.argv[3] || "", 10);
const TARGET_TOTAL = Number.isFinite(argA) && argA > 0 ? argA : Number.isFinite(argB) && argB > 0 ? argB : 20;

const BASE_URL = "https://nguyencongpc.vn";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const CATEGORY = { name: "Macbook", slug: "macbook" };
const NGUYEN_CONG_DOMAIN_REGEX = /https?:\/\/(?:www\.)?nguyencongpc\.vn\//i;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

const toAbsoluteUrl = (value) => {
  const raw = normalize(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${BASE_URL}${raw}`;
  return `${BASE_URL}/${raw}`;
};

const sanitizeProductCode = (value) => {
  const next = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");

  if (next.length < 5) return "";
  return next.slice(0, 24);
};

const pickColor = (name) => {
  const source = normalize(name).toLowerCase();
  const colors = [
    ["space gray", "Space Gray"],
    ["silver", "Silver"],
    ["starlight", "Starlight"],
    ["midnight", "Midnight"],
    ["black", "Black"],
    ["gold", "Gold"],
  ];

  const found = colors.find(([needle]) => source.includes(needle));
  return found ? found[1] : "";
};

const extractFromName = (name) => {
  const source = normalize(name);

  const chipMatch = source.match(/\b(m[1-4](?:\s*(?:pro|max|ultra))?)\b/i);
  const cpuCoreMatch = source.match(/\b(\d{1,2}\s*cpu)\b/i);
  const gpuCoreMatch = source.match(/\b(\d{1,2}\s*gpu)\b/i);
  const ramMatch = source.match(/\b(\d{1,2}\s*gb)\b/i);
  const storageMatch = source.match(/\b(128\s*gb|256\s*gb|512\s*gb|1\s*tb|2\s*tb|4\s*tb)\b/i);
  const screenMatch = source.match(/\b(13(?:\.\d)?|14(?:\.\d)?|15(?:\.\d)?|16(?:\.\d)?)\s*(?:inch|\"|')\b/i);
  const yearMatch = source.match(/\b(20\d{2})\b/);

  const lower = source.toLowerCase();
  const macbookType = lower.includes("macbook pro") ? "pro" : "air";
  const lineLabel = macbookType === "pro" ? "Macbook Pro" : "Macbook Air";

  return {
    macbookType,
    lineLabel,
    chip: chipMatch ? chipMatch[1].replace(/\s+/g, " ").trim().toUpperCase() : "",
    cpuCore: cpuCoreMatch ? cpuCoreMatch[1].replace(/\s+/g, " ").trim().toUpperCase() : "",
    gpuCore: gpuCoreMatch ? gpuCoreMatch[1].replace(/\s+/g, " ").trim().toUpperCase() : "",
    ram: ramMatch ? ramMatch[1].replace(/\s+/g, "").toUpperCase() : "",
    storage: storageMatch ? storageMatch[1].replace(/\s+/g, "").toUpperCase() : "",
    screen: screenMatch ? `${screenMatch[1]} inch` : "",
    year: yearMatch ? yearMatch[1] : "",
    color: pickColor(source),
  };
};

const deriveProductCode = (name, sourceUrl, index) => {
  const fromName = sanitizeProductCode((normalize(name).match(/-\s*([A-Za-z0-9/.-]{5,})\s*$/) || [])[1]);
  if (fromName) return fromName;

  const path = String(sourceUrl || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .toLowerCase();

  const fromUrl = sanitizeProductCode((path.match(/-([a-z0-9-]{6,})$/i) || [])[1]);
  if (fromUrl) return fromUrl;

  return `MBK${String(index).padStart(5, "0")}`;
};

const parsePrice = (value) => {
  const next = Number.parseInt(String(value || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(next) && next > 0 ? next : 0;
};

const parseJsonSafe = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readProductJsonLd = (html, pageUrl) => {
  const scripts = [...String(html || "").matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length === 0) return null;

  for (const scriptMatch of scripts) {
    const payload = normalize(scriptMatch[1]);
    if (!payload) continue;

    const json = parseJsonSafe(payload);
    if (!json) continue;

    const candidates = Array.isArray(json) ? json : [json];
    for (const item of candidates) {
      if (!item || typeof item !== "object") continue;
      const type = String(item["@type"] || "").toLowerCase();
      if (type !== "product") continue;

      const name = normalize(item.name);
      const imageRaw = Array.isArray(item.image) ? item.image[0] : item.image;
      const imageUrl = toAbsoluteUrl(imageRaw);
      const sourceUrl = toAbsoluteUrl(item.url || pageUrl);

      const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers || {};
      const price =
        parsePrice(offers?.price) ||
        parsePrice(offers?.lowPrice) ||
        parsePrice(offers?.highPrice) ||
        parsePrice(item?.price);

      if (!name || !imageUrl || !sourceUrl || price <= 0) continue;
      if (!NGUYEN_CONG_DOMAIN_REGEX.test(imageUrl) || !NGUYEN_CONG_DOMAIN_REGEX.test(sourceUrl)) continue;

      return {
        name,
        imageUrl,
        sourceUrl,
        price,
        brand: normalize(item?.brand?.name || "APPLE"),
      };
    }
  }

  return null;
};

const buildDescription = ({ productCode, sourceUrl, details }) => {
  const rows = [
    ["SKU", productCode],
    ["MACBOOK_TYPE", details.macbookType],
    ["DONG", details.lineLabel],
    ["CHIP", details.chip ? `Apple ${details.chip}` : ""],
    ["CPU_CORE", details.cpuCore],
    ["GPU_CORE", details.gpuCore],
    ["RAM", details.ram],
    ["SSD", details.storage],
    ["MAN_HINH", details.screen],
    ["MAU", details.color],
    ["NAM", details.year],
    ["SOURCE", sourceUrl],
  ].filter(([, value]) => normalize(value));

  return rows.map(([key, value]) => `${key}: ${normalize(value)}`).join(" | ");
};

const fetchText = async (url) => {
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

const parseSitemapUrls = (xml) =>
  [...String(xml || "").matchAll(/<loc>(.*?)<\/loc>/gi)]
    .map((match) => normalize(match[1]))
    .filter(Boolean);

const isMacbookProductUrl = (value) => {
  const url = String(value || "").toLowerCase();
  if (!url.startsWith(`${BASE_URL}/`)) return false;
  if (!url.includes("macbook")) return false;
  if (url.includes("/tin-tuc")) return false;
  if (url.includes("/tags/")) return false;
  if (url.includes("/blog")) return false;
  if (url.endsWith("/laptop-apple-macbook")) return false;
  return url.includes("/laptop-apple-macbook") || url.includes("/laptop-macbook");
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
    throw new Error("Khong tao duoc category macbook.");
  }
  return categoryId;
};

const collectRecords = async (targetTotal) => {
  const sitemapXml = await fetchText(SITEMAP_URL);
  const productUrls = [...new Set(parseSitemapUrls(sitemapXml).filter(isMacbookProductUrl))];
  const records = [];
  const usedCodes = new Set();

  for (const sourceUrl of productUrls) {
    if (records.length >= targetTotal) break;

    let html = "";
    try {
      html = await fetchText(sourceUrl);
    } catch {
      continue;
    }

    const parsed = readProductJsonLd(html, sourceUrl);
    if (!parsed) continue;

    const productCode = deriveProductCode(parsed.name, parsed.sourceUrl, records.length + 1);
    if (!productCode || usedCodes.has(productCode)) continue;
    usedCodes.add(productCode);

    const details = extractFromName(parsed.name);
    const description = buildDescription({ productCode, sourceUrl: parsed.sourceUrl, details });

    records.push({
      productCode,
      name: parsed.name,
      slug: slugify(`${productCode}-${parsed.name}`),
      description,
      price: parsed.price,
      stockQty: 10,
      imageUrl: parsed.imageUrl,
      sourceUrl: parsed.sourceUrl,
      brand: parsed.brand || "APPLE",
    });
  }

  if (records.length < targetTotal) {
    throw new Error(`Khong du Macbook hop le tu NguyenCong (${records.length}/${targetTotal}).`);
  }

  return records.slice(0, targetTotal);
};

async function main() {
  if (!Number.isFinite(TARGET_TOTAL) || TARGET_TOTAL <= 0) {
    throw new Error("So luong Macbook phai > 0.");
  }

  await ensureSchema();
  const categoryId = await ensureCategory();
  const records = await collectRecords(TARGET_TOTAL);

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
       REGEXP_REPLACE(COALESCE(description, ''), '^.*MACBOOK_TYPE:\\s*([a-z]+).*$','\\1') AS macbook_type,
       COUNT(*)::int AS total
     FROM products
     WHERE category_id = $1
     GROUP BY 1
     ORDER BY 1`,
    [categoryId]
  );

  console.log(`Seed macbook (NguyenCong) complete. Total: ${totalResult.rows[0]?.total || 0}`);
  byTypeResult.rows.forEach((row) => {
    console.log(` - ${row.macbook_type}: ${row.total}`);
  });
}

main()
  .catch((error) => {
    console.error("Seed macbook failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
