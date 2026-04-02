require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const TARGET_TOTAL = Number.parseInt(process.argv[2] || "1990", 10);
const CONCURRENCY = Math.max(4, Number.parseInt(process.argv[3] || "14", 10) || 14);
const PLAYZONE_MAX_ATTEMPTS = Math.max(3, Number.parseInt(process.argv[4] || "12", 10) || 12);

const SOURCE_URLS = {
  nguyenCongCollection: "https://nguyencongpc.vn/man-hinh-may-tinh",
  phongCachXanhCollection: "https://www.phongcachxanh.vn/collections/chuot-gaming?filter.p.vendor=WLmouse",
  playzoneSitemapIndex: "https://playzone.vn/sitemap.xml",
};

const categorySeeds = [
  { name: "PC Gaming", slug: "pc-gaming" },
  { name: "Linh kien", slug: "linh-kien" },
  { name: "Man hinh", slug: "man-hinh" },
  { name: "Chuot", slug: "chuot" },
  { name: "Pad", slug: "pad" },
  { name: "Ban phim", slug: "ban-phim" },
  { name: "Tai nghe", slug: "tai-nghe" },
  { name: "Gaming Gear", slug: "gaming-gear" },
  { name: "Laptop", slug: "laptop" },
];

const sourceCodePrefix = {
  nguyencongpc: "NGC",
  phongcachxanh: "PCX",
  playzone: "PZ",
};

const PRODUCT_CODE_MAX_LENGTH = 24;
const GALLERY_MAX = 10;
const REQUEST_TIMEOUT_MS = 30000;

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const stripTags = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const normalizeImageUrl = (url, origin) => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${origin}${raw}`;
  return raw;
};

const uniqCompact = (items = []) => {
  const set = new Set();
  for (const item of items) {
    const value = String(item || "").trim();
    if (!value) continue;
    set.add(value);
  }
  return [...set];
};

const toPriceVnd = (value, unit = "normal") => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (unit === "cent") return Math.round(numeric / 100);
  return Math.round(numeric);
};

const cleanCode = (value) => {
  const raw = String(value || "")
    .trim()
    .replace(/\s+/g, "-");
  return raw.replace(/[^A-Za-z0-9._-]/g, "");
};

const fitCodeLength = (value) => String(value || "").slice(0, PRODUCT_CODE_MAX_LENGTH);

const classifyCategory = (name = "", url = "") => {
  const text = normalizeText(`${name} ${url}`);

  if (/(man hinh|monitor|oled|hz|display)/.test(text)) return "man-hinh";
  if (/(chuot|mouse)/.test(text)) return "chuot";
  if (/(ban phim|keyboard|switch|keycap)/.test(text)) return "ban-phim";
  if (/(tai nghe|headphone|headset|iem|earbuds|in-ear)/.test(text)) return "tai-nghe";
  if (/(pad|lot chuot|mousepad|deskmat|ban di chuot)/.test(text)) return "pad";
  if (/(cpu|mainboard|motherboard|ram|ssd|hdd|psu|nguon|vga|card man hinh|gpu|case|cooler)/.test(text)) return "linh-kien";
  if (/(laptop|notebook)/.test(text)) return "laptop";
  if (/(pc gaming|bo pc|build pc|workstation|pc-)/.test(text)) return "pc-gaming";
  return "linh-kien";
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = 4) => {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} at ${url}`);
      }

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < retries) {
        await sleep(700 * attempt);
      }
    }
  }

  throw lastError || new Error(`Fetch failed at ${url}`);
};

const fetchText = async (url) => {
  const response = await fetchWithRetry(
    url,
    {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; KAH-CatalogSync/2.0)",
        accept: "text/html,application/json,application/xml;q=0.9,*/*;q=0.8",
      },
    },
    4
  );

  return response.text();
};

const fetchJson = async (url) => {
  const response = await fetchWithRetry(
    url,
    {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; KAH-CatalogSync/2.0)",
        accept: "application/json,text/javascript,*/*;q=0.8",
      },
    },
    4
  );

  return response.json();
};

const parseXmlLocs = (xmlText) => [...xmlText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const parseNguyenCongCollectionProducts = (htmlText) => {
  const result = [];
  const re = /<div class="product-item js-p-item"[^>]*data-id="(\d+)"[\s\S]*?<a href="([^"]+)" class="product-image">/gi;
  let match = re.exec(htmlText);

  while (match) {
    const fallbackCode = match[1];
    const path = match[2];
    const url = path.startsWith("http") ? path : `https://nguyencongpc.vn${path}`;
    result.push({ url, fallbackCode });
    match = re.exec(htmlText);
  }

  return result;
};

const extractLdJsonBlocks = (htmlText) => {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = re.exec(htmlText);

  while (match) {
    blocks.push(match[1].trim());
    match = re.exec(htmlText);
  }

  return blocks;
};

const parseJsonSafe = (text) => {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
};

const findFirstProductObject = (node) => {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirstProductObject(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof node !== "object") return null;

  const typeValue = node["@type"];
  if (typeof typeValue === "string" && typeValue.toLowerCase() === "product") return node;
  if (Array.isArray(typeValue) && typeValue.some((x) => String(x).toLowerCase() === "product")) return node;

  for (const value of Object.values(node)) {
    const found = findFirstProductObject(value);
    if (found) return found;
  }

  return null;
};

const parseNguyenCongDetail = async ({ url, fallbackCode }) => {
  const html = await fetchText(url);
  const blocks = extractLdJsonBlocks(html);

  let product = null;
  for (const block of blocks) {
    const parsed = parseJsonSafe(block);
    if (!parsed) continue;
    const found = findFirstProductObject(parsed);
    if (found) {
      product = found;
      break;
    }
  }

  if (!product) return null;

  const name = stripTags(product.name || "");
  const offers = product.offers || {};
  const priceRaw = offers.lowPrice || offers.price || (Array.isArray(offers.offers) ? offers.offers[0]?.price : null);
  const price = toPriceVnd(priceRaw, "normal");

  const imageList = uniqCompact(
    []
      .concat(Array.isArray(product.image) ? product.image : [product.image])
      .concat([...html.matchAll(/data-zoom-image="([^"]+)"/gi)].map((m) => m[1]))
      .concat([...html.matchAll(/class="cloudzoom-gallery"[^>]*href="([^"]+)"/gi)].map((m) => m[1]))
      .map((image) => normalizeImageUrl(image, "https://nguyencongpc.vn"))
  ).slice(0, GALLERY_MAX);

  const imageUrl = imageList[0] || "";
  if (!name || !imageUrl || price <= 0) return null;

  const productCode = cleanCode(product.sku || product.productID || fallbackCode || "");

  return {
    source: "nguyencongpc",
    sourceUrl: url,
    categorySlug: "man-hinh",
    productCode,
    name,
    price,
    imageUrl,
    gallery: imageList,
    description: `Nguon: ${url}`,
  };
};

const parseShopifyLikeDetail = async (url, sourceKey) => {
  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname.replace(/\/+$/, "");
  const jsonUrl = `${parsedUrl.origin}${path}.js`;
  const data = await fetchJson(jsonUrl);

  const variants = Array.isArray(data.variants) ? data.variants : [];
  const variant = variants.find((item) => item && item.available !== false) || variants[0] || {};

  const name = stripTags(data.title || "");
  if (!name) return null;

  const imageList = uniqCompact(
    []
      .concat(data.featured_image || [])
      .concat(Array.isArray(data.images) ? data.images : [])
      .map((image) => normalizeImageUrl(image, parsedUrl.origin))
  ).slice(0, GALLERY_MAX);

  const imageUrl = imageList[0] || "";
  if (!imageUrl) return null;

  const priceRaw = variant.price || data.price || data.price_min || 0;
  const price = toPriceVnd(priceRaw, "cent");
  if (price <= 0) return null;

  const rawCode = variant.sku || variant.id || data.id || path.split("/").filter(Boolean).pop();
  const productCode = cleanCode(rawCode);
  const tagText = Array.isArray(data.tags) ? data.tags.join(" ") : "";
  const categorySlug = classifyCategory(`${name} ${data.type || ""} ${tagText}`, url);

  return {
    source: sourceKey,
    sourceUrl: url,
    categorySlug,
    productCode,
    name,
    price,
    imageUrl,
    gallery: imageList,
    description: `Nguon: ${url}`,
  };
};

const ensureUniqueCode = (baseCode, source, rowIndex, usedCodes) => {
  const seed = cleanCode(baseCode || "") || `${sourceCodePrefix[source] || "SRC"}-${rowIndex + 1}`;
  const safeBase = fitCodeLength(seed) || `${sourceCodePrefix[source] || "SRC"}-${rowIndex + 1}`;

  if (!usedCodes.has(safeBase)) {
    usedCodes.add(safeBase);
    return safeBase;
  }

  let suffix = 2;
  while (true) {
    const suffixText = `-${suffix}`;
    const prefixText = safeBase.slice(0, Math.max(1, PRODUCT_CODE_MAX_LENGTH - suffixText.length));
    const candidate = `${prefixText}${suffixText}`;
    if (!usedCodes.has(candidate)) {
      usedCodes.add(candidate);
      return candidate;
    }
    suffix += 1;
  }
};

const ensureUniqueSlug = (baseSlug, rowIndex, usedSlugs) => {
  const seed = String(baseSlug || "").trim() || `san-pham-${rowIndex + 1}`;
  if (!usedSlugs.has(seed)) {
    usedSlugs.add(seed);
    return seed;
  }

  let suffix = 2;
  let candidate = `${seed}-${suffix}`;
  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${seed}-${suffix}`;
  }
  usedSlugs.add(candidate);
  return candidate;
};

const runWorkers = async (items, maxNeeded, workerFn) => {
  const results = [];
  let cursor = 0;

  const workers = Array.from({ length: CONCURRENCY }).map(async () => {
    while (true) {
      if (results.length >= maxNeeded) return;
      if (cursor >= items.length) return;

      const currentIndex = cursor;
      cursor += 1;
      const entry = items[currentIndex];

      try {
        const payload = await workerFn(entry, currentIndex);
        if (payload && results.length < maxNeeded) {
          results.push(payload);
        }
      } catch (_) {
        // Skip a failed product and continue.
      }
    }
  });

  await Promise.all(workers);
  return results;
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

  const result = await query("SELECT id, slug FROM categories WHERE slug = ANY($1::text[])", [categorySeeds.map((item) => item.slug)]);
  return new Map(result.rows.map((row) => [row.slug, Number(row.id)]));
};

const ensureProductCodeColumn = async () => {
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(24)");
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code
    ON products(product_code)
    WHERE product_code IS NOT NULL
  `);
};

const ensureProductImagesTable = async () => {
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

const ensureDefaultProductCodes = async () => {
  await query(`
    UPDATE products p
    SET product_code = CASE c.slug
      WHEN 'pc-gaming' THEN 'PC-' || LPAD(p.id::text, 6, '0')
      WHEN 'linh-kien' THEN 'LK-' || LPAD(p.id::text, 6, '0')
      WHEN 'man-hinh' THEN 'MH-' || LPAD(p.id::text, 6, '0')
      WHEN 'chuot' THEN 'MS-' || LPAD(p.id::text, 6, '0')
      WHEN 'pad' THEN 'PD-' || LPAD(p.id::text, 6, '0')
      WHEN 'ban-phim' THEN 'KB-' || LPAD(p.id::text, 6, '0')
      WHEN 'tai-nghe' THEN 'HP-' || LPAD(p.id::text, 6, '0')
      ELSE 'SP-' || LPAD(p.id::text, 6, '0')
    END
    FROM categories c
    WHERE c.id = p.category_id
      AND (p.product_code IS NULL OR p.product_code = '')
  `);
};

const insertProductGallery = async (productId, gallery = []) => {
  const safeGallery = uniqCompact(gallery).slice(0, GALLERY_MAX);
  await query("DELETE FROM product_images WHERE product_id = $1", [productId]);
  if (safeGallery.length === 0) return;

  const values = [];
  const placeholders = safeGallery.map((url, idx) => {
    const base = idx * 2;
    values.push(productId, url);
    return `($${base + 1}, $${base + 2})`;
  });

  await query(
    `INSERT INTO product_images (product_id, url)
     VALUES ${placeholders.join(",")}
     ON CONFLICT (product_id, url) DO NOTHING`,
    values
  );
};

const loadCatalogSlotsByCategory = async () => {
  const result = await query(`
    SELECT p.id, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY p.id ASC
  `);

  const slots = new Map();
  for (const row of result.rows) {
    const slug = String(row.category_slug || "");
    if (!slots.has(slug)) slots.set(slug, []);
    slots.get(slug).push(Number(row.id));
  }
  return slots;
};

const applySourceRecordsToCatalog = async (records, categoryMap) => {
  const slotsByCategory = await loadCatalogSlotsByCategory();
  const cursorByCategory = new Map();

  const stats = {
    updated: 0,
    skippedNoSlot: 0,
  };

  for (const item of records) {
    const categorySlug = item.categorySlug;
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) {
      stats.skippedNoSlot += 1;
      continue;
    }

    const slots = slotsByCategory.get(categorySlug) || [];
    const cursor = cursorByCategory.get(categorySlug) || 0;
    if (cursor >= slots.length) {
      stats.skippedNoSlot += 1;
      continue;
    }

    const productId = slots[cursor];
    cursorByCategory.set(categorySlug, cursor + 1);

    await query(
      `UPDATE products
       SET category_id = $2,
           product_code = $3,
           name = $4,
           slug = $5,
           description = $6,
           price = $7,
           stock_qty = $8,
           image_url = $9,
           status = $10
       WHERE id = $1`,
      [
        productId,
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

    const gallery = uniqCompact([item.imageUrl, ...(Array.isArray(item.gallery) ? item.gallery : [])]).slice(0, GALLERY_MAX);
    await insertProductGallery(productId, gallery);
    stats.updated += 1;
  }

  return stats;
};

const collectNguyenCongMonitorUrls = async () => {
  const firstPageHtml = await fetchText(SOURCE_URLS.nguyenCongCollection);
  const pageNumbers = [...firstPageHtml.matchAll(/man-hinh-may-tinh\?page=(\d+)/gi)].map((m) => Number(m[1]));
  const maxPage = Math.max(1, ...pageNumbers.filter((n) => Number.isFinite(n)));

  const all = [];
  for (let page = 1; page <= maxPage; page += 1) {
    const url = page === 1 ? SOURCE_URLS.nguyenCongCollection : `${SOURCE_URLS.nguyenCongCollection}?page=${page}`;
    try {
      const html = page === 1 ? firstPageHtml : await fetchText(url);
      const rows = parseNguyenCongCollectionProducts(html);
      all.push(...rows);
    } catch (_) {
      // Skip one page if blocked.
    }
  }

  const uniq = new Map();
  for (const item of all) {
    if (!uniq.has(item.url)) uniq.set(item.url, item);
  }
  return Array.from(uniq.values());
};

const collectPhongCachXanhUrls = async () => {
  const html = await fetchText(SOURCE_URLS.phongCachXanhCollection);
  const links = [...html.matchAll(/href=["']([^"']*\/products\/[^"']+)["']/gi)].map((m) => m[1]);

  const normalized = links
    .map((url) => url.split("?")[0].split("#")[0])
    .filter((url) => /\/products\//i.test(url))
    .map((url) => (url.startsWith("http") ? url : `https://www.phongcachxanh.vn${url}`));

  return [...new Set(normalized)].map((url) => ({ url }));
};

const buildPlayzoneSitemapFallbacks = () => {
  const urls = [];
  for (let i = 1; i <= 50; i += 1) {
    urls.push(`https://playzone.vn/sitemap_products_${i}.xml`);
  }
  return urls;
};

const collectPlayzoneUrlsFromSitemap = async () => {
  let lastError = null;

  for (let attempt = 1; attempt <= PLAYZONE_MAX_ATTEMPTS; attempt += 1) {
    try {
      let sitemapUrls = [];

      try {
        const indexXml = await fetchText(SOURCE_URLS.playzoneSitemapIndex);
        sitemapUrls = parseXmlLocs(indexXml).filter((url) => /sitemap_products_\d+\.xml/i.test(url));
      } catch (_) {
        sitemapUrls = [];
      }

      if (sitemapUrls.length === 0) {
        sitemapUrls = buildPlayzoneSitemapFallbacks();
      }

      const productUrls = [];
      for (const sitemapUrl of sitemapUrls) {
        try {
          const xml = await fetchText(sitemapUrl);
          const locs = parseXmlLocs(xml).filter((url) => /\/products\//i.test(url));
          productUrls.push(...locs);
        } catch (_) {
          // Ignore one failing sitemap and continue.
        }
      }

      const uniq = [...new Set(productUrls)];
      if (uniq.length > 0) {
        return uniq.map((url) => ({ url }));
      }

      throw new Error("Playzone sitemap khong tra ve URL san pham.");
    } catch (error) {
      lastError = error;
      console.warn(`[WARN] Playzone attempt ${attempt}/${PLAYZONE_MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt < PLAYZONE_MAX_ATTEMPTS) {
        await sleep(1200 * attempt);
      }
    }
  }

  throw lastError || new Error("Khong the lay du lieu Playzone.");
};

async function main() {
  const targetTotal = Number.isFinite(TARGET_TOTAL) && TARGET_TOTAL > 0 ? TARGET_TOTAL : 1990;

  console.log("Collecting source URLs...");
  const safeCollect = async (label, fn) => {
    try {
      return await fn();
    } catch (error) {
      console.warn(`[WARN] ${label} collect failed: ${error.message}`);
      return [];
    }
  };

  const [nguyenCongUrls, phongCachXanhUrls, playzoneUrls] = await Promise.all([
    safeCollect("NguyenCong", collectNguyenCongMonitorUrls),
    safeCollect("PhongCachXanh", collectPhongCachXanhUrls),
    safeCollect("Playzone", collectPlayzoneUrlsFromSitemap),
  ]);

  console.log(`NguyenCong monitor URLs: ${nguyenCongUrls.length}`);
  console.log(`PhongCachXanh WLmouse URLs: ${phongCachXanhUrls.length}`);
  console.log(`Playzone product URLs: ${playzoneUrls.length}`);

  const records = [];

  const nguyenCongRecords = await runWorkers(
    nguyenCongUrls,
    targetTotal - records.length,
    async (entry) => parseNguyenCongDetail(entry)
  );
  records.push(...nguyenCongRecords);
  console.log(`Parsed NguyenCong records: ${nguyenCongRecords.length}`);

  if (records.length < targetTotal) {
    const phongCachXanhRecords = await runWorkers(
      phongCachXanhUrls,
      targetTotal - records.length,
      async (entry) => parseShopifyLikeDetail(entry.url, "phongcachxanh")
    );
    records.push(...phongCachXanhRecords);
    console.log(`Parsed PhongCachXanh records: ${phongCachXanhRecords.length}`);
  }

  if (records.length < targetTotal) {
    const playzoneRecords = await runWorkers(
      playzoneUrls,
      targetTotal - records.length,
      async (entry) => parseShopifyLikeDetail(entry.url, "playzone")
    );
    records.push(...playzoneRecords);
    console.log(`Parsed Playzone records: ${playzoneRecords.length}`);
  }

  if (records.length === 0) {
    throw new Error("Khong thu thap duoc du lieu tu nguon.");
  }

  const trimmed = records.slice(0, targetTotal);
  const usedCodes = new Set();
  const usedSlugs = new Set();

  const normalizedProducts = trimmed.map((item, index) => {
    const sourcePrefix = sourceCodePrefix[item.source] || "SRC";
    const productCode = ensureUniqueCode(item.productCode, item.source, index, usedCodes);
    const slugBase = slugify(`${item.name}-${productCode}-${sourcePrefix}`) || `san-pham-${index + 1}`;
    const slug = ensureUniqueSlug(slugBase, index, usedSlugs);

    return {
      ...item,
      productCode,
      slug,
      stockQty: 20 + (index % 50),
      status: "active",
      gallery: uniqCompact([item.imageUrl, ...(Array.isArray(item.gallery) ? item.gallery : [])]).slice(0, GALLERY_MAX),
    };
  });

  await ensureProductCodeColumn();
  await ensureProductImagesTable();

  await query("BEGIN");
  try {
    const categoryMap = await ensureCategories();
    await ensureDefaultProductCodes();

    const rowsToApply = normalizedProducts.filter((item) => categoryMap.has(item.categorySlug));
    const appliedStats = await applySourceRecordsToCatalog(rowsToApply, categoryMap);

    const verify = await query("SELECT COUNT(*)::int AS total FROM products");
    const byCategory = await query(`
      SELECT c.slug, COUNT(*)::int AS total
      FROM products p
      JOIN categories c ON c.id = p.category_id
      GROUP BY c.slug
      ORDER BY c.slug
    `);
    const galleryStats = await query(`
      SELECT
        COUNT(DISTINCT p.id)::int AS products_total,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) THEN p.id END)::int AS products_has_gallery
      FROM products p
    `);

    await query("COMMIT");

    console.log(`Sync complete. Products in DB: ${verify.rows[0].total}`);
    console.log(`Updated from source: ${appliedStats.updated}`);
    console.log(`Skipped (no slot/category): ${appliedStats.skippedNoSlot}`);
    console.log(
      `Products with gallery: ${galleryStats.rows[0].products_has_gallery}/${galleryStats.rows[0].products_total}`
    );
    byCategory.rows.forEach((row) => console.log(` - ${row.slug}: ${row.total}`));
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
