import {
  gearMasterCatalog,
  monitorMasterCatalog,
  pcMasterCatalog,
} from "./masterCatalogData";
import { formatVnd } from "../utils/currency";
const toEntryList = (modules) =>
  Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, module]) => ({
      path,
      src: module?.default ?? "",
    }))
    .filter((entry) => Boolean(entry.src));

const toImageList = (entries) => entries.map((entry) => entry.src);

const createTitleFromPath = (path, fallback) => {
  if (!path) return fallback;

  const fileName = path.split(/[\\/]/).pop() || "";
  const normalized = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/\(\d+\)/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 ? normalized.toUpperCase() : fallback;
};

const at = (list, index, fallback = "") => {
  if (list.length === 0) return fallback;
  const safe = ((index % list.length) + list.length) % list.length;
  return list[safe];
};

const pickImageByFragment = (entries, fragment, fallback = "") => {
  const normalizedFragment = String(fragment || "").toLowerCase();
  const match = entries.find((entry) =>
    entry.path.toLowerCase().includes(normalizedFragment)
  );
  return match?.src || fallback;
};

const pickImageByFragments = (entries, fragments, fallback = "") => {
  for (const fragment of fragments || []) {
    const found = pickImageByFragment(entries, fragment, "");
    if (found) return found;
  }
  return fallback;
};

const pcImageModules = import.meta.glob(
  "../assets/images/PC/PC/*.{png,jpg,jpeg,webp}",
  { eager: true }
);
const bannerImageModules = import.meta.glob(
  "../assets/images/PC/BANNER/*.{png,jpg,jpeg,webp}",
  { eager: true }
);
const homeImageModules = import.meta.glob(
  "../assets/images/PC/Home/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);
const homeFlashSaleImageModules = import.meta.glob(
  "../assets/images/PC/Home/flash sale/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);
const detailImageModules = import.meta.glob(
  "../assets/images/PC/pc chi tIET SAN PHAM/*.{png,jpg,jpeg,webp}",
  { eager: true }
);
const mouseImageModules = import.meta.glob(
  "../assets/images/PC/MOUSE/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);
const keyboardImageModules = import.meta.glob(
  "../assets/images/PC/PHIM HE/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);
const monitorImageModules = {
  ...import.meta.glob("../assets/images/PC/MOTION/*.{png,jpg,jpeg,webp,avif}", {
    eager: true,
  }),
  ...import.meta.glob("../assets/images/PC/Home/MOTION/*.{png,jpg,jpeg,webp,avif}", {
    eager: true,
  }),
};
const iemImageModules = import.meta.glob(
  "../assets/images/PC/IEM/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);
const cpuImageModules = import.meta.glob(
  "../assets/images/PC/CPU/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);
const iconImageModules = import.meta.glob(
  "../assets/images/PC/ICON/*.{png,jpg,jpeg,webp,avif}",
  { eager: true }
);

const pcEntries = toEntryList(pcImageModules);
const bannerEntries = toEntryList(bannerImageModules);
const homeEntries = toEntryList(homeImageModules);
const homeFlashSaleEntries = toEntryList(homeFlashSaleImageModules);
const detailEntries = toEntryList(detailImageModules);
const mouseEntries = toEntryList(mouseImageModules);
const keyboardEntries = toEntryList(keyboardImageModules);
const monitorEntries = toEntryList(monitorImageModules);
const iemEntries = toEntryList(iemImageModules);
const cpuEntries = toEntryList(cpuImageModules);
const iconEntries = toEntryList(iconImageModules);

export const pcImages = toImageList(pcEntries);
export const bannerImages = toImageList(bannerEntries);
export const homeImages = toImageList(homeEntries);
export const homeFlashSaleImages = toImageList(homeFlashSaleEntries);
export const detailImages = toImageList(detailEntries);
export const accessoryImages = toImageList(mouseEntries);
export const iconImages = toImageList(iconEntries);
export const keyboardImages = toImageList(keyboardEntries);
export const monitorImages = toImageList(monitorEntries);
export const iemImages = toImageList(iemEntries);
export const cpuImages = toImageList(cpuEntries);

const productSlugs = ["pc-gaming", "pc-work", "pc-do-hoa", "pc-stream"];
const productTypes = ["PC GAMING", "PC VAN PHONG", "PC DO HOA", "PC STREAM"];
const brandPool = ["AMD", "INTEL"];
const cpuPool = pcMasterCatalog.cpu.map((item) => `${item.brand} ${item.model}`);
const mainboardPool = pcMasterCatalog.mainboard.map(
  (item) => `${item.brand} ${item.model} (${item.chipset})`
);
const ramPool = pcMasterCatalog.ram.map((item) => item.model);
const vgaPool = pcMasterCatalog.gpu.map((item) => `${item.brand} ${item.model}`);
const ssdPool = pcMasterCatalog.ssd.map((item) => `${item.brand} ${item.model}`);
const hddPool = pcMasterCatalog.hdd.map((item) => `${item.brand} ${item.model}`);
const psuPool = pcMasterCatalog.psu.map((item) => `${item.model} ${item.watt}W`);
const casePool = pcMasterCatalog.casePc.map((item) => `${item.brand} ${item.model}`);
const coolerPool = [
  "TAN NHIET KHI T400I",
  "AIO 240MM ARGB",
  "AIO 360MM ARGB",
  "TAN NHIET KHI DUAL FAN",
];
const fanPool = ["FAN RGB 3-PACK", "FAN ARGB 6-PACK", "FAN PWM 4-PACK"];

const fallbackImage = pcImages[0] || bannerImages[0] || "";

const safePcEntries =
  pcEntries.length > 0
    ? pcEntries
    : [{ path: "PC PLACEHOLDER", src: fallbackImage }];

export const products = safePcEntries.slice(0, 24).map((entry, index) => {
  const cpu = at(cpuPool, index, "AMD RYZEN 5 7600");
  const mainboard = at(mainboardPool, index, "B650M WIFI DDR5");
  const ram = at(ramPool, index, "16GB DDR5 6000");
  const vga = at(vgaPool, index, "RTX 4060 8GB");
  const ssd = at(ssdPool, index, "SSD NVME 1TB");
  const hdd = at(hddPool, index, "HDD 1TB");
  const psu = at(psuPool, index, "750W 80 PLUS BRONZE");
  const caseName = at(casePool, index, "MID TOWER RGB");
  const cooler = at(coolerPool, index, "AIO 240MM ARGB");
  const fan = at(fanPool, index, "FAN RGB 3-PACK");
  const basePrice = 17_990_000 + index * 1_490_000;

  const rotatedDetail = detailImages.length
    ? [
        ...detailImages.slice(index % detailImages.length),
        ...detailImages.slice(0, index % detailImages.length),
      ]
    : [];

  return {
    id: index,
    slug: at(productSlugs, index, "pc-gaming"),
    type: at(productTypes, index, "PC GAMING"),
    brand: at(brandPool, index, "AMD"),
    name: createTitleFromPath(entry.path, `PC GAMING ${index + 1}`),
    image: entry.src || fallbackImage,
    gallery: [entry.src || fallbackImage, ...rotatedDetail].slice(0, 8),
    price: basePrice,
    oldPrice: basePrice + 2_900_000,
    specs: {
      cpu,
      mainboard,
      ram,
      vga,
      ssd,
      hdd,
      psu,
      case: caseName,
      cooler,
      fan,
    },
  };
});

export const categoryTiles = [
  {
    slug: "pc-gaming",
    label: "PC GAMING",
    description: "Build toi uu FPS cho game thu",
    icon: at(iconImages, 8, fallbackImage),
  },
  {
    slug: "pc-do-hoa",
    label: "PC DO HOA",
    description: "Tap trung render va thiet ke",
    icon: at(iconImages, 67, fallbackImage),
  },
  {
    slug: "pc-stream",
    label: "PC STREAM",
    description: "Da nhiem game + stream + edit",
    icon: at(iconImages, 60, fallbackImage),
  },
  {
    slug: "pc-work",
    label: "PC VAN PHONG",
    description: "On dinh cho hoc tap va lam viec",
    icon: at(iconImages, 24, fallbackImage),
  },
];

export const homeHeroBanners = {
  main: pickImageByFragment(
    homeEntries,
    "60dfb5d8-631e-4c9b-9f44-8bc18ee43341",
    at(products, 0)?.image || fallbackImage
  ),
  rightTop: pickImageByFragment(
    homeEntries,
    "ed7089c9-dfc8-4663-a911-7c9119beaee9",
    at(products, 1)?.image || fallbackImage
  ),
  rightBottom: pickImageByFragment(
    homeEntries,
    "37497ee2-839e-4503-b985-b165911e963f",
    at(products, 2)?.image || fallbackImage
  ),
};

export const homeCategoryPills = [
  "PC",
  "LAPTOP",
  "MAN HINH",
  "BAN PHIM",
  "CHUOT",
  "TAI NGHE",
  "LOA",
];

export const homeFeaturedCards = [
  {
    id: "feature-0",
    type: "PC GAMING",
    title: "B? PC AMD RYZEN 7",
    price: 23_800_000,
    image: pickImageByFragments(homeFlashSaleEntries, ["pc_1", "bo-pc-gaming", "ryzen-7"], at(products, 0)?.image || fallbackImage),
    href: "/category/pc-gaming",
  },
  {
    id: "feature-1",
    type: "AM THANH",
    title: "IEM SIMGOT EA2000",
    price: 5_800_000,
    image: pickImageByFragments(homeFlashSaleEntries, ["61q7csy-uul", "simgot", "iem"], at(iemImages, 0, fallbackImage)),
    href: "/products",
  },
  {
    id: "feature-2",
    type: "MONITOR",
    title: "MÀN HÌNH ASUS ROG XG27UCDMG",
    price: 23_900_000,
    image: pickImageByFragments(homeFlashSaleEntries, ["asus-rog-strix-oled-xg27ucdmg", "xg27ucdmg"], at(monitorImages, 0, fallbackImage)),
    href: "/products",
  },
  {
    id: "feature-3",
    type: "GPU",
    title: "CARD MÀN HÌNH ROG 5090",
    price: 48_700_000,
    image: pickImageByFragments(homeFlashSaleEntries, ["hero", "rtx-5090", "rog-5090"], at(products, 3)?.image || fallbackImage),
    href: "/products",
  },
  {
    id: "feature-4",
    type: "MOUSE",
    title: "CHU?T RAZER VIPER V3 PRO SE",
    price: 2_700_000,
    image: pickImageByFragments(
      mouseEntries,
      ["chuot-khong-day-razer-viper-v3-pro-se", "viper-v3-pro-se", "viper-v3-pro-counter-strike-2"],
      at(accessoryImages, 0, fallbackImage)
    ),
    href: "/products",
  },
  {
    id: "feature-5",
    type: "CPU",
    title: "CHIP AMD RYZEN 7 9800X3D",
    price: 10_900_000,
    image: pickImageByFragments(homeFlashSaleEntries, ["amd-ryzen-7-9800x3d", "9800x3d"], at(cpuImages, 0, fallbackImage)),
    href: "/products",
  },
];
const toMiniFromProduct = (product) => ({
  id: `prd-${product.id}`,
  name: product.name,
  subtitle: `${product.specs.cpu} | ${product.specs.vga}`,
  image: product.image,
  price: product.price,
  href: `/product/${product.id}`,
});

const createMiniItemsFromEntries = (entries, prefix, basePrice) =>
  entries.slice(0, 12).map((entry, index) => ({
    id: `${prefix}-${index}`,
    name: createTitleFromPath(entry.path, `${prefix.toUpperCase()} ${index + 1}`),
    subtitle: `${prefix.toUpperCase()} CHINH HANG`,
    image: entry.src,
    price: basePrice + index * 170_000,
    href: "/products",
  }));

const mouseMiniItems = createMiniItemsFromEntries(mouseEntries, "mouse", 490_000);
const keyboardMiniItems = createMiniItemsFromEntries(
  keyboardEntries,
  "keyboard",
  990_000
);
const monitorMiniItems = createMiniItemsFromEntries(
  monitorEntries,
  "monitor",
  2_890_000
);
const iemMiniItems = createMiniItemsFromEntries(iemEntries, "iem", 790_000);

const homePcStrip = products.slice(0, 12).map(toMiniFromProduct);
const homeMouseStrip = mouseMiniItems;
const homeKeyboardStrip = keyboardMiniItems;
const homeMonitorStrip = monitorMiniItems;
const homeAudioStrip = iemMiniItems;

export const pcCatalogList = homePcStrip;

const extractCodeFromLabel = (value = "") => {
  const match = String(value).trim().match(/\(([A-Za-z0-9-]+)\)\s*$/);
  return match ? String(match[1]).toUpperCase() : "";
};

const stripCodeSuffix = (value = "") =>
  String(value).replace(/\s*\(([A-Za-z0-9-]+)\)\s*$/u, "").trim();

const slugifyId = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const flattenBrandCatalog = (group, prefix, subtitle, imagePool = []) =>
  Object.entries(group).flatMap(([brand, models]) =>
    models.map((model, index) => {
      const productCode = extractCodeFromLabel(model);
      const modelName = stripCodeSuffix(model);
      const displayName = `${brand} ${modelName}`.trim();
      const safeIdSource = productCode || `${brand}-${modelName}-${index}`;

      return {
        id: `${prefix}-${slugifyId(safeIdSource)}`,
        name: displayName,
        subtitle,
        image: at(imagePool, index, at(iconImages, index + 10, fallbackImage)),
        price: 790_000 + index * 350_000,
        productCode,
        lookupKeywords: [displayName, modelName, brand, productCode].filter(Boolean),
        href: `/products?search=${encodeURIComponent(productCode || displayName)}`,
      };
    })
  );

export const gearCatalogList = [
  ...flattenBrandCatalog(gearMasterCatalog.mouse, "mouse", "CHUOT", accessoryImages),
  ...flattenBrandCatalog(gearMasterCatalog.pad, "pad", "MOUSE PAD", accessoryImages),
  ...flattenBrandCatalog(gearMasterCatalog.keyboard, "keyboard", "BAN PHIM", keyboardImages),
  ...flattenBrandCatalog(gearMasterCatalog.headphone, "headphone", "TAI NGHE", iemImages),
];

const HOT_GEAR_CODE_PRIORITY = [
  "RZ-V3P",
  "LG-GPX2",
  "ZW-U2DW",
  "PL-X2HM",
  "LM-MAYA-CH",
  "WT-60HEP",
  "RZ-BSV2P",
  "RZ-KV3",
];

const buildGamingGearHotFromSrc = (source = []) => {
  const byCode = new Map();
  source.forEach((item) => {
    const code = String(item?.productCode || "").trim().toUpperCase();
    if (code && !byCode.has(code)) byCode.set(code, item);
  });

  const selected = HOT_GEAR_CODE_PRIORITY.map((code) => byCode.get(code)).filter(Boolean);
  const usedIds = new Set(selected.map((item) => item.id));

  if (selected.length < 8) {
    const fallback = source.filter((item) => !usedIds.has(item.id)).slice(0, 8 - selected.length);
    selected.push(...fallback);
  }

  return selected.slice(0, 8).map((item) => ({
    ...item,
    subtitle: "GAMING GEAR HOT",
    lookupKeywords: Array.isArray(item.lookupKeywords)
      ? item.lookupKeywords
      : [item.name, item.productCode].filter(Boolean),
  }));
};

export const gamingGearHotProList = buildGamingGearHotFromSrc(gearCatalogList);

const linhKienSeeds = [
  ...pcMasterCatalog.cpu,
  ...pcMasterCatalog.mainboard,
  ...pcMasterCatalog.ram,
  ...pcMasterCatalog.ssd,
  ...pcMasterCatalog.hdd,
  ...pcMasterCatalog.psu,
  ...pcMasterCatalog.gpu,
  ...pcMasterCatalog.casePc,
];

export const linhKienCatalogList = linhKienSeeds.map((item, index) => ({
  id: `linh-kien-${index}`,
  name: `${item.brand || "PC"} ${item.model} (${item.code})`,
  subtitle: "LINH KIEN CHINH HANG",
  image: at(iconImages, 12 + index, fallbackImage),
  price: 1_290_000 + index * 250_000,
  href: "/build-pc",
}));

export const monitorCatalogList = monitorMasterCatalog.items.map((item, index) => ({
  id: `monitor-${item.id}`,
  name: `${item.brand} ${item.model} (${item.code})`,
  subtitle: `${item.hz}HZ`,
  image: at(monitorImages, index, fallbackImage),
  price: 4_990_000 + index * 1_150_000,
  href: "/products",
}));

export const pcPartLists = {
  chips: pcMasterCatalog.cpu,
  mainboards: pcMasterCatalog.mainboard,
  ram: pcMasterCatalog.ram,
  ssd: pcMasterCatalog.ssd,
  hdd: pcMasterCatalog.hdd,
  psu: pcMasterCatalog.psu,
  gpu: pcMasterCatalog.gpu,
  casePc: pcMasterCatalog.casePc,
};

export const gearPartLists = gearMasterCatalog;


export const homePromoBanners = [
  pickImageByFragment(
    homeEntries,
    "thang_06_banner_build_pc_top_promotion_banner_2",
    at(bannerImages, 0, fallbackImage)
  ),
  pickImageByFragment(
    homeEntries,
    "thang_06_banner_ghe_top_promotion_banner_1",
    at(bannerImages, 1, fallbackImage)
  ),
];


export const uiBanners = {
  categorySidebar: homeHeroBanners.rightBottom,
  productListSidebar: homeHeroBanners.rightBottom,
  productDetailSidebar: homeHeroBanners.rightBottom,
  buildSidebarLeft: homeHeroBanners.rightTop,
  buildSidebarRight: homeHeroBanners.rightBottom,
  buildSummary: homeHeroBanners.rightBottom,
  promoBlue: homePromoBanners[0],
  promoRed: homePromoBanners[1],
};

export const homeCollectionSections = [
  {
    id: "home-collection-pc",
    title: "BO MAY PC DE BAN",
    tags: ["PC", "AMD", "INTEL", "RTX", "VAN PHONG", "DO HOA"],
    items: homePcStrip,
  },
  {
    id: "home-collection-mouse",
    title: "CHUOT MAY TINH CHOI GAME",
    tags: ["PULSAR", "FINALMOUSE", "LAMZU", "RAZER", "LOGITECH", "ZOWIE"],
    items: homeMouseStrip,
  },
  {
    id: "home-collection-keyboard",
    title: "BAN PHIM CO / RAPID TRIGGER",
    tags: ["MELGEEK", "WOOTING", "AULA", "LEOBOG", "FL-ESPORT", "MONKA"],
    items: homeKeyboardStrip,
  },
  {
    id: "home-collection-monitor",
    title: "MAN HINH 144HZ - 540HZ",
    tags: ["ASUS", "MSI", "AOC", "VIEWSONIC", "BENQ", "LG", "SAMSUNG", "DELL", "GIGABYTE", "ALIENWARE"],
    items: monitorCatalogList,
  },
  {
    id: "home-collection-audio",
    title: "TAI NGHE / IEM",
    tags: ["XUAN VU", "SIMGOT", "MOONDROP", "TRUTHEAR", "KIWI EARS", "KEFINE"],
    items: homeAudioStrip,
  },
  {
    id: "home-collection-gear",
    title: "DANH SACH GEAR",
    tags: ["MOUSE", "KEYBOARD", "IEM", "MONITOR", "DESK SETUP"],
    items: gamingGearHotProList,
  },
  {
    id: "home-collection-parts",
    title: "DANH SACH LINH KIEN",
    tags: ["CPU", "MAINBOARD", "RAM", "VGA", "SSD", "PSU"],
    items: linhKienCatalogList,
  },
];

export const homeBrandLine = [
  "Logitech",
  "Razer",
  "Asus",
  "Fuhlen",
  "AKKO",
  "Dareu",
  "Aula",
  "Lamzu",
  "HyperX",
];

export const serviceCards = [
  {
    title: "Tra gop 0%",
    text: "Duyet nhanh trong 15 phut",
    icon: at(iconImages, 18, fallbackImage),
  },
  {
    title: "Bao hanh 1 doi 1",
    text: "Ho tro tai nha noi thanh",
    icon: at(iconImages, 32, fallbackImage),
  },
  {
    title: "Free ship toan quoc",
    text: "Ap dung don tu 500,000 VND",
    icon: at(iconImages, 41, fallbackImage),
  },
];

export const comboItems = [
  ...monitorMiniItems.slice(0, 1),
  ...mouseMiniItems.slice(0, 3),
  ...keyboardMiniItems.slice(0, 2),
  ...iemMiniItems.slice(0, 1),
].map((item, index) => ({
  id: `combo-${index}`,
  name: item.name,
  image: item.image,
  price: item.price,
}));

export const articleCards = [
  {
    id: "news-0",
    title: "RAM VA CPU: THANH PHAN NAO QUAN TRONG HON?",
    image: pickImageByFragment(
      bannerEntries,
      "ram-va-cpu-cai-nao-quan-trong-hon-thumb",
      at(products, 0)?.image || fallbackImage
    ),
  },
  {
    id: "news-1",
    title: "RAM DDR4 LA GI? SO SANH VOI DDR5",
    image: pickImageByFragment(
      bannerEntries,
      "asus_rog_flow_z13",
      at(products, 1)?.image || fallbackImage
    ),
  },
  {
    id: "news-2",
    title: "NANG CAP RAM CO LAM DAY MAY?",
    image: pickImageByFragment(
      bannerEntries,
      "work-gaming-setup",
      at(products, 2)?.image || fallbackImage
    ),
  },
];

export const brandFilters = [
  { key: "all", label: "TAT CA" },
  { key: "AMD", label: "AMD" },
  { key: "INTEL", label: "INTEL" },
];

export const gpuFilters = [
  { key: "all", label: "TAT CA" },
  { key: "RTX5000", label: "RTX 5000 SERIES" },
  { key: "RTX4000", label: "RTX 4000 SERIES" },
  { key: "RTX3000", label: "RTX 3000 SERIES" },
  { key: "RX", label: "RX 7000 SERIES" },
];

export const priceRanges = [
  { key: "all", label: "TAT CA", min: 0, max: Number.POSITIVE_INFINITY },
  { key: "under25", label: "0 - 25,000,000", min: 0, max: 25_000_000 },
  {
    key: "25to35",
    label: "25,000,000 - 35,000,000",
    min: 25_000_000,
    max: 35_000_000,
  },
  {
    key: "35plus",
    label: "35,000,000 TRO LEN",
    min: 35_000_000,
    max: Number.POSITIVE_INFINITY,
  },
];

export const buildPartCatalog = [
  {
    key: "cpu",
    label: "CPU",
    items: cpuPool.map((name, index) => ({
      id: `cpu-${index}`,
      name,
      price: 5_500_000 + index * 1_200_000,
      icon: at(iconImages, 14 + index, fallbackImage),
    })),
  },
  {
    key: "mainboard",
    label: "MAINBOARD",
    items: mainboardPool.map((name, index) => ({
      id: `mainboard-${index}`,
      name,
      price: 2_990_000 + index * 780_000,
      icon: at(iconImages, 25 + index, fallbackImage),
    })),
  },
  {
    key: "ram",
    label: "RAM",
    items: ramPool.map((name, index) => ({
      id: `ram-${index}`,
      name,
      price: 1_590_000 + index * 490_000,
      icon: at(iconImages, 34 + index, fallbackImage),
    })),
  },
  {
    key: "vga",
    label: "VGA",
    items: vgaPool.map((name, index) => ({
      id: `vga-${index}`,
      name,
      price: 8_890_000 + index * 2_180_000,
      icon: at(iconImages, 42 + index, fallbackImage),
    })),
  },
  {
    key: "ssd",
    label: "SSD",
    items: ssdPool.map((name, index) => ({
      id: `ssd-${index}`,
      name,
      price: 1_390_000 + index * 350_000,
      icon: at(iconImages, 51 + index, fallbackImage),
    })),
  },
  {
    key: "hdd",
    label: "HDD",
    items: hddPool.map((name, index) => ({
      id: `hdd-${index}`,
      name,
      price: 1_090_000 + index * 430_000,
      icon: at(iconImages, 57 + index, fallbackImage),
    })),
  },
  {
    key: "psu",
    label: "PSU",
    items: psuPool.map((name, index) => ({
      id: `psu-${index}`,
      name,
      price: 1_590_000 + index * 500_000,
      icon: at(iconImages, 63 + index, fallbackImage),
    })),
  },
  {
    key: "case",
    label: "CASE",
    items: casePool.map((name, index) => ({
      id: `case-${index}`,
      name,
      price: 1_390_000 + index * 360_000,
      icon: at(iconImages, 70 + index, fallbackImage),
    })),
  },
  {
    key: "cooler",
    label: "COOLER",
    items: coolerPool.map((name, index) => ({
      id: `cooler-${index}`,
      name,
      price: 790_000 + index * 520_000,
      icon: at(iconImages, 74 + index, fallbackImage),
    })),
  },
  {
    key: "fan",
    label: "FAN",
    items: fanPool.map((name, index) => ({
      id: `fan-${index}`,
      name,
      price: 590_000 + index * 290_000,
      icon: at(iconImages, 79 + index, fallbackImage),
    })),
  },
];

export const buildPeripheralGroups = [
  {
    id: "peripheral-0",
    title: "BAN PHIM",
    items: keyboardMiniItems.slice(0, 8),
  },
  {
    id: "peripheral-1",
    title: "CHUOT",
    items: mouseMiniItems.slice(0, 8),
  },
  {
    id: "peripheral-2",
    title: "TAI NGHE",
    items: iemMiniItems.slice(0, 8),
  },
];

export const buildBottomBanners = [
  uiBanners.promoBlue,
  uiBanners.promoRed,
  pickImageByFragment(homeFlashSaleEntries, "pc_1", fallbackImage),
];

export const formatCurrency = (value) => formatVnd(value);

export const normalizeProductIndex = (rawId) => {
  if (products.length === 0) return 0;

  const parsed = Number.parseInt(rawId ?? "0", 10);
  if (!Number.isFinite(parsed)) return 0;

  return ((parsed % products.length) + products.length) % products.length;
};

export const getProductById = (rawId) =>
  products[normalizeProductIndex(rawId)] ?? null;

export const getRelatedProducts = (rawId, limit = 8) => {
  const active = normalizeProductIndex(rawId);
  return products.filter((product) => product.id !== active).slice(0, limit);
};

export const getHeroBanners = () => ({
  main: homeHeroBanners.main,
  rightTop: homeHeroBanners.rightTop,
  rightBottom: homeHeroBanners.rightBottom,
});


