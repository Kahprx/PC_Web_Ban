require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const sourceSitemaps = [
  "https://playzone.vn/sitemap_products_1.xml",
  "https://gearvn.com/sitemap_products_1.xml",
  "https://www.phongcachxanh.vn/sitemap_products_1.xml?from=7631822651637&to=9575925121269",
];

const staticNguyenCongPcPool = [
  {
    source: "nguyencongpc.vn",
    title: "PC Gaming Ryzen 7 7800X3D RAM 32GB RTX 5070 12GB",
    image: "https://nguyencongpc.vn/media/product/28601-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb-01.jpg",
    loc: "https://nguyencongpc.vn/bo-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb",
  },
  {
    source: "nguyencongpc.vn",
    title: "PC Gaming Ryzen 7 7800X3D RAM 32GB RTX 5080 16GB",
    image: "https://nguyencongpc.vn/media/product/29325-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5080-16gb-11.jpg",
    loc: "https://nguyencongpc.vn/bo-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5080-16gb",
  },
  {
    source: "nguyencongpc.vn",
    title: "PC Gaming 25251340",
    image: "https://nguyencongpc.vn/media/product/27426-pc-gaming-25251340.jpg",
    loc: "https://nguyencongpc.vn/pc-gaming-25251340",
  },
  {
    source: "nguyencongpc.vn",
    title: "PC Gaming Ryzen 7 9800X3D RTX 5080",
    image: "https://nguyencongpc.vn/media/product/27462-b--pc-gaming-ryzen-7-9800x3d-ram-32g-vga-rtx-5080.jpg",
    loc: "https://nguyencongpc.vn/pc-gaming-ryzen-7-9800x3d-rtx-5080",
  },
  {
    source: "nguyencongpc.vn",
    title: "PC Gaming AMD Ryzen 5 5500 RX 7600",
    image: "https://nguyencongpc.vn/media/product/27563-pc-gaming-amd-ryzen-5-5500-ram-16gb-rx-7600-8gb.jpg",
    loc: "https://nguyencongpc.vn/pc-gaming-amd-ryzen-5-5500-rx-7600",
  },
  {
    source: "nguyencongpc.vn",
    title: "PC Gaming Intel Core i7 14700K RTX 4070 Super",
    image: "https://nguyencongpc.vn/media/product/28132-pc-gaming-intel-core-i7-14700k-ram-64gb-rtx-4070-super-12gb-10.jpg",
    loc: "https://nguyencongpc.vn/pc-gaming-intel-core-i7-14700k-rtx-4070-super",
  },
];

const brandDict = [
  "ASUS", "MSI", "GIGABYTE", "ASROCK", "COLORFUL", "GALAX", "NZXT", "CORSAIR", "LIAN LI", "THERMALTAKE",
  "LOGITECH", "PULSAR", "RAZER", "LAMZU", "WL MOUSE", "WLMOUSE", "ATK", "FINALMOUSE", "MEGLEEK", "ZOWIE",
  "VAXEE", "RAWN", "TEEVOLUTION", "SCYROX", "MCHOUSE", "ARTISAN", "WALLHACK", "WOOTING", "FGG", "AULA",
  "EPZ", "SIMGOT", "MOONDROP", "TRUTHEAR", "THEAUDIO", "7HZ", "DELL", "ACER", "SAMSUNG", "LG", "BENQ",
  "VIEWSONIC", "AOC", "PHILIPS", "LENOVO",
];

const decodeHtml = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripTags = (value = "") => decodeHtml(String(value).replace(/<[^>]*>/g, "")).trim();

const extractBlocks = (xml) => {
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  return blocks.map((block) => {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1] || "";
    const title = block.match(/<image:title>([\s\S]*?)<\/image:title>/i)?.[1] || "";
    const image = block.match(/<image:loc>([\s\S]*?)<\/image:loc>/i)?.[1] || "";
    return {
      loc: stripTags(loc),
      title: stripTags(title),
      image: stripTags(image),
    };
  }).filter((x) => x.image && x.loc);
};

const classify = (record) => {
  const text = `${record.title} ${record.loc}`.toLowerCase();
  if (/(mousepad|pad|lot-chuot|l[oó]t chu[oộ]t)/.test(text)) return "pad";
  if (/(ban-phim|keyboard|switch|keycap)/.test(text)) return "ban-phim";
  if (/(tai-nghe|headphone|headset|iem|earbuds)/.test(text)) return "tai-nghe";
  if (/(chuot|mouse)/.test(text)) return "chuot";
  if (/(man-hinh|monitor)/.test(text)) return "man-hinh";
  if (/(pc-gaming|bo-pc|build-pc)/.test(text)) return "pc-gaming";
  if (/(cpu|bo-vi-xu-ly|mainboard|ram|ssd|hdd|vga|card|nguon|psu|case)/.test(text)) return "linh-kien";
  return null;
};

const detectBrand = (value = "") => {
  const text = value.toUpperCase();
  for (const brand of brandDict) {
    if (text.includes(brand)) return brand.replace("WLMOUSE", "WL MOUSE");
  }
  return "KAH";
};

const codePrefix = {
  "pc-gaming": "PC",
  "linh-kien": "LK",
  "man-hinh": "MH",
  "chuot": "MS",
  "ban-phim": "KB",
  "tai-nghe": "HP",
  "pad": "PD",
};

const fallbackImage = {
  "pc-gaming": staticNguyenCongPcPool[0].image,
  "linh-kien": "https://cdn.hstatic.net/products/200000722513/bo-vi-xu-ly-intel-core-i7-14700-2_f6a3fe7d3c9d4f5d88739188b0901740.jpg",
  "man-hinh": "https://cdn.hstatic.net/products/200000722513/man-hinh-msi-mag-272qp-qd-oled-x24-27-qd-oled-2k-240hz-1_4cd3167e397a483fb4d146de0d00145c.jpg",
  "chuot": "https://cdn.hstatic.net/products/200000722513/chuot-razer-khong-day-viper-v4-pro-den-1_87e1cc28460d4463bf93f4dad931cb86.jpg",
  "ban-phim": "https://cdn.shopify.com/s/files/1/0636/9044/0949/files/razer-huntsman-v3-pro-tkl-8khz-niko-edition-1223760462.jpg?v=1772004609",
  "tai-nghe": "https://cdn.shopify.com/s/files/1/0636/9044/0949/files/razer-blackshark-v3-pro-niko-edition-1223760438.jpg?v=1772003591",
  "pad": "https://cdn.shopify.com/s/files/1/0636/9044/0949/files/yuki-aim-monokuro-cloth-pad-lot-chu-t-control-d-poron-1218692346.jpg?v=1769750650",
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 Codex Seed Bot" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} at ${url}`);
  return response.text();
};

async function buildPools() {
  const records = [];

  for (const url of sourceSitemaps) {
    try {
      const xml = await fetchText(url);
      const items = extractBlocks(xml).map((item) => ({
        ...item,
        source: new URL(url).hostname.replace(/^www\./, ""),
      }));
      records.push(...items);
    } catch (_) {
      // Ignore one failing source and continue with others.
    }
  }

  records.push(...staticNguyenCongPcPool);

  const pools = {
    "pc-gaming": [],
    "linh-kien": [],
    "man-hinh": [],
    "chuot": [],
    "ban-phim": [],
    "tai-nghe": [],
    "pad": [],
  };

  for (const record of records) {
    const category = classify(record);
    if (!category) continue;
    pools[category].push(record);
  }

  for (const key of Object.keys(pools)) {
    const uniq = new Map();
    for (const item of pools[key]) {
      const k = `${item.image}|${item.title}`;
      if (!uniq.has(k)) uniq.set(k, item);
    }
    pools[key] = Array.from(uniq.values());
  }

  return pools;
}

async function run() {
  const pools = await buildPools();
  const productsResult = await query(`
    SELECT p.id, p.category_id, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY p.id ASC
  `);

  const counters = {
    "pc-gaming": 0,
    "linh-kien": 0,
    "man-hinh": 0,
    "chuot": 0,
    "ban-phim": 0,
    "tai-nghe": 0,
    "pad": 0,
  };

  await query("BEGIN");
  try {
    for (const product of productsResult.rows) {
      const category = product.category_slug;
      if (!counters.hasOwnProperty(category)) continue;
      counters[category] += 1;
      const index = counters[category] - 1;

      const poolItems = pools[category];
      const selected = poolItems.length > 0 ? poolItems[index % poolItems.length] : null;
      const imageUrl = selected?.image || fallbackImage[category];
      const baseTitle = selected?.title || `${category.toUpperCase()} Product`;
      const sourceDomain = selected?.source || "internal";

      const brand = detectBrand(`${baseTitle} ${selected?.loc || ""}`);
      const code = `${codePrefix[category]}-${String(product.id).padStart(6, "0")}`;
      const cleanTitle = baseTitle.replace(/\s+/g, " ").trim();
      const name = `${cleanTitle} - ${code}`;
      const description = `Ma san pham: ${code}. Thuong hieu: ${brand}. Anh nguon: ${sourceDomain}.`;
      const slug = `${slugify(name)}-${product.id}`;

      await query(
        `UPDATE products
         SET name = $1,
             slug = $2,
             description = $3,
             image_url = $4
         WHERE id = $5`,
        [name, slug, description, imageUrl, product.id]
      );
    }

    await query("COMMIT");
    console.log("Da dong bo ten + anh + ma san pham cho toan bo products.");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

run()
  .catch((error) => {
    console.error("Dong bo that bai:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
