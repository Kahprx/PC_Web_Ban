require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const TARGET_TOTAL = Number.parseInt(process.argv[2] || "1990", 10);
const CONCURRENCY = Math.max(4, Number.parseInt(process.argv[3] || "14", 10) || 14);
const SOURCE_MAX_ATTEMPTS = Math.max(3, Number.parseInt(process.argv[4] || "12", 10) || 12);

const SOURCE_URLS = {
  nguyenCongCollections: [
    "https://nguyencongpc.vn/bo-pc",
    "https://nguyencongpc.vn/man-hinh-may-tinh",
    "https://nguyencongpc.vn/cpu-bo-vi-xu-ly",
    "https://nguyencongpc.vn/mainboard-bo-mach-chu",
    "https://nguyencongpc.vn/vga-card-man-hinh",
    "https://nguyencongpc.vn/ram",
    "https://nguyencongpc.vn/o-cung-ssd",
    "https://nguyencongpc.vn/o-cung-hdd",
    "https://nguyencongpc.vn/psu-nguon-may-tinh",
    "https://nguyencongpc.vn/case-vo-may-tinh",
    "https://nguyencongpc.vn/tan-nhiet",
    "https://nguyencongpc.vn/laptop",
  ],
  phongCachXanhSitemapIndex: "https://www.phongcachxanh.vn/sitemap.xml",
  playzoneSitemapIndex: "https://playzone.vn/sitemap.xml",
  xuanVuAudioSitemapIndexes: [
    "https://tainghe.com.vn/sitemap.xml",
    "https://tainghe.com.vn/sitemap_product.xml",
    "https://xuanvuaudio.com/sitemap.xml",
    "https://xuanvuaudio.com/sitemap_index.xml",
    "https://xuanvuaudio.com/product-sitemap.xml",
    "https://www.xuanvuaudio.com/sitemap.xml",
    "https://www.xuanvuaudio.com/sitemap_index.xml",
  ],
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
  { name: "Macbook", slug: "macbook" },
];

const sourceCodePrefix = {
  nguyencongpc: "NGC",
  phongcachxanh: "PCX",
  playzone: "PZ",
  xuanvuaudio: "XVA",
};

const SOURCE_CATEGORY_POLICY = {
  nguyencongpc: new Set(["pc-gaming", "man-hinh", "linh-kien", "laptop", "macbook"]),
  playzone: new Set(["gaming-gear", "chuot", "ban-phim", "pad"]),
  phongcachxanh: new Set(["gaming-gear", "chuot", "ban-phim", "pad"]),
  xuanvuaudio: new Set(["tai-nghe"]),
};

const PRODUCT_CODE_MAX_LENGTH = 24;
const GALLERY_MAX = 10;
const REQUEST_TIMEOUT_MS = 30000;
const USE_NETWORK_SOURCES = String(process.env.SYNC_USE_NETWORK || "").trim() === "1";
const SNAPSHOT_FILE = path.join(__dirname, "..", "exports", "products_3000_2026-03-31.csv");
const PHONG_CACH_XANH_IMAGE_REGEX = /cdn\.shopify\.com\/s\/files\/1\/0636\/9044\/0949/i;
const PLAYZONE_IMAGE_REGEX = /cdn\.hstatic\.net\/products\/200000637319/i;
const NGUYEN_CONG_IMAGE_REGEX = /nguyencongpc\.vn\/media\/product/i;
const XUAN_VU_IMAGE_REGEX = /(tainghe\.com\.vn|xuanvuaudio|xuan_vu_audio)/i;

const XUAN_VU_FALLBACK_PRODUCTS = [
  {
    source: "xuanvuaudio",
    sourceUrl: "https://xuanvuaudio.com",
    categorySlug: "tai-nghe",
    productCode: "XVA-HEXA",
    name: "Tai nghe IEM Truthear HEXA",
    price: 1900000,
    imageUrl: "/uploads/5193_tai_nghe_truethear_hexa_xuan_vu_min.jpg",
  },
  {
    source: "xuanvuaudio",
    sourceUrl: "https://xuanvuaudio.com",
    categorySlug: "tai-nghe",
    productCode: "XVA-BL3F",
    name: "Tai nghe IEM Moondrop Blessing 3",
    price: 7790000,
    imageUrl: "/uploads/5276_tai_nghe_moondrop_blessing_3_xuan_vu_audio_1_min.jpg",
  },
  {
    source: "xuanvuaudio",
    sourceUrl: "https://xuanvuaudio.com",
    categorySlug: "tai-nghe",
    productCode: "XVA-BL3B",
    name: "Tai nghe IEM Moondrop Blessing 3 Blue",
    price: 7790000,
    imageUrl: "/uploads/5276_tai_nghe_moondrop_blessing_3_xuan_vu_audio_5_min.jpg",
  },
  {
    source: "xuanvuaudio",
    sourceUrl: "https://xuanvuaudio.com",
    categorySlug: "tai-nghe",
    productCode: "XVA-KQRT",
    name: "Tai nghe IEM Kiwi Ears Quartet",
    price: 4150000,
    imageUrl: "/uploads/5542_tai_nghe_kiwi_ears_quartet_xuan_vu_audio_min.jpg",
  },
  {
    source: "xuanvuaudio",
    sourceUrl: "https://xuanvuaudio.com",
    categorySlug: "tai-nghe",
    productCode: "XVA-MON2",
    name: "Tai nghe IEM Thieaudio Monarch MKII",
    price: 13990000,
    imageUrl: "/uploads/5603_tai_nghe_thieaudio_monarch_mkii_xuan_vu_audio_chinh_hang_4.jpg",
  },
];

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

const normalizeCategoryForSource = (sourceKey, detectedCategory, name = "", url = "") => {
  const policy = SOURCE_CATEGORY_POLICY[sourceKey];
  if (!policy) return String(detectedCategory || "").trim().toLowerCase();

  const safeDetected = String(detectedCategory || "").trim().toLowerCase();
  const text = normalizeText(`${name} ${url}`);

  if (sourceKey === "xuanvuaudio") return "tai-nghe";
  if (sourceKey === "nguyencongpc") {
    const forced =
      (/(macbook|apple m1|apple m2|apple m3)/.test(text) && "macbook") ||
      (/(laptop|notebook)/.test(text) && "laptop") ||
      (/(pc gaming|bo pc|build pc|workstation|pc-)/.test(text) && "pc-gaming") ||
      (/(man hinh|monitor|oled|hz|display)/.test(text) && "man-hinh");
    if (forced && policy.has(forced)) return forced;
    if (safeDetected && policy.has(safeDetected)) return safeDetected;
    return "linh-kien";
  }

  if (sourceKey === "playzone" || sourceKey === "phongcachxanh") {
    if (/(chuot|mouse)/.test(text) && policy.has("chuot")) return "chuot";
    if (/(ban phim|keyboard|switch|keycap)/.test(text) && policy.has("ban-phim")) return "ban-phim";
    if (/(pad|lot chuot|mousepad|deskmat|ban di chuot)/.test(text) && policy.has("pad")) return "pad";
    if (safeDetected && policy.has(safeDetected)) return safeDetected;
    return "gaming-gear";
  }

  if (safeDetected && policy.has(safeDetected)) return safeDetected;
  return safeDetected || "linh-kien";
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

const mapSourceByImageUrl = (imageUrl = "") => {
  const text = String(imageUrl || "");
  if (NGUYEN_CONG_IMAGE_REGEX.test(text)) return "nguyencongpc";
  if (PHONG_CACH_XANH_IMAGE_REGEX.test(text)) return "phongcachxanh";
  if (PLAYZONE_IMAGE_REGEX.test(text)) return "playzone";
  if (XUAN_VU_IMAGE_REGEX.test(text)) return "xuanvuaudio";
  return "";
};

const loadSnapshotRecords = () => {
  if (!fs.existsSync(SNAPSHOT_FILE)) return [];
  const text = fs.readFileSync(SNAPSHOT_FILE, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const indexBy = Object.fromEntries(headers.map((header, index) => [header, index]));
  const required = ["product_code", "name", "price", "image_url", "status", "slug"];
  if (required.some((key) => !Object.prototype.hasOwnProperty.call(indexBy, key))) {
    return [];
  }

  const result = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cols = rows[i];
    const status = String(cols[indexBy.status] || "").trim().toLowerCase();
    if (status !== "active") continue;

    const name = stripTags(cols[indexBy.name] || "");
    const imageUrl = String(cols[indexBy.image_url] || "").trim();
    const price = toPriceVnd(cols[indexBy.price] || 0, "normal");
    const productCode = cleanCode(cols[indexBy.product_code] || "");
    const slugRaw = String(cols[indexBy.slug] || "").trim();
    const source = mapSourceByImageUrl(imageUrl);
    if (!source || !name || !imageUrl || price <= 0) continue;

    const detectedCategory = classifyCategory(name, imageUrl);
    const categorySlug = normalizeCategoryForSource(source, detectedCategory, name, imageUrl);
    const policy = SOURCE_CATEGORY_POLICY[source];
    if (policy && !policy.has(categorySlug)) continue;

    result.push({
      source,
      sourceUrl: imageUrl,
      categorySlug,
      productCode,
      name,
      price,
      imageUrl,
      gallery: [imageUrl],
      description: `Nguon snapshot: ${source}`,
      slug: slugRaw || slugify(`${name}-${productCode}`),
    });
  }

  return result;
};

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
  const detectedCategory = classifyCategory(name, url);
  const categorySlug = normalizeCategoryForSource("nguyencongpc", detectedCategory, name, url);

  return {
    source: "nguyencongpc",
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
  const detectedCategory = classifyCategory(`${name} ${data.type || ""} ${tagText}`, url);
  const categorySlug = normalizeCategoryForSource(sourceKey, detectedCategory, `${name} ${tagText}`, url);

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

const parseGenericDetailFromHtml = async (url, sourceKey, fallbackCode = "") => {
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
  const candidateOffer = Array.isArray(offers?.offers) ? offers.offers[0] : offers;
  const priceRaw =
    offers.lowPrice ||
    offers.price ||
    candidateOffer?.price ||
    product?.price ||
    [...String(html).matchAll(/["']price["']\s*:\s*["']?([0-9.]+)["']?/gi)][0]?.[1] ||
    null;

  const unit = Number(priceRaw) > 100000 ? "normal" : "cent";
  const price = toPriceVnd(priceRaw, unit);

  const parsedUrl = new URL(url);
  const imageCandidates = []
    .concat(Array.isArray(product.image) ? product.image : [product.image])
    .concat([...html.matchAll(/property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)].map((m) => m[1]))
    .concat([...html.matchAll(/data-zoom-image=["']([^"']+)["']/gi)].map((m) => m[1]))
    .concat([...html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)].slice(0, 10).map((m) => m[1]));

  const imageList = uniqCompact(imageCandidates.map((image) => normalizeImageUrl(image, `${parsedUrl.protocol}//${parsedUrl.host}`))).slice(
    0,
    GALLERY_MAX
  );
  const imageUrl = imageList[0] || "";
  if (!name || !imageUrl || price <= 0) return null;

  const productCode = cleanCode(
    product.sku || product.productID || product.mpn || product.gtin13 || product.gtin12 || fallbackCode || parsedUrl.pathname
  );
  const detectedCategory = classifyCategory(name, url);
  const categorySlug = normalizeCategoryForSource(sourceKey, detectedCategory, name, url);

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

const parseTaingheDetail = async (url, sourceKey, fallbackCode = "") => {
  const html = await fetchText(url);
  const parsedUrl = new URL(url);

  const nameMatch =
    html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  const rawName = stripTags(nameMatch?.[1] || "");
  const name = rawName.split("|")[0].trim() || rawName;

  const imageMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const imageUrl = normalizeImageUrl(imageMatch?.[1] || "", `${parsedUrl.protocol}//${parsedUrl.host}`);

  const priceMatch =
    html.match(/class=["'][^"']*js-price_config[^"']*["'][^>]*data-price=["']?(\d{4,})["']?/i) ||
    html.match(/["']sale_price["']\s*:\s*(\d{4,})/i) ||
    html.match(/["']price["']\s*:\s*(\d{4,})/i);
  const price = toPriceVnd(priceMatch?.[1] || 0, "normal");

  const skuMatch =
    html.match(/["']sku["']\s*:\s*["']([^"']+)["']/i) ||
    html.match(/data-sku=["']([^"']+)["']/i);
  const rawSku = String(skuMatch?.[1] || "").trim();
  const cleanedSku = cleanCode(rawSku);
  const invalidSku =
    !cleanedSku ||
    /^(sku|-sku-|data-sku|null|undefined)$/i.test(cleanedSku) ||
    (cleanedSku.toLowerCase().includes("sku") && !/\d{3,}/.test(cleanedSku));
  const productCode = cleanCode(
    (invalidSku ? "" : cleanedSku) || fallbackCode || parsedUrl.pathname.split("/").filter(Boolean).pop()
  );

  if (!name || !imageUrl || price <= 0) return null;

  const detectedCategory = classifyCategory(name, url);
  const categorySlug = normalizeCategoryForSource(sourceKey, detectedCategory, name, url);
  const gallery = uniqCompact([
    imageUrl,
    ...[...html.matchAll(/["']image["']\s*:\s*["']([^"']+)["']/gi)].map((m) =>
      normalizeImageUrl(m[1], `${parsedUrl.protocol}//${parsedUrl.host}`)
    ),
  ]).slice(0, GALLERY_MAX);

  return {
    source: sourceKey,
    sourceUrl: url,
    categorySlug,
    productCode,
    name,
    price,
    imageUrl,
    gallery,
    description: `Nguon: ${url}`,
  };
};

const parseDetailBySource = async ({ url, fallbackCode = "", sourceKey }) => {
  if (!url) return null;
  if (sourceKey === "nguyencongpc") {
    return parseNguyenCongDetail({ url, fallbackCode });
  }

  if (sourceKey === "xuanvuaudio" && /tainghe\.com\.vn/i.test(url)) {
    try {
      const taingheItem = await parseTaingheDetail(url, sourceKey, fallbackCode);
      if (taingheItem) return taingheItem;
    } catch (_) {
      // Fall through.
    }
  }

  if (sourceKey === "playzone" || sourceKey === "phongcachxanh") {
    try {
      const shopifyItem = await parseShopifyLikeDetail(url, sourceKey);
      if (shopifyItem) return shopifyItem;
    } catch (_) {
      // Fall through to generic parser if .js endpoint is blocked.
    }
  }

  return parseGenericDetailFromHtml(url, sourceKey, fallbackCode);
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

const pickRecordsBySource = (records, sourceKey, maxNeeded, preferredCategories = null) => {
  if (!Array.isArray(records) || maxNeeded <= 0) return [];
  const policy = SOURCE_CATEGORY_POLICY[sourceKey];
  const targetCategories = preferredCategories && preferredCategories.size > 0 ? preferredCategories : policy;
  const picked = [];
  const seen = new Set();

  for (const item of records) {
    if (picked.length >= maxNeeded) break;
    if (String(item.source || "") !== sourceKey) continue;
    if (targetCategories && !targetCategories.has(String(item.categorySlug || ""))) continue;
    const code = String(item.productCode || "") || `${sourceKey}-${picked.length + 1}`;
    if (seen.has(code)) continue;
    seen.add(code);
    picked.push(item);
  }

  return picked;
};

const expandRecordsToTarget = (baseRecords, sourceKey, target) => {
  if (!Array.isArray(baseRecords) || baseRecords.length === 0 || target <= 0) return [];
  const expanded = [];
  for (let i = 0; i < target; i += 1) {
    const base = baseRecords[i % baseRecords.length];
    const suffix = i + 1;
    expanded.push({
      ...base,
      source: sourceKey,
      productCode: cleanCode(`${base.productCode || sourceCodePrefix[sourceKey] || "SRC"}-${suffix}`),
      slug: `${base.slug || slugify(base.name || `san-pham-${suffix}`)}-${suffix}`,
      description: base.description || `Nguon snapshot: ${sourceKey}`,
      gallery: Array.isArray(base.gallery) && base.gallery.length > 0 ? base.gallery : [base.imageUrl],
    });
  }
  return expanded;
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
      WHEN 'gaming-gear' THEN 'GG-' || LPAD(p.id::text, 6, '0')
      WHEN 'laptop' THEN 'LP-' || LPAD(p.id::text, 6, '0')
      WHEN 'macbook' THEN 'MB-' || LPAD(p.id::text, 6, '0')
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

const collectNguyenCongUrls = async () => {
  const all = [];

  for (const collectionUrl of SOURCE_URLS.nguyenCongCollections) {
    try {
      const firstPageHtml = await fetchText(collectionUrl);
      const pageNumbers = [...firstPageHtml.matchAll(/[?&]page=(\d+)/gi)].map((m) => Number(m[1]));
      const maxPage = Math.max(1, ...pageNumbers.filter((n) => Number.isFinite(n)));

      for (let page = 1; page <= Math.min(maxPage, 12); page += 1) {
        const url = page === 1 ? collectionUrl : `${collectionUrl}${collectionUrl.includes("?") ? "&" : "?"}page=${page}`;
        try {
          const html = page === 1 ? firstPageHtml : await fetchText(url);
          const rows = parseNguyenCongCollectionProducts(html);
          all.push(...rows);
        } catch (_) {
          // Skip one page if blocked.
        }
      }
    } catch (_) {
      // Skip one collection and continue.
    }
  }

  const uniq = new Map();
  for (const item of all) {
    if (!uniq.has(item.url)) uniq.set(item.url, item);
  }
  return Array.from(uniq.values());
};

const buildShopifySitemapFallbacks = (host) => {
  const base = `https://${host}`;
  const urls = [];
  for (let i = 1; i <= 60; i += 1) {
    urls.push(`${base}/sitemap_products_${i}.xml`);
  }
  return urls;
};

const collectProductUrlsFromSitemap = async ({ label, indexUrl, host }) => {
  let lastError = null;

  for (let attempt = 1; attempt <= SOURCE_MAX_ATTEMPTS; attempt += 1) {
    try {
      let sitemapUrls = [];

      if (indexUrl) {
        try {
          const indexXml = await fetchText(indexUrl);
          sitemapUrls = parseXmlLocs(indexXml).filter((url) => /sitemap.*product|product-sitemap/i.test(url));
        } catch (_) {
          sitemapUrls = [];
        }
      }

      if (sitemapUrls.length === 0) {
        sitemapUrls = buildShopifySitemapFallbacks(host);
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

      throw new Error(`${label} sitemap khong tra ve URL san pham.`);
    } catch (error) {
      lastError = error;
      console.warn(`[WARN] ${label} attempt ${attempt}/${SOURCE_MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt < SOURCE_MAX_ATTEMPTS) {
        await sleep(1200 * attempt);
      }
    }
  }

  throw lastError || new Error(`Khong the lay du lieu ${label}.`);
};

const collectPlayzoneUrlsFromSitemap = async () =>
  collectProductUrlsFromSitemap({
    label: "Playzone",
    indexUrl: SOURCE_URLS.playzoneSitemapIndex,
    host: "playzone.vn",
  });

const collectPhongCachXanhUrlsFromSitemap = async () =>
  collectProductUrlsFromSitemap({
    label: "PhongCachXanh",
    indexUrl: SOURCE_URLS.phongCachXanhSitemapIndex,
    host: "www.phongcachxanh.vn",
  });

const collectXuanVuUrls = async () => {
  const sitemapCandidates = SOURCE_URLS.xuanVuAudioSitemapIndexes;
  const productUrls = [];
  const xuanVuProductRegex = /\/(san-pham|product|products|tai-nghe|iem|in-ear|headphone|headset)(\/|$)/i;
  const taingheProductRegex = /\/(tai-nghe|iem|in-ear|earbud|headphone|headset)/i;

  for (const indexUrl of sitemapCandidates) {
    try {
      const xml = await fetchText(indexUrl);
      const directLocs = parseXmlLocs(xml);
      const isTaingheDomain = /tainghe\.com\.vn/i.test(indexUrl);
      const isTaingheProductSitemap = /sitemap_product\.xml/i.test(indexUrl);

      if (isTaingheDomain && isTaingheProductSitemap) {
        const productLocs = directLocs.filter((url) => taingheProductRegex.test(url));
        productUrls.push(...productLocs);
      } else {
        const productLocs = directLocs.filter((url) => xuanVuProductRegex.test(url));
        productUrls.push(...productLocs);
      }

      const nestedSitemaps = directLocs.filter(
        (url) => /sitemap|product/i.test(url) || (isTaingheDomain && /sitemap_product\.xml/i.test(url))
      );
      for (const nestedUrl of nestedSitemaps) {
        try {
          const nestedXml = await fetchText(nestedUrl);
          const nestedIsTaingheProduct = /tainghe\.com\.vn/i.test(nestedUrl) && /sitemap_product\.xml/i.test(nestedUrl);
          const nestedLocs = parseXmlLocs(nestedXml).filter((url) =>
            nestedIsTaingheProduct ? taingheProductRegex.test(url) : xuanVuProductRegex.test(url)
          );
          productUrls.push(...nestedLocs);
        } catch (_) {
          // Skip one nested sitemap.
        }
      }
    } catch (_) {
      // Skip one index sitemap.
    }
  }

  const uniq = [...new Set(productUrls)];
  return uniq.map((url) => ({ url }));
};

async function main() {
  const targetTotal = Number.isFinite(TARGET_TOTAL) && TARGET_TOTAL > 0 ? TARGET_TOTAL : 1990;
  console.log(`Target sync scale: ${targetTotal}`);

  await ensureProductCodeColumn();
  await ensureProductImagesTable();
  const categoryMap = await ensureCategories();
  await ensureDefaultProductCodes();

  const slotsByCategory = await loadCatalogSlotsByCategory();
  const countSlots = (slugs = []) =>
    slugs.reduce((sum, slug) => sum + ((slotsByCategory.get(slug) || []).length || 0), 0);

  const nguyenCongTarget = countSlots([...SOURCE_CATEGORY_POLICY.nguyencongpc]);
  const xuanVuTarget = countSlots([...SOURCE_CATEGORY_POLICY.xuanvuaudio]);
  const gearTarget = countSlots([...SOURCE_CATEGORY_POLICY.playzone]);
  const playzoneTarget = Math.ceil(gearTarget * 0.6);
  const phongCachXanhTarget = Math.max(0, gearTarget - playzoneTarget);

  const records = [];
  const snapshotRecords = loadSnapshotRecords();

  if (USE_NETWORK_SOURCES) {
    console.log("Collecting source URLs from live websites...");
    const safeCollect = async (label, fn) => {
      try {
        return await fn();
      } catch (error) {
        console.warn(`[WARN] ${label} collect failed: ${error.message}`);
        return [];
      }
    };

    const [nguyenCongUrls, phongCachXanhUrls, playzoneUrls, xuanVuUrls] = await Promise.all([
      safeCollect("NguyenCong", collectNguyenCongUrls),
      safeCollect("PhongCachXanh", collectPhongCachXanhUrlsFromSitemap),
      safeCollect("Playzone", collectPlayzoneUrlsFromSitemap),
      safeCollect("XuanVuAudio", collectXuanVuUrls),
    ]);

    console.log(`NguyenCong URLs: ${nguyenCongUrls.length}`);
    console.log(`PhongCachXanh URLs: ${phongCachXanhUrls.length}`);
    console.log(`Playzone product URLs: ${playzoneUrls.length}`);
    console.log(`XuanVuAudio URLs: ${xuanVuUrls.length}`);

    const nguyenCongRecords = await runWorkers(
      nguyenCongUrls,
      Math.max(0, nguyenCongTarget),
      async (entry) => parseDetailBySource({ ...entry, sourceKey: "nguyencongpc" })
    );
    records.push(...nguyenCongRecords);
    console.log(`Parsed NguyenCong records: ${nguyenCongRecords.length}`);

    if (phongCachXanhTarget > 0) {
      const phongCachXanhRecords = await runWorkers(
        phongCachXanhUrls,
        phongCachXanhTarget,
        async (entry) => parseDetailBySource({ ...entry, sourceKey: "phongcachxanh" })
      );
      records.push(...phongCachXanhRecords);
      console.log(`Parsed PhongCachXanh records: ${phongCachXanhRecords.length}`);
    }

    if (playzoneTarget > 0) {
      const playzoneRecords = await runWorkers(
        playzoneUrls,
        playzoneTarget,
        async (entry) => parseDetailBySource({ ...entry, sourceKey: "playzone" })
      );
      records.push(...playzoneRecords);
      console.log(`Parsed Playzone records: ${playzoneRecords.length}`);
    }

    if (xuanVuTarget > 0) {
      const xuanVuRecords = await runWorkers(
        xuanVuUrls,
        xuanVuTarget,
        async (entry) => parseDetailBySource({ ...entry, sourceKey: "xuanvuaudio" })
      );
      records.push(...xuanVuRecords);
      console.log(`Parsed XuanVuAudio records: ${xuanVuRecords.length}`);
    }
  } else {
    console.log("SYNC_USE_NETWORK != 1 -> using local snapshot + curated source pools.");
  }

  const fillFromSnapshot = (sourceKey, target, preferredCategories = null) => {
    if (target <= 0) return;
    const current = records.filter((item) => item.source === sourceKey).length;
    const missing = Math.max(0, target - current);
    if (missing <= 0) return;

    const pool = pickRecordsBySource(snapshotRecords, sourceKey, Number.MAX_SAFE_INTEGER, preferredCategories);
    if (pool.length === 0) return;

    const picked = expandRecordsToTarget(pool, sourceKey, missing);
    records.push(...picked);
    if (picked.length > 0) {
      console.log(`Snapshot top-up ${sourceKey}: +${picked.length}`);
    }
  };

  fillFromSnapshot("nguyencongpc", nguyenCongTarget, SOURCE_CATEGORY_POLICY.nguyencongpc);
  fillFromSnapshot("playzone", playzoneTarget, SOURCE_CATEGORY_POLICY.playzone);
  fillFromSnapshot("phongcachxanh", phongCachXanhTarget, SOURCE_CATEGORY_POLICY.phongcachxanh);
  fillFromSnapshot("xuanvuaudio", xuanVuTarget, SOURCE_CATEGORY_POLICY.xuanvuaudio);

  const xuanVuCurrent = records.filter((item) => item.source === "xuanvuaudio").length;
  const xuanVuMissing = Math.max(0, xuanVuTarget - xuanVuCurrent);
  if (xuanVuMissing > 0) {
    for (let i = 0; i < xuanVuMissing; i += 1) {
      const base = XUAN_VU_FALLBACK_PRODUCTS[i % XUAN_VU_FALLBACK_PRODUCTS.length];
      records.push({
        ...base,
        productCode: `${base.productCode}-${String(i + 1).padStart(3, "0")}`,
        name: base.name,
        gallery: [base.imageUrl],
        description: `Nguon: ${base.sourceUrl}`,
      });
    }
    console.log(`Curated top-up xuanvuaudio: +${xuanVuMissing}`);
  }

  if (records.length === 0) {
    throw new Error("Khong thu thap duoc du lieu tu nguon.");
  }

  const trimmed = records;
  const existingCodeRows = await query(
    "SELECT product_code FROM products WHERE product_code IS NOT NULL AND product_code <> ''"
  );
  const usedCodes = new Set(existingCodeRows.rows.map((row) => String(row.product_code || "").trim()).filter(Boolean));
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

  await query("BEGIN");
  try {
    const rowsToApply = normalizedProducts.filter((item) => {
      if (!categoryMap.has(item.categorySlug)) return false;
      const sourcePolicy = SOURCE_CATEGORY_POLICY[item.source];
      if (sourcePolicy && !sourcePolicy.has(item.categorySlug)) return false;
      return true;
    });
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
