require("dotenv").config();

const { query, pool } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const TARGET_TOTAL = Number.parseInt(process.argv[2] || "1990", 10);
const BASE_TOTAL = 1990;
const BATCH_SIZE = 250;

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

const targetBlueprint = [
  { key: "pc", base: 640 },
  { key: "component", base: 720 },
  { key: "monitor", base: 260 },
  { key: "mouse", base: 120 },
  { key: "pad", base: 70 },
  { key: "keyboard", base: 100 },
  { key: "headphone", base: 80 },
];

const pcBrands = [
  "ASUS",
  "MSI",
  "GIGABYTE",
  "ASROCK",
  "COLORFUL",
  "GALAX",
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
];

const caseBrands = [
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

const intelCpuModels = [
  "Core i3-12100F",
  "Core i5-12400F",
  "Core i5-13400F",
  "Core i5-14600K",
  "Core i7-13700K",
  "Core i7-14700K",
  "Core i9-14900K",
  "Core Ultra 7 265K",
];

const amdCpuModels = [
  "Ryzen 5 5500",
  "Ryzen 5 5600",
  "Ryzen 5 7600",
  "Ryzen 7 7700",
  "Ryzen 7 7800X3D",
  "Ryzen 9 7900X",
  "Ryzen 9 9900X",
  "Ryzen 9 9950X3D",
];

const intelMainboards = ["B660", "B760", "Z690", "Z790", "X299", "X670"];
const amdMainboards = ["B450", "B550", "B650", "B850"];

const ramTypes = ["DDR3", "DDR4", "DDR5"];
const ramCapacities = ["8GB", "16GB", "32GB", "64GB", "96GB"];

const storageCaps = ["128GB", "256GB", "512GB", "1TB", "2TB", "4TB"];
const psuWattages = ["350W", "450W", "550W", "650W", "750W", "850W", "1000W", "1250W"];

const nvidiaGpuModels = [
  "GTX 1650",
  "RTX 2060",
  "RTX 3060",
  "RTX 4060",
  "RTX 4070",
  "RTX 4070 SUPER",
  "RTX 4080 SUPER",
  "RTX 5070",
  "RTX 5080",
  "RTX 5090",
];

const amdGpuModels = [
  "RX 6500 XT",
  "RX 6600",
  "RX 6650 XT",
  "RX 6700 XT",
  "RX 6750 XT",
  "RX 6800",
  "RX 6800 XT",
  "RX 6900 XT",
  "RX 6950 XT",
  "RX 7600",
  "RX 7600 XT",
  "RX 7700 XT",
  "RX 7800 XT",
  "RX 7900 GRE",
  "RX 7900 XT",
  "RX 7900 XTX",
];

const cpuCoolers = ["Air Tower", "Dual Tower", "AIO 240", "AIO 360"];

const componentBrands = {
  cpu: ["Intel", "AMD"],
  mainboard: ["ASUS", "MSI", "GIGABYTE", "ASROCK", "BIOSTAR", "COLORFUL"],
  ram: ["CORSAIR", "G.SKILL", "KINGSTON", "TEAMGROUP", "ADATA", "PATRIOT"],
  ssd: ["SAMSUNG", "WD", "KINGSTON", "CRUCIAL", "TEAMGROUP", "LEXAR"],
  hdd: ["SEAGATE", "WD", "TOSHIBA", "HITACHI"],
  psu: ["CORSAIR", "SEASONIC", "DEEPCOOL", "COOLER MASTER", "ANTEC", "THERMALTAKE"],
  vga: ["ASUS", "MSI", "GIGABYTE", "ZOTAC", "SAPPHIRE", "XFX", "POWERCOLOR"],
  case: caseBrands,
};

const monitorBrands = [
  "ASUS",
  "MSI",
  "GIGABYTE",
  "LG",
  "SAMSUNG",
  "AOC",
  "VIEWSONIC",
  "BENQ",
  "DELL",
  "ACER",
  "LENOVO",
  "PHILIPS",
  "COOLER MASTER",
  "HKC",
  "XIAOMI",
  "ODYSSEY",
  "ALIENWARE",
  "INNOCN",
];

const monitorRefresh = [144, 165, 170, 180, 200, 240, 280, 300, 360, 390, 500, 540];
const monitorPanels = ["IPS", "Fast IPS", "VA", "OLED", "QD-OLED", "Mini LED"];
const monitorSizes = ['24"', '25"', '27"', '32"', '34"', '49"'];
const monitorResolutions = ["FHD", "QHD", "4K", "UWQHD"];

const mouseBrands = [
  "LOGITECH",
  "PULSAR",
  "RAZER",
  "LAMZU",
  "WL MOUSE",
  "ATK",
  "FINALMOUSE",
  "MEGLEEK",
  "ZOWIE",
  "VAXEE",
  "RAWN",
  "TEEVOLUTION",
  "SCYROX",
  "MCHOUSE",
];

const padBrands = ["ARTISAN", "ZOWIE", "VAXEE", "WALLHACK"];
const keyboardBrands = ["WOOTING", "FGG", "AULA", "MEGLEEK", "ATK", "MCHOUSE"];
const headphoneBrands = ["EPZ", "SIMGOT", "MOONDROP", "TRUTHEAR", "THEAUDIO", "7HZ", "RAZER", "LOGITECH"];

const mouseSensors = ["PAW3395", "PAW3950", "FOCUS PRO", "HERO 2", "3395 PRO"];
const mouseWeights = ["36g", "39g", "45g", "49g", "52g", "58g"];
const padTypes = ["Control", "Balanced", "Speed", "Hybrid"];
const keyboardLayouts = ["60%", "65%", "75%", "TKL", "98%", "Fullsize"];
const keyboardSwitches = ["HE", "Magnetic", "Linear", "Tactile", "Speed"];
const headphoneDrivers = ["10mm", "12mm", "14.2mm", "50mm"];
const headphoneTypes = ["IEM", "Over-ear", "Wireless", "Gaming"];

const imageByType = {
  pc: "/uploads/250-27462-b----pc-gaming-ryzen-7-9800x3d-ram-32g-vga-rtx-5080.jpg",
  cpu: "/uploads/CPU-AMD-Ryzen-7-9800X3D-3.jpg",
  mainboard: "/uploads/250-27587-27587-27244-khung-pc.jpg",
  ram: "/uploads/250-28132-pc-gaming-intel-core-i7-14700k-ram-64gb-rtx-4070-super-12gb-10.jpg",
  ssd: "/uploads/250-28409-bo-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5060-8gb.jpg",
  hdd: "/uploads/250-27845-pc-gaming-25251349.jpg",
  psu: "/uploads/250-28601-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb-01.jpg",
  vga: "/uploads/250-28290-bo-pc-intel-core-i7-14700k-ram-32gb-ddr5-vga-rtx-5070-ti-16gb-18.jpg",
  case: "/uploads/250-27587-27587-27244-khung-pc.jpg",
  monitor: "/uploads/asus_vg27aq5a_gearvn_8a48559a1dad420e9e07e804da103d4a_master.jpg",
  mouse: "/uploads/chu-t-khong-day-sieu-nh-logitech-g-pro-x-superlight-2c-wireless-1194149405.webp",
  pad: "/uploads/download-5-a5e4dd2f-f077-448c-9eca-ecbf1cfb6dc1.webp",
  keyboard: "/uploads/d-t-tr-c-ban-phim-he-melgeek-made84-pro-8k-h-tr-rapid-trigger-1167857152.webp",
  headphone: "/uploads/5193_tai_nghe_truethear_hexa_xuan_vu_min.jpg",
};

const pick = (arr, index) => arr[index % arr.length];
const padStart = (value, size = 5) => String(value).padStart(size, "0");

const buildDistribution = (targetTotal) => {
  const safeTarget = Number.isFinite(targetTotal) && targetTotal > 0 ? targetTotal : BASE_TOTAL;
  const scaled = targetBlueprint.map((item) => ({
    key: item.key,
    count: Math.floor((item.base * safeTarget) / BASE_TOTAL),
  }));

  let current = scaled.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  while (current < safeTarget) {
    scaled[cursor % scaled.length].count += 1;
    current += 1;
    cursor += 1;
  }

  return Object.fromEntries(scaled.map((item) => [item.key, item.count]));
};

const createProductRecord = ({
  categoryId,
  codePrefix,
  index,
  name,
  description,
  price,
  stockQty,
  imageUrl,
  status = "active",
}) => {
  const code = `${codePrefix}-${padStart(index + 1, 6)}`;
  return {
    categoryId,
    name: `${name} ${code}`,
    slug: slugify(`${name}-${code}`),
    description,
    price,
    stockQty,
    imageUrl,
    status,
  };
};

const stockByIndex = (index) => 8 + (index % 64);

const createPcProducts = (categoryId, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const brand = pick(pcBrands, i);
    const cpuVendor = i % 2 === 0 ? "Intel" : "AMD";
    const cpuModel = cpuVendor === "Intel" ? pick(intelCpuModels, i + 1) : pick(amdCpuModels, i + 3);
    const mainboard = cpuVendor === "Intel" ? pick(intelMainboards, i + 5) : pick(amdMainboards, i + 7);
    const ramType = pick(ramTypes, i + 11);
    const ramCapacity = pick(ramCapacities, i + 13);
    const ssd = pick(storageCaps, i + 17);
    const hdd = pick(storageCaps, i + 19);
    const psu = pick(psuWattages, i + 23);
    const gpu = i % 3 === 0 ? pick(amdGpuModels, i) : pick(nvidiaGpuModels, i);
    const caseBrand = pick(caseBrands, i + 31);
    const cooler = pick(cpuCoolers, i + 37);

    const name = `${brand} PC Gaming ${cpuModel} ${gpu}`;
    const description =
      `Build PC du linh kien cac hang. Chip ${cpuVendor} ${cpuModel}, Mainboard ${mainboard}, ` +
      `RAM ${ramType} ${ramCapacity}, SSD ${ssd}, HDD ${hdd}, PSU ${psu}, VGA ${gpu}, ` +
      `Case ${caseBrand}, Tan nhiet ${cooler}.`;

    const price = 15990000 + (i % 120) * 350000;

    items.push(
      createProductRecord({
        categoryId,
        codePrefix: "PC",
        index: i,
        name,
        description,
        price,
        stockQty: stockByIndex(i),
        imageUrl: imageByType.pc,
      })
    );
  }
  return items;
};

const createComponentProducts = (categoryId, count) => {
  const items = [];
  const partTypes = ["cpu", "mainboard", "ram", "ssd", "hdd", "psu", "vga", "case"];
  const each = Math.floor(count / partTypes.length);
  const remain = count - each * partTypes.length;
  const counts = partTypes.map((part, idx) => ({ part, count: each + (idx < remain ? 1 : 0) }));

  let globalIndex = 0;
  for (const partEntry of counts) {
    for (let i = 0; i < partEntry.count; i += 1) {
      const idx = globalIndex;
      const part = partEntry.part;

      if (part === "cpu") {
        const vendor = i % 2 === 0 ? "Intel" : "AMD";
        const model = vendor === "Intel" ? pick(intelCpuModels, i + 1) : pick(amdCpuModels, i + 3);
        const name = `${vendor} CPU ${model}`;
        const description = `Chip ${vendor} ${model}, danh cho gaming va workstation.`;
        const price = 2390000 + (i % 40) * 190000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "CPU",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.cpu,
          })
        );
      } else if (part === "mainboard") {
        const isIntel = i % 2 === 0;
        const chipset = isIntel ? pick(intelMainboards, i + 1) : pick(amdMainboards, i + 3);
        const brand = pick(componentBrands.mainboard, i + 5);
        const name = `${brand} Mainboard ${chipset}`;
        const description = `Mainboard chipset ${chipset} (${isIntel ? "Intel X/Z/B" : "AMD B"}), ho tro build hien dai.`;
        const price = 1790000 + (i % 50) * 160000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "MB",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.mainboard,
          })
        );
      } else if (part === "ram") {
        const brand = pick(componentBrands.ram, i + 2);
        const type = pick(ramTypes, i + 3);
        const cap = pick(ramCapacities, i + 5);
        const speed = pick(["3200", "3600", "5200", "6000", "6400"], i + 7);
        const name = `${brand} RAM ${type} ${cap} ${speed}MHz`;
        const description = `RAM ${type} dung luong ${cap}, toc do ${speed}MHz.`;
        const price = 590000 + (i % 55) * 120000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "RAM",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.ram,
          })
        );
      } else if (part === "ssd") {
        const brand = pick(componentBrands.ssd, i + 2);
        const cap = pick(storageCaps, i + 4);
        const protocol = pick(["SATA", "NVMe Gen3", "NVMe Gen4", "NVMe Gen5"], i + 6);
        const name = `${brand} SSD ${cap} ${protocol}`;
        const description = `SSD dung luong ${cap} (128GB den 4TB), giao tiep ${protocol}.`;
        const price = 490000 + (i % 60) * 145000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "SSD",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.ssd,
          })
        );
      } else if (part === "hdd") {
        const brand = pick(componentBrands.hdd, i + 1);
        const cap = pick(storageCaps, i + 5);
        const rpm = pick(["5400RPM", "7200RPM"], i + 8);
        const name = `${brand} HDD ${cap} ${rpm}`;
        const description = `HDD dung luong ${cap} (128GB den 4TB), toc do ${rpm}.`;
        const price = 450000 + (i % 55) * 110000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "HDD",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.hdd,
          })
        );
      } else if (part === "psu") {
        const brand = pick(componentBrands.psu, i + 3);
        const watt = pick(psuWattages, i + 7);
        const cert = pick(["80+ Bronze", "80+ Gold", "80+ Platinum"], i + 11);
        const name = `${brand} PSU ${watt} ${cert}`;
        const description = `Nguon cong suat ${watt} (350W den 1250W), chuan ${cert}.`;
        const price = 790000 + (i % 60) * 130000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "PSU",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.psu,
          })
        );
      } else if (part === "vga") {
        const brand = pick(componentBrands.vga, i + 1);
        const gpu = i % 2 === 0 ? pick(nvidiaGpuModels, Math.floor(i / 2)) : pick(amdGpuModels, Math.floor(i / 2));
        const name = `${brand} VGA ${gpu}`;
        const description = `Card man hinh tu GTX 1650 den RTX 5090, kem day du dong AMD.`;
        const price = 3890000 + (i % 65) * 260000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "VGA",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.vga,
          })
        );
      } else {
        const brand = pick(componentBrands.case, i + 2);
        const form = pick(["mATX", "ATX", "E-ATX", "Full Tower"], i + 5);
        const color = pick(["Black", "White"], i + 7);
        const name = `${brand} Case ${form} ${color}`;
        const description = `Case PC day du hang, ho tro ${form}, mau ${color}.`;
        const price = 890000 + (i % 45) * 140000;
        items.push(
          createProductRecord({
            categoryId,
            codePrefix: "CASE",
            index: idx,
            name,
            description,
            price,
            stockQty: stockByIndex(i),
            imageUrl: imageByType.case,
          })
        );
      }

      globalIndex += 1;
    }
  }

  return items;
};

const createMonitorProducts = (categoryId, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const brand = pick(monitorBrands, i);
    const hz = pick(monitorRefresh, i + 3);
    const panel = pick(monitorPanels, i + 5);
    const size = pick(monitorSizes, i + 7);
    const resolution = pick(monitorResolutions, i + 9);
    const name = `${brand} Monitor ${size} ${resolution} ${hz}Hz ${panel}`;
    const description = `Man hinh ${brand} day du dong 144Hz den 540Hz, tam nen ${panel}, do phan giai ${resolution}.`;
    const price = 3290000 + (i % 95) * 170000;

    items.push(
      createProductRecord({
        categoryId,
        codePrefix: "MON",
        index: i,
        name,
        description,
        price,
        stockQty: stockByIndex(i),
        imageUrl: imageByType.monitor,
      })
    );
  }
  return items;
};

const createMouseProducts = (categoryId, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const brand = pick(mouseBrands, i);
    const sensor = pick(mouseSensors, i + 3);
    const weight = pick(mouseWeights, i + 5);
    const connectivity = pick(["Wireless 2.4G", "Wired", "Dual Mode"], i + 7);
    const name = `${brand} Gaming Mouse ${sensor} ${weight}`;
    const description = `Chuot ${brand}, sensor ${sensor}, trong luong ${weight}, ket noi ${connectivity}.`;
    const price = 590000 + (i % 70) * 90000;

    items.push(
      createProductRecord({
        categoryId,
        codePrefix: "MOUSE",
        index: i,
        name,
        description,
        price,
        stockQty: stockByIndex(i),
        imageUrl: imageByType.mouse,
      })
    );
  }
  return items;
};

const createPadProducts = (categoryId, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const brand = pick(padBrands, i);
    const type = pick(padTypes, i + 2);
    const size = pick(["M", "L", "XL", "XXL", "Deskmat"], i + 4);
    const name = `${brand} Mousepad ${type} ${size}`;
    const description = `Pad ${brand} be mat ${type}, kich thuoc ${size}.`;
    const price = 290000 + (i % 45) * 55000;

    items.push(
      createProductRecord({
        categoryId,
        codePrefix: "PAD",
        index: i,
        name,
        description,
        price,
        stockQty: stockByIndex(i),
        imageUrl: imageByType.pad,
      })
    );
  }
  return items;
};

const createKeyboardProducts = (categoryId, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const brand = pick(keyboardBrands, i);
    const layout = pick(keyboardLayouts, i + 2);
    const switchType = pick(keyboardSwitches, i + 5);
    const name = `${brand} Gaming Keyboard ${layout} ${switchType}`;
    const description = `Ban phim ${brand}, layout ${layout}, switch ${switchType}, phu hop gaming.`;
    const price = 1090000 + (i % 80) * 115000;

    items.push(
      createProductRecord({
        categoryId,
        codePrefix: "KB",
        index: i,
        name,
        description,
        price,
        stockQty: stockByIndex(i),
        imageUrl: imageByType.keyboard,
      })
    );
  }
  return items;
};

const createHeadphoneProducts = (categoryId, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const brand = pick(headphoneBrands, i);
    const type = pick(headphoneTypes, i + 2);
    const driver = pick(headphoneDrivers, i + 4);
    const name = `${brand} ${type} ${driver}`;
    const description = `Tai nghe ${brand} dong ${type}, driver ${driver}, phuc vu game va nghe nhac.`;
    const price = 790000 + (i % 80) * 125000;

    items.push(
      createProductRecord({
        categoryId,
        codePrefix: "AUDIO",
        index: i,
        name,
        description,
        price,
        stockQty: stockByIndex(i),
        imageUrl: imageByType.headphone,
      })
    );
  }
  return items;
};

const insertProductsInChunks = async (products) => {
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = batch.map((product, idx) => {
      const base = idx * 8;
      values.push(
        product.categoryId,
        product.name,
        product.slug,
        product.description,
        product.price,
        product.stockQty,
        product.imageUrl,
        product.status
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
    });

    await query(
      `INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)
       VALUES ${placeholders.join(",")}`,
      values
    );
  }
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

  const result = await query("SELECT id, slug FROM categories WHERE slug = ANY($1::text[])", [categorySeeds.map((x) => x.slug)]);
  return new Map(result.rows.map((row) => [row.slug, row.id]));
};

async function seed() {
  const total = Number.isFinite(TARGET_TOTAL) && TARGET_TOTAL > 0 ? TARGET_TOTAL : BASE_TOTAL;
  const distribution = buildDistribution(total);

  await query("BEGIN");
  try {
    const categoryMap = await ensureCategories();

    await query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    const products = [
      ...createPcProducts(categoryMap.get("pc-gaming"), distribution.pc),
      ...createComponentProducts(categoryMap.get("linh-kien"), distribution.component),
      ...createMonitorProducts(categoryMap.get("man-hinh"), distribution.monitor),
      ...createMouseProducts(categoryMap.get("chuot"), distribution.mouse),
      ...createPadProducts(categoryMap.get("pad"), distribution.pad),
      ...createKeyboardProducts(categoryMap.get("ban-phim"), distribution.keyboard),
      ...createHeadphoneProducts(categoryMap.get("tai-nghe"), distribution.headphone),
    ];

    if (products.length !== total) {
      throw new Error(`Tong san pham tao ra khong dung. Expected ${total}, got ${products.length}.`);
    }

    await insertProductsInChunks(products);

    const verify = await query("SELECT COUNT(*)::int AS total FROM products");
    const byCategory = await query(
      `SELECT c.slug, COUNT(*)::int AS total
       FROM products p
       JOIN categories c ON c.id = p.category_id
       GROUP BY c.slug
       ORDER BY c.slug`
    );

    await query("COMMIT");
    console.log(`Seed thanh cong. Tong san pham hien tai: ${verify.rows[0].total}`);
    byCategory.rows.forEach((row) => {
      console.log(` - ${row.slug}: ${row.total}`);
    });
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error("Seed that bai:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
