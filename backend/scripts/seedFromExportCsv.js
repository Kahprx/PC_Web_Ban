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
const NGUYEN_CONG_DOMAIN_REGEX = /https?:\/\/(?:www\.)?nguyencongpc\.vn\//i;
const categoryCodePrefix = {
  "pc-gaming": "PCG",
  "linh-kien": "LK",
  "man-hinh": "MH",
  chuot: "CH",
  pad: "PAD",
  "ban-phim": "BP",
  "tai-nghe": "TN",
};

const LINH_KIEN_PARTS = ["cpu", "mainboard", "ram", "ssd", "hdd", "psu", "vga", "case"];

const CPU_INTEL = [
  "Intel Core i3-12100F",
  "Intel Core i5-12400F",
  "Intel Core i5-14600K",
  "Intel Core i7-13700K",
  "Intel Core i7-14700K",
  "Intel Core i9-14900K",
];

const CPU_AMD = [
  "AMD Ryzen 5 5500",
  "AMD Ryzen 5 5600",
  "AMD Ryzen 5 7600",
  "AMD Ryzen 7 7700",
  "AMD Ryzen 7 7800X3D",
  "AMD Ryzen 9 7900X",
  "AMD Ryzen 9 9900X",
];

const MAINBOARD_INTEL = ["X299", "Z690", "Z790", "B660", "B760"];
const MAINBOARD_AMD_B = ["AMD B450", "AMD B550", "AMD B650", "AMD B850"];
const MAINBOARD_BRANDS = ["ASUS", "MSI", "GIGABYTE", "ASROCK", "COLORFUL"];

const RAM_TYPES = ["DDR3", "DDR4", "DDR5"];
const RAM_CAPS = ["8GB", "16GB", "32GB", "64GB"];

const STORAGE_CAPS = ["128GB", "256GB", "512GB", "1TB", "2TB", "4TB"];
const STORAGE_BUS = ["SATA", "NVMe Gen3", "NVMe Gen4", "NVMe Gen5"];

const PSU_WATTS = [350, 450, 550, 650, 750, 850, 1000, 1250];
const PSU_RATING = ["80+ Bronze", "80+ Gold", "80+ Platinum"];

const VGA_NVIDIA = [
  "GTX 1650",
  "RTX 2060",
  "RTX 3060",
  "RTX 4060",
  "RTX 4070",
  "RTX 4080",
  "RTX 4090",
  "RTX 5070",
  "RTX 5080",
  "RTX 5090",
];

const VGA_AMD = [
  "RX 6500 XT",
  "RX 6600",
  "RX 6650 XT",
  "RX 6700 XT",
  "RX 6750 XT",
  "RX 6800",
  "RX 6800 XT",
  "RX 6900 XT",
  "RX 7600",
  "RX 7600 XT",
  "RX 7700 XT",
  "RX 7800 XT",
  "RX 7900 GRE",
  "RX 7900 XT",
  "RX 7900 XTX",
];

const VGA_ALL = [...VGA_NVIDIA, ...VGA_AMD];

const CASE_BRANDS = [
  "ASUS",
  "MSI",
  "GIGABYTE",
  "ASROCK",
  "COLORFUL",
  "NZXT",
  "CORSAIR",
  "LIAN LI",
  "THERMALTAKE",
  "DEEPCOOL",
  "COOLER MASTER",
  "ANTEC",
  "MONTECH",
  "FRACTAL DESIGN",
  "INWIN",
  "XIGMATEK",
  "HYTE",
];

const pick = (arr, index) => arr[index % arr.length];
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
const isNguyenCongImage = (value) => NGUYEN_CONG_DOMAIN_REGEX.test(String(value || "").trim());
const buildCategoryCode = (slug, index) => {
  const prefix = categoryCodePrefix[slug] || "SP";
  return fitCode(`${prefix}-${String(index).padStart(5, "0")}`);
};

const composeSpecDescription = (specs) =>
  [
    `CPU: ${specs.cpu}`,
    `MAINBOARD: ${specs.mainboard}`,
    `RAM: ${specs.ram}`,
    `VGA: ${specs.vga}`,
    `SSD: ${specs.ssd}`,
    `HDD: ${specs.hdd}`,
    `PSU: ${specs.psu}`,
    `CASE: ${specs.case}`,
    "SOURCE: nguyencongpc.vn",
  ].join(" | ");

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

const loadCsvSnapshot = () => {
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
  const imageSet = new Set();
  for (let i = 1; i < rows.length; i += 1) {
    const cols = rows[i];
    const status = String(cols[indexBy.status] || "").trim().toLowerCase();
    if (status !== "active") {
      continue;
    }

    const rawImageUrl = String(cols[indexBy.image_url] || "").trim();
    if (isNguyenCongImage(rawImageUrl)) {
      imageSet.add(rawImageUrl);
    }

    const categorySlug = String(cols[indexBy.category_slug] || "")
      .trim()
      .toLowerCase();
    if (!baseQuota[categorySlug]) {
      continue;
    }

    const productCode = fitCode(cols[indexBy.product_code]);
    const name = String(cols[indexBy.name] || "").trim();
    const imageUrl = rawImageUrl;
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

  return {
    records,
    nguyenCongImages: [...imageSet],
  };
};

const pickTopByQuota = (records, quota) => {
  const target = Object.values(quota).reduce((sum, value) => sum + value, 0);
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

const buildLinhKienPartCounts = (targetTotal) => {
  if (targetTotal <= 0) {
    return Object.fromEntries(LINH_KIEN_PARTS.map((part) => [part, 0]));
  }

  const counts = Object.fromEntries(LINH_KIEN_PARTS.map((part) => [part, 1]));

  if (targetTotal >= 10) {
    counts.vga = 10;
  }
  if (targetTotal >= CASE_BRANDS.length) {
    counts.case = CASE_BRANDS.length;
  }

  let current = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (current > targetTotal) {
    const shrinkOrder = ["case", "vga", "cpu", "mainboard", "ram", "ssd", "hdd", "psu"];
    while (current > targetTotal) {
      const part = shrinkOrder.find((partName) => counts[partName] > 1);
      if (!part) break;
      counts[part] -= 1;
      current -= 1;
    }
    return counts;
  }

  const growthOrder = ["cpu", "mainboard", "ram", "ssd", "hdd", "psu", "vga"];
  let cursor = 0;
  while (current < targetTotal) {
    counts[growthOrder[cursor % growthOrder.length]] += 1;
    current += 1;
    cursor += 1;
  }

  return counts;
};

const createLinhKienRecords = (targetTotal, nguyenCongImages) => {
  if (targetTotal <= 0) return [];
  if (!Array.isArray(nguyenCongImages) || nguyenCongImages.length === 0) {
    throw new Error("Khong tim thay image nguon Nguyen Cong trong CSV.");
  }

  const counts = buildLinhKienPartCounts(targetTotal);
  const records = [];

  const pushRecord = (part, partIndex, globalIndex) => {
    const cpu = globalIndex % 2 === 0 ? pick(CPU_INTEL, globalIndex) : pick(CPU_AMD, globalIndex);
    const isIntelCpu = cpu.toLowerCase().includes("intel");
    const mainboardChipset = isIntelCpu ? pick(MAINBOARD_INTEL, globalIndex) : pick(MAINBOARD_AMD_B, globalIndex);
    const mainboard = `${pick(MAINBOARD_BRANDS, globalIndex)} ${mainboardChipset}`;
    const ram = `${pick(RAM_TYPES, globalIndex)} ${pick(RAM_CAPS, globalIndex + 3)}`;
    const ssd = `${pick(STORAGE_CAPS, globalIndex)} ${pick(STORAGE_BUS, globalIndex + 1)}`;
    const hdd = `${pick(STORAGE_CAPS, globalIndex + 2)} SATA`;
    const psu = `${pick(PSU_WATTS, globalIndex)}W ${pick(PSU_RATING, globalIndex + 4)}`;
    const vga = pick(VGA_ALL, globalIndex);
    const caseBrand = part === "case" ? pick(CASE_BRANDS, partIndex) : pick(CASE_BRANDS, globalIndex);
    const caseName = `${caseBrand} Mid Tower`;

    const specs = {
      cpu,
      mainboard,
      ram,
      vga,
      ssd,
      hdd,
      psu,
      case: caseName,
    };

    let name = "";
    let price = 0;
    if (part === "cpu") {
      name = `CPU ${cpu}`;
      price = 2500000 + (partIndex % 18) * 450000;
    } else if (part === "mainboard") {
      name = `Mainboard ${mainboard}`;
      price = 1800000 + (partIndex % 16) * 300000;
    } else if (part === "ram") {
      name = `RAM ${ram}`;
      price = 650000 + (partIndex % 16) * 120000;
    } else if (part === "ssd") {
      name = `SSD ${ssd}`;
      price = 550000 + (partIndex % 16) * 160000;
    } else if (part === "hdd") {
      name = `HDD ${hdd}`;
      price = 500000 + (partIndex % 16) * 130000;
    } else if (part === "psu") {
      name = `Nguon ${psu}`;
      price = 800000 + (partIndex % 16) * 150000;
    } else if (part === "vga") {
      name = `VGA ${vga}`;
      price = 4200000 + (partIndex % 16) * 420000;
    } else {
      name = `Case PC ${caseName}`;
      price = 950000 + (partIndex % 16) * 160000;
    }

    const imageUrl = nguyenCongImages[globalIndex % nguyenCongImages.length];
    const slugBase = slugify(`linh-kien-${part}-${name}-${globalIndex + 1}`);

    records.push({
      categorySlug: "linh-kien",
      productCode: "",
      name,
      slug: `${slugBase}-${String(globalIndex + 1).padStart(5, "0")}`,
      description: composeSpecDescription(specs),
      price,
      stockQty: 8 + (globalIndex % 60),
      imageUrl,
      status: "active",
    });
  };

  let globalIndex = 0;
  for (const part of LINH_KIEN_PARTS) {
    for (let i = 0; i < counts[part]; i += 1) {
      pushRecord(part, i, globalIndex);
      globalIndex += 1;
    }
  }

  return records.slice(0, targetTotal);
};

const ensureNguyenCongImage = (imageUrl, nguyenCongImages, index) => {
  if (isNguyenCongImage(imageUrl)) return imageUrl;
  return nguyenCongImages[index % nguyenCongImages.length];
};

async function main() {
  const target = Number.isFinite(TARGET_TOTAL) && TARGET_TOTAL > 0 ? TARGET_TOTAL : 100;
  const { records, nguyenCongImages } = loadCsvSnapshot();
  if (nguyenCongImages.length === 0) {
    throw new Error("Khong tim thay image nguon Nguyen Cong trong CSV.");
  }

  const quota = scaleQuota(target);
  const linhKienTarget = Number(quota["linh-kien"] || 0);
  const nonLinhKienQuota = Object.fromEntries(Object.entries(quota).filter(([slug]) => slug !== "linh-kien"));
  const nonLinhKienRecords = records.filter((item) => item.categorySlug !== "linh-kien");

  const selectedNonLinhKien = pickTopByQuota(nonLinhKienRecords, nonLinhKienQuota);
  const generatedLinhKien = createLinhKienRecords(linhKienTarget, nguyenCongImages);
  const selected = [...selectedNonLinhKien, ...generatedLinhKien]
    .slice(0, target)
    .map((item, index) => ({
      ...item,
      imageUrl: ensureNguyenCongImage(item.imageUrl, nguyenCongImages, index),
    }));

  if (selected.length !== target) {
    throw new Error(`Khong tao du ${target} san pham. Hien tai: ${selected.length}`);
  }

  if (selected.length === 0) {
    throw new Error("Khong lay duoc ban ghi nao tu CSV de seed.");
  }

  await ensureSchema();
  await query("BEGIN");

  try {
    const categoryMap = await ensureCategories();
    await query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");
    const codeIndexByCategory = {};

    let inserted = 0;
    for (const item of selected) {
      const categoryId = categoryMap.get(item.categorySlug);
      if (!categoryId) continue;
      const nextIndex = (codeIndexByCategory[item.categorySlug] || 0) + 1;
      codeIndexByCategory[item.categorySlug] = nextIndex;
      const productCode = buildCategoryCode(item.categorySlug, nextIndex);

      const insertResult = await query(
        `INSERT INTO products (category_id, product_code, name, slug, description, price, stock_qty, image_url, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          categoryId,
          productCode,
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
