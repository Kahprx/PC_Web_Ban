const { query } = require("../utils/db");
const { slugify } = require("../utils/slugify");

const PART_TARGETS = {
  cpu: 30,
  mainboard: 30,
  ram: 30,
  vga: 30,
  ssd: 24,
  hdd: 24,
  psu: 24,
  case: 24,
  cooler: 18,
  fan: 18,
};

const PART_CODE_PREFIX = {
  cpu: "CPU",
  mainboard: "MB",
  ram: "RAM",
  vga: "VGA",
  ssd: "SSD",
  hdd: "HDD",
  psu: "PSU",
  case: "CASE",
  cooler: "AIO",
  fan: "FAN",
};

const PART_IMAGE_URL = {
  cpu: "/uploads/CPU-AMD-Ryzen-7-9800X3D-3.jpg",
  mainboard: "/uploads/250-27587-27587-27244-khung-pc.jpg",
  ram: "/uploads/250-28132-pc-gaming-intel-core-i7-14700k-ram-64gb-rtx-4070-super-12gb-10.jpg",
  vga: "/uploads/250-28290-bo-pc-intel-core-i7-14700k-ram-32gb-ddr5-vga-rtx-5070-ti-16gb-18.jpg",
  ssd: "/uploads/250-28409-bo-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5060-8gb.jpg",
  hdd: "/uploads/250-27845-pc-gaming-25251349.jpg",
  psu: "/uploads/250-28601-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb-01.jpg",
  case: "/uploads/250-27587-27587-27244-khung-pc.jpg",
  cooler: "/uploads/250-28601-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb-01.jpg",
  fan: "/uploads/250-27587-27587-27244-khung-pc.jpg",
};

const cpuIntelModels = [
  "Intel Core i5-12400F",
  "Intel Core i5-13400F",
  "Intel Core i5-14600KF",
  "Intel Core i7-13700K",
  "Intel Core i7-14700K",
  "Intel Core i9-14900K",
];

const cpuAmdModels = [
  "AMD Ryzen 5 5600",
  "AMD Ryzen 5 7600",
  "AMD Ryzen 7 7700",
  "AMD Ryzen 7 7800X3D",
  "AMD Ryzen 9 7900X",
  "AMD Ryzen 9 9950X3D",
];

const mainboardModels = [
  "ASUS PRIME B760M-A DDR5",
  "ASUS TUF GAMING B760M-PLUS",
  "MSI B760M GAMING PLUS WIFI DDR4",
  "MSI PRO B650M-P",
  "GIGABYTE B760M H DDR4",
  "GIGABYTE B650 AORUS ELITE AX",
  "ASROCK B760M PRO RS",
  "ASROCK B650M PRO RS WIFI",
  "COLORFUL B760M FROZEN WIFI",
  "BIOSTAR B760MX2-E",
];

const ramBusList = [2666, 3000, 3200, 3600, 4800, 5200, 5600, 6000, 6400, 7200];
const ramCapList = ["8GB", "16GB", "32GB", "64GB"];

const vgaModels = [
  { model: "GTX 1650", vram: "4GB", generation: "GTX 16 series" },
  { model: "RTX 2060", vram: "6GB", generation: "RTX 20 series" },
  { model: "RTX 3060", vram: "12GB", generation: "RTX 30 series" },
  { model: "RTX 4060", vram: "8GB", generation: "RTX 40 series" },
  { model: "RTX 4060 Ti", vram: "16GB", generation: "RTX 40 series" },
  { model: "RTX 4070 SUPER", vram: "12GB", generation: "RTX 40 series" },
  { model: "RTX 4080 SUPER", vram: "16GB", generation: "RTX 40 series" },
  { model: "RTX 5070", vram: "12GB", generation: "RTX 50 series" },
  { model: "RTX 5080", vram: "16GB", generation: "RTX 50 series" },
  { model: "RTX 5090", vram: "32GB", generation: "RTX 50 series" },
];

const storageList = ["128GB", "256GB", "512GB", "1TB", "2TB", "4TB"];
const psuList = [650, 750, 850, 1000, 1200, 1300, 1500, 1600, 2000];
const coolerList = ["Tản nhiệt AIO 240", "Tản nhiệt AIO 360", "Tản nhiệt AIO 420", "Tản khí dual tower"];
const fanList = ["Fan case 120mm ARGB", "Fan case 140mm ARGB", "Fan case Reverse 120mm", "Fan radiator PWM 120mm"];
const caseList = ["Case PC ATX Mid Tower", "Case PC mATX", "Case PC E-ATX Full Tower", "Case PC kính cường lực"];
const brands = ["ASUS", "MSI", "GIGABYTE", "ASROCK", "COLORFUL", "CORSAIR", "DEEPCOOL", "NZXT", "COOLER MASTER"];

const pick = (arr, index) => arr[index % arr.length];
const normalize = (value = "") => String(value || "").trim().replace(/\s+/g, " ");
const COMPONENT_BLOCK_SQL = `
  (
    LOWER(COALESCE(p.name, '')) LIKE '%pc gaming%'
    OR LOWER(COALESCE(p.name, '')) LIKE '%bo pc%'
    OR LOWER(COALESCE(p.name, '')) LIKE '%build pc%'
    OR LOWER(COALESCE(p.name, '')) LIKE '%laptop%'
    OR LOWER(COALESCE(p.name, '')) LIKE '%macbook%'
    OR LOWER(COALESCE(p.description, '')) LIKE '%pc gaming%'
    OR LOWER(COALESCE(p.description, '')) LIKE '%bo pc%'
    OR LOWER(COALESCE(p.description, '')) LIKE '%build pc%'
    OR LOWER(COALESCE(p.description, '')) LIKE '%laptop%'
    OR LOWER(COALESCE(p.description, '')) LIKE '%macbook%'
  )
`;

const resolvePartPredicateSql = (part) => {
  if (part === "cpu") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: cpu%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%cpu%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%intel core%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%ryzen%'
    `;
  }
  if (part === "mainboard") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: mainboard%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%mainboard%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%motherboard%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%bo mach chu%'
    `;
  }
  if (part === "ram") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: ram%'
      OR LOWER(COALESCE(p.name, '')) LIKE '% ram %'
      OR LOWER(COALESCE(p.name, '')) LIKE '%ddr4%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%ddr5%'
    `;
  }
  if (part === "vga") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: gpu%'
      OR LOWER(COALESCE(p.description, '')) LIKE '%part: vga%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%vga%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%rtx%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%gtx%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%rx %'
    `;
  }
  if (part === "ssd") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: ssd%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%ssd%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%nvme%'
    `;
  }
  if (part === "hdd") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: hdd%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%hdd%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%hard drive%'
    `;
  }
  if (part === "psu") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: psu%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%psu%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%nguon%'
    `;
  }
  if (part === "case") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: case%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%case pc%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%case%'
    `;
  }
  if (part === "cooler") {
    return `
      LOWER(COALESCE(p.description, '')) LIKE '%part: cooler%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%tan nhiet%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%aio%'
      OR LOWER(COALESCE(p.name, '')) LIKE '%heatsink%'
    `;
  }
  return `
    LOWER(COALESCE(p.description, '')) LIKE '%part: fan%'
    OR LOWER(COALESCE(p.name, '')) LIKE '%fan%'
  `;
};

const generateProductByPart = (part, index) => {
  const brand = pick(brands, index);

  if (part === "cpu") {
    const model = index % 2 === 0 ? pick(cpuIntelModels, index) : pick(cpuAmdModels, index);
    const socket = model.includes("Ryzen") ? "AM5" : "LGA1700";
    return {
      name: `${model} Box Chính hãng`,
      description: `PART: cpu | BRAND: ${brand} | SOCKET: ${socket} | CPU hiệu năng cao cho build PC gaming và đồ họa.`,
      price: 2_590_000 + (index % 12) * 420_000,
    };
  }

  if (part === "mainboard") {
    const model = pick(mainboardModels, index);
    return {
      name: `Mainboard ${model}`,
      description: `PART: mainboard | BRAND: ${brand} | MAINBOARD: ${model} | Hỗ trợ build PC desktop.`,
      price: 1_790_000 + (index % 12) * 260_000,
    };
  }

  if (part === "ram") {
    const cap = pick(ramCapList, index);
    const bus = pick(ramBusList, index);
    const ddr = bus >= 4800 ? "DDR5" : "DDR4";
    return {
      name: `RAM ${brand} ${ddr} ${cap} ${bus}MHz`,
      description: `PART: ram | BRAND: ${brand} | RAM: ${ddr} ${cap} ${bus}MHz | Bus RAM ${bus}MHz.`,
      price: 690_000 + (index % 12) * 190_000,
    };
  }

  if (part === "vga") {
    const gpu = pick(vgaModels, index);
    return {
      name: `Card màn hình ${brand} ${gpu.model} ${gpu.vram}`,
      description: `PART: gpu | BRAND: ${brand} | VGA: ${gpu.model} | VRAM: ${gpu.vram} | GEN: ${gpu.generation}.`,
      price: 3_590_000 + (index % 15) * 690_000,
    };
  }

  if (part === "ssd") {
    const capacity = pick(storageList, index);
    const line = index % 2 === 0 ? "NVMe Gen4" : "NVMe Gen3";
    return {
      name: `SSD ${brand} ${capacity} ${line}`,
      description: `PART: ssd | BRAND: ${brand} | SSD ${capacity} | Giao tiếp ${line}.`,
      price: 550_000 + (index % 12) * 230_000,
    };
  }

  if (part === "hdd") {
    const capacity = pick(storageList, index);
    const rpm = index % 2 === 0 ? "7200RPM" : "5400RPM";
    return {
      name: `HDD ${brand} ${capacity} ${rpm}`,
      description: `PART: hdd | BRAND: ${brand} | HDD ${capacity} | Tốc độ ${rpm}.`,
      price: 490_000 + (index % 12) * 170_000,
    };
  }

  if (part === "psu") {
    const watt = pick(psuList, index);
    const cert = watt >= 1000 ? "80+ Platinum" : "80+ Gold";
    return {
      name: `Nguồn ${brand} ${watt}W ${cert}`,
      description: `PART: psu | BRAND: ${brand} | PSU ${watt}W | Chuẩn ${cert}.`,
      price: 1_190_000 + (index % 12) * 320_000,
    };
  }

  if (part === "case") {
    const model = pick(caseList, index);
    return {
      name: `${model} ${brand}`,
      description: `PART: case | BRAND: ${brand} | CASE PC form ATX/mATX, hỗ trợ card dài và tản AIO.`,
      price: 890_000 + (index % 12) * 210_000,
    };
  }

  if (part === "cooler") {
    const model = pick(coolerList, index);
    return {
      name: `${model} ${brand}`,
      description: `PART: cooler | BRAND: ${brand} | Tản nhiệt CPU ${model}.`,
      price: 790_000 + (index % 12) * 180_000,
    };
  }

  const model = pick(fanList, index);
  return {
    name: `${model} ${brand}`,
    description: `PART: fan | BRAND: ${brand} | FAN case hiệu suất cao, tối ưu airflow.`,
    price: 150_000 + (index % 12) * 35_000,
  };
};

const ensureCategory = async (slug, name) => {
  await query(
    `
      INSERT INTO categories (name, slug)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `,
    [name, slug]
  );

  const rs = await query("SELECT id FROM categories WHERE slug = $1 LIMIT 1", [slug]);
  return Number(rs.rows[0]?.id || 0);
};

const getPartCount = async (categoryId, part) => {
  const predicate = resolvePartPredicateSql(part);
  const rs = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM products p
      WHERE p.category_id = $1
        AND NOT ${COMPONENT_BLOCK_SQL}
        AND (${predicate})
    `,
    [categoryId]
  );
  return Number(rs.rows[0]?.total || 0);
};

const createProductCode = (part, sequence) => {
  const prefix = PART_CODE_PREFIX[part] || "LK";
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
};

const getCurrentCodeSequence = async () => {
  const rs = await query(
    `
      SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(product_code, '[^0-9]', '', 'g'), '')::bigint), 0)::bigint AS max_seq
      FROM products
      WHERE product_code IS NOT NULL
    `
  );
  return Number(rs.rows[0]?.max_seq || 0);
};

const ensureCatalogCoverage = async () => {
  const enabled = String(process.env.ENABLE_AUTO_CATALOG_FILL || "false").toLowerCase() === "true";
  if (!enabled) {
    return { inserted: 0, detail: {}, skipped: true };
  }
  const categoryId = await ensureCategory("linh-kien", "Linh kiện");
  if (!categoryId) {
    return { inserted: 0, detail: {} };
  }

  let codeSeq = await getCurrentCodeSequence();
  const detail = {};
  let insertedTotal = 0;

  for (const [part, target] of Object.entries(PART_TARGETS)) {
    const current = await getPartCount(categoryId, part);
    const missing = Math.max(0, target - current);
    detail[part] = { current, target, inserted: 0 };

    for (let i = 0; i < missing; i += 1) {
      codeSeq += 1;
      const item = generateProductByPart(part, current + i);
      const safeName = normalize(item.name);
      const productCode = createProductCode(part, codeSeq);
      const slug = slugify(`${safeName}-${productCode}`) || `linh-kien-${productCode.toLowerCase()}`;
      const imageUrl = PART_IMAGE_URL[part] || PART_IMAGE_URL.case;

      await query(
        `
          INSERT INTO products (
            category_id,
            product_code,
            name,
            slug,
            description,
            price,
            stock_qty,
            image_url,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
          ON CONFLICT (slug) DO NOTHING
        `,
        [
          categoryId,
          productCode,
          safeName,
          slug,
          normalize(item.description),
          Number(item.price || 0),
          25 + ((current + i) % 40),
          imageUrl,
        ]
      );

      detail[part].inserted += 1;
      insertedTotal += 1;
    }
  }

  return {
    inserted: insertedTotal,
    detail,
  };
};

module.exports = {
  ensureCatalogCoverage,
};
