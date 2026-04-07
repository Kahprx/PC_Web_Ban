import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  buildPartCatalog,
  formatCurrency,
  gearCatalogList,
  monitorCatalogList,
} from "../../data/storeData";
import { useAuth } from "../../context/AuthContext";
import { addToCartApi } from "../../services/cartService";
import { fetchProducts, toAbsoluteImageUrl } from "../../services/productService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./BuildPC.css";

const PAGE_SIZE = 6;
const API_FETCH_LIMIT = 50;
const API_MAX_PAGES = 80;

const PRICE_BANDS = [
  { key: "all", label: "Tất cả", min: 0, max: Number.POSITIVE_INFINITY },
  { key: "under2", label: "Dưới 2 triệu", min: 0, max: 2_000_000 },
  { key: "2to5", label: "2 - 5 triệu", min: 2_000_000, max: 5_000_000 },
  { key: "5to10", label: "5 - 10 triệu", min: 5_000_000, max: 10_000_000 },
  { key: "10plus", label: "Trên 10 triệu", min: 10_000_000, max: Number.POSITIVE_INFINITY },
];

const CPU_BRANDS = ["INTEL", "AMD"];
const MAINBOARD_BRAND_ORDER = [
  "ASUS",
  "MSI",
  "GIGABYTE",
  "ASROCK",
  "COLORFUL",
  "BIOSTAR",
  "NZXT",
  "MAXSUN",
];
const COMPONENT_BLOCK_KEYWORDS = [
  "laptop",
  "notebook",
  "macbook",
  "pc gaming",
  "pc do hoa",
  "pc van phong",
  "bo pc",
  "build pc",
];
const MONITOR_BLOCK_KEYWORDS = [
  "card man hinh",
  "vga",
  "gpu",
  "rtx",
  "gtx",
  "radeon",
  "geforce",
  "vo case",
  "case pc",
  "mid tower",
  "full tower",
  "khong gom man hinh",
  "khong bao gom man hinh",
  "mainboard",
  "motherboard",
  "ram",
  "ssd",
  "hdd",
  "psu",
  "nguon",
  "tan nhiet",
];

const MONITOR_SIGNAL_KEYWORDS = [
  "man hinh",
  "monitor",
  "display",
  "ips",
  "oled",
  "va",
  "fhd",
  "qhd",
  "uhd",
  "2k",
  "4k",
  "hz",
  "hdmi",
  "displayport",
  "usb-c",
];

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const GENERIC_BRAND_BLOCK_WORDS = new Set([
  "cpu",
  "mainboard",
  "motherboard",
  "ram",
  "ssd",
  "hdd",
  "psu",
  "vga",
  "gpu",
  "case",
  "cooler",
  "tan",
  "nhiet",
  "linh",
  "kien",
  "card",
  "man",
  "hinh",
  "bo",
  "mach",
  "chu",
  "pc",
  "gaming",
]);

const HARDWARE_BRAND_RULES = [
  { label: "ASUS", keywords: ["asus", "rog", "tuf"] },
  { label: "MSI", keywords: ["msi"] },
  { label: "GIGABYTE", keywords: ["gigabyte", "aorus"] },
  { label: "ASROCK", keywords: ["asrock"] },
  { label: "COLORFUL", keywords: ["colorful"] },
  { label: "BIOSTAR", keywords: ["biostar"] },
  { label: "NZXT", keywords: ["nzxt"] },
  { label: "MAXSUN", keywords: ["maxsun"] },
  { label: "KINGSTON", keywords: ["kingston", "fury"] },
  { label: "CORSAIR", keywords: ["corsair"] },
  { label: "G.SKILL", keywords: ["g.skill", "gskill"] },
  { label: "TEAMGROUP", keywords: ["teamgroup", "t-force", "tforce"] },
  { label: "ADATA", keywords: ["adata", "xpg"] },
  { label: "LEXAR", keywords: ["lexar"] },
  { label: "CRUCIAL", keywords: ["crucial"] },
  { label: "SAMSUNG", keywords: ["samsung"] },
  { label: "APACER", keywords: ["apacer"] },
  { label: "KLEVV", keywords: ["klevv"] },
  { label: "PNY", keywords: ["pny"] },
  { label: "PATRIOT", keywords: ["patriot", "viper"] },
  { label: "GALAX", keywords: ["galax"] },
  { label: "ZOTAC", keywords: ["zotac"] },
  { label: "PALIT", keywords: ["palit"] },
  { label: "INNO3D", keywords: ["inno3d"] },
  { label: "SAPPHIRE", keywords: ["sapphire"] },
  { label: "POWERCOLOR", keywords: ["powercolor"] },
  { label: "XFX", keywords: ["xfx"] },
  { label: "THERMALTAKE", keywords: ["thermaltake"] },
  { label: "DEEPCOOL", keywords: ["deepcool"] },
  { label: "COOLER MASTER", keywords: ["cooler master", "coolermaster"] },
  { label: "ANTEC", keywords: ["antec"] },
  { label: "MONTECH", keywords: ["montech"] },
  { label: "FRACTAL", keywords: ["fractal"] },
  { label: "INWIN", keywords: ["inwin"] },
  { label: "LIAN LI", keywords: ["lian li", "lianli"] },
  { label: "XIGMATEK", keywords: ["xigmatek"] },
  { label: "SEASONIC", keywords: ["seasonic"] },
  { label: "FSP", keywords: ["fsp"] },
  { label: "SUPER FLOWER", keywords: ["super flower"] },
];

const extractBrand = (name) => {
  const tokens = String(name || "")
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[^\w.+-]/g, ""))
    .filter(Boolean);

  const picked = tokens.find((token) => !GENERIC_BRAND_BLOCK_WORDS.has(normalizeText(token)));
  return picked ? picked.toUpperCase() : "OTHER";
};

const includesAny = (text, keywords = []) => keywords.some((keyword) => text.includes(keyword));

const detectHardwareBrand = (raw = "") => {
  const text = normalizeText(raw);
  const matched = HARDWARE_BRAND_RULES.find((rule) => includesAny(text, rule.keywords));
  if (matched) return matched.label;
  return extractBrand(raw);
};

const toPickerItem = (item, fallbackIcon = "") => ({
  id: String(item?.id || ""),
  productId: Number(item?.productId || 0),
  name: String(item?.name || "Sản phẩm"),
  brand: String(item?.brand || extractBrand(item?.name)),
  mainSeries: String(item?.mainSeries || ""),
  ramBusMhz: Number(item?.ramBusMhz || 0),
  gpuModelNo: Number(item?.gpuModelNo || 0),
  gpuModelLabel: String(item?.gpuModelLabel || ""),
  gpuGeneration: String(item?.gpuGeneration || ""),
  gpuVramGb: Number(item?.gpuVramGb || 0),
  storageCapacityGb: Number(item?.storageCapacityGb || 0),
  psuWatt: Number(item?.psuWatt || 0),
  price: Number(item?.price || 0),
  productCode: String(item?.productCode || ""),
  description: String(item?.description || ""),
  categorySlug: String(item?.categorySlug || ""),
  categoryName: String(item?.categoryName || ""),
  icon: String(item?.icon || fallbackIcon || ""),
  source: String(item?.source || "fallback"),
});

const legacyPartMap = buildPartCatalog.reduce((acc, part) => {
  acc[part.key] = part.items || [];
  return acc;
}, {});

const toDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const createPartIcon = ({ code, bg, border, text }) =>
  toDataUri(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
      <rect x='3' y='3' width='58' height='58' rx='16' fill='${bg}' stroke='${border}' stroke-width='2'/>
      <rect x='10' y='12' width='44' height='26' rx='8' fill='white' opacity='0.92'/>
      <rect x='14' y='42' width='36' height='9' rx='4.5' fill='${border}' opacity='0.22'/>
      <text x='32' y='30' text-anchor='middle' font-size='14' font-weight='800' fill='${text}' font-family='Segoe UI, Arial, sans-serif'>${code}</text>
    </svg>`
  );

const PART_ICON_META = {
  cpu: { code: "CPU", bg: "#EAF2FF", border: "#5E87CF", text: "#244A90" },
  mainboard: { code: "MB", bg: "#F2F4FF", border: "#7A88D6", text: "#2F3C8A" },
  ram: { code: "RAM", bg: "#E9FBF4", border: "#59B98A", text: "#1C6E48" },
  vga: { code: "GPU", bg: "#FFF2EA", border: "#D48559", text: "#8F3F1D" },
  ssd: { code: "SSD", bg: "#EFF7FF", border: "#5796C4", text: "#1F5E89" },
  hdd: { code: "HDD", bg: "#F5F1FF", border: "#8E7CC8", text: "#4D3C89" },
  cooler: { code: "AIO", bg: "#EAF7FF", border: "#57A2CF", text: "#1F5C83" },
  psu: { code: "PSU", bg: "#FFF5EB", border: "#D89B59", text: "#8A551F" },
  case: { code: "CASE", bg: "#F4F5F7", border: "#8A95A5", text: "#3A4659" },
  monitor: { code: "MON", bg: "#EDF5FF", border: "#6F97C9", text: "#2B4F7E" },
  gear: { code: "GEAR", bg: "#F6F1FF", border: "#9A7EC4", text: "#563D84" },
  chair: { code: "CHAIR", bg: "#FFF2F4", border: "#D88795", text: "#8B3D4D" },
  desk: { code: "DESK", bg: "#F8F4EC", border: "#B68E5F", text: "#6F4D29" },
};

const partIcons = Object.entries(PART_ICON_META).reduce((acc, [key, value]) => {
  acc[key] = createPartIcon(value);
  return acc;
}, {});

const detectCpuBrand = (raw = "") => {
  const text = normalizeText(raw);
  if (
    includesAny(text, [
      "amd",
      "ryzen",
      "threadripper",
      "athlon",
      "epyc",
    ])
  ) {
    return "AMD";
  }

  if (
    includesAny(text, [
      "intel",
      "core i",
      "pentium",
      "celeron",
      "xeon",
    ])
  ) {
    return "INTEL";
  }

  return "OTHER";
};

const detectMainboardBrand = (raw = "") => {
  const text = normalizeText(raw);

  if (text.includes("gigabyte") || text.includes("aorus")) return "GIGABYTE";
  if (text.includes("asus") || text.includes("rog") || text.includes("tuf")) return "ASUS";
  if (text.includes("msi")) return "MSI";
  if (text.includes("asrock")) return "ASROCK";
  if (text.includes("colorful")) return "COLORFUL";
  if (text.includes("biostar")) return "BIOSTAR";
  if (text.includes("nzxt")) return "NZXT";
  if (text.includes("maxsun")) return "MAXSUN";
  return "OTHER";
};

const detectMainboardSeries = (raw = "") => {
  const text = normalizeText(raw).toUpperCase();
  const primary = text.match(/\b((?:X|Z|B|H|A)\d{3}(?:E)?)\w*\b/);
  if (primary?.[1]) return primary[1];

  const secondary = text.match(/\b((?:TRX|WRX|C|Q)\d{2,3})\b/);
  if (secondary?.[1]) return secondary[1];

  if (text.includes("AM5")) return "AM5";
  if (text.includes("AM4")) return "AM4";
  if (text.includes("LGA1700")) return "LGA1700";
  if (text.includes("LGA1851")) return "LGA1851";

  return "OTHER";
};

const extractRamBusMhz = (raw = "") => {
  const text = String(raw || "");
  const explicit = text.match(/\b([0-9]{4,5})\s*(?:mhz|mt\/s|mts)\b/i);
  if (explicit?.[1]) return Number(explicit[1]);

  const fromDdr = text.match(/\bddr[345][^\d]{0,8}([0-9]{4,5})\b/i);
  if (fromDdr?.[1]) return Number(fromDdr[1]);

  return 0;
};

const extractCapacityGb = (raw = "") => {
  const matches = [...String(raw || "").matchAll(/(\d+(?:[.,]\d+)?)\s*(tb|gb)\b/gi)];
  if (matches.length === 0) return 0;

  const values = matches
    .map((match) => {
      const amount = Number.parseFloat(String(match[1]).replace(",", "."));
      const unit = String(match[2] || "").toLowerCase();
      if (!Number.isFinite(amount) || amount <= 0) return 0;
      return unit === "tb" ? Math.round(amount * 1024) : Math.round(amount);
    })
    .filter((value) => value > 0);

  if (values.length === 0) return 0;
  return Math.max(...values);
};

const extractPsuWatt = (raw = "") => {
  const matches = [...String(raw || "").matchAll(/\b([0-9]{3,4})\s*w\b/gi)];
  if (matches.length === 0) return 0;
  const watts = matches.map((match) => Number(match[1])).filter((value) => Number.isFinite(value) && value > 0);
  if (watts.length === 0) return 0;
  return Math.max(...watts);
};

const extractGpuInfo = (raw = "") => {
  const text = String(raw || "").toUpperCase();
  const modelMatch = text.match(/\b(RTX|GTX|RX)\s*([0-9]{4})\s*(TI|SUPER|XTX|XT|GRE)?\b/);
  let gpuModelNo = 0;
  let gpuModelLabel = "";
  let gpuGeneration = "";

  if (modelMatch) {
    const family = String(modelMatch[1]);
    const code = String(modelMatch[2]);
    const suffix = modelMatch[3] ? ` ${String(modelMatch[3]).toUpperCase()}` : "";
    gpuModelNo = Number.parseInt(code, 10);
    gpuModelLabel = `${family} ${code}${suffix}`;

    if (family === "RTX" || family === "GTX") {
      gpuGeneration = `${family} ${code.slice(0, 2)} series`;
    } else if (family === "RX") {
      gpuGeneration = `RX ${code.charAt(0)}000 series`;
    }
  }

  const nearVram = text.match(
    /\b(?:RTX|GTX|RX)\s*[0-9]{4}(?:\s*(?:TI|SUPER|XTX|XT|GRE))?[^|\n,;]{0,30}?([0-9]{1,2})\s*GB\b/
  );
  const taggedVram = text.match(/\b([0-9]{1,2})\s*GB\b[^|\n,;]{0,12}\b(?:GDDR|VRAM)\b/);
  const genericGb = text.match(/\b([0-9]{1,2})\s*GB\b/);

  const gpuVramGb = Number.parseInt(
    String(nearVram?.[1] || taggedVram?.[1] || genericGb?.[1] || "0"),
    10
  );

  return {
    gpuModelNo: Number.isFinite(gpuModelNo) ? gpuModelNo : 0,
    gpuModelLabel,
    gpuGeneration,
    gpuVramGb: Number.isFinite(gpuVramGb) ? gpuVramGb : 0,
  };
};

const formatStorageLabel = (capacityGb) => {
  const value = Number(capacityGb || 0);
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value >= 1024) {
    const tb = value / 1024;
    return Number.isInteger(tb) ? `${tb}TB` : `${tb.toFixed(1)}TB`;
  }
  return `${value}GB`;
};

const toPdfSafeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const buildExportFileSuffix = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
};

const getPartSpecText = (partKey, item) => {
  if (!item) return "-";

  if (partKey === "mainboard") {
    return item.mainSeries ? `Dòng main ${item.mainSeries}` : "-";
  }

  if (partKey === "ram") {
    return item.ramBusMhz > 0 ? `Bus ${item.ramBusMhz} MHz` : "-";
  }

  if (partKey === "vga") {
    const chunks = [];
    if (item.gpuModelLabel) chunks.push(item.gpuModelLabel);
    if (item.gpuGeneration) chunks.push(item.gpuGeneration);
    if (item.gpuVramGb > 0) chunks.push(`${item.gpuVramGb}GB VRAM`);
    return chunks.join(" | ") || "-";
  }

  if (partKey === "ssd" || partKey === "hdd") {
    return item.storageCapacityGb > 0 ? `Dung lượng ${formatStorageLabel(item.storageCapacityGb)}` : "-";
  }

  if (partKey === "psu") {
    return item.psuWatt > 0 ? `${item.psuWatt}W` : "-";
  }

  const shortDescription = String(item.description || "").replace(/\s+/g, " ").trim();
  if (!shortDescription) return "-";
  return shortDescription.length > 84 ? `${shortDescription.slice(0, 81)}...` : shortDescription;
};

const parseGpuModelNumber = (label = "") => {
  const matched = String(label || "").match(/\b([0-9]{4})\b/);
  return matched?.[1] ? Number(matched[1]) : 0;
};

const parseGpuGenerationRank = (label = "") => {
  const matched = String(label || "").match(/\b([0-9]{2})\s*series\b/i);
  return matched?.[1] ? Number(matched[1]) : 0;
};

const parseGpuFamilyRank = (label = "") => {
  const text = String(label || "").toUpperCase();
  if (text.startsWith("GTX")) return 1;
  if (text.startsWith("RTX")) return 2;
  if (text.startsWith("RX")) return 3;
  return 9;
};

const resolvePartBrand = (partKey, raw = "") => {
  if (partKey === "cpu") return detectCpuBrand(raw);
  if (partKey === "mainboard") {
    const mainboardBrand = detectMainboardBrand(raw);
    return mainboardBrand !== "OTHER" ? mainboardBrand : detectHardwareBrand(raw);
  }
  return detectHardwareBrand(raw);
};

const mapLegacyItems = (partKey, fallbackIcon) =>
  (legacyPartMap[partKey] || []).map((item) =>
    toPickerItem(
      {
        id: `${partKey}-${item.id}`,
        name: item.name,
        price: item.price,
        icon: fallbackIcon,
        source: "fallback",
      },
      fallbackIcon
    )
  );

const monitorFallbackItems = monitorCatalogList.slice(0, 24).map((item, index) =>
  toPickerItem(
    {
      id: `monitor-local-${index}`,
      name: item.name,
      price: item.price,
      icon: item.image || partIcons.monitor,
      source: "fallback",
    },
    partIcons.monitor
  )
);

const gearFallbackItems = gearCatalogList.slice(0, 36).map((item, index) =>
  toPickerItem(
    {
      id: `gear-local-${index}`,
      name: item.name,
      price: item.price,
      icon: item.image || partIcons.gear,
      source: "fallback",
    },
    partIcons.gear
  )
);

const chairFallbackItems = [
  {
    id: "chair-local-1",
    name: "Ghế gaming ergonomic KAH Pro",
    price: 2_390_000,
    icon: partIcons.chair,
  },
  {
    id: "chair-local-2",
    name: "Ghế gaming chân sắt KAH Steel",
    price: 2_790_000,
    icon: partIcons.chair,
  },
  {
    id: "chair-local-3",
    name: "Ghế gaming ngả lưng KAH Comfort",
    price: 3_190_000,
    icon: partIcons.chair,
  },
].map((item) => toPickerItem({ ...item, source: "fallback" }, partIcons.chair));

const deskFallbackItems = [
  {
    id: "desk-local-1",
    name: "Bàn gaming 120x60 KAH Core",
    price: 2_190_000,
    icon: partIcons.desk,
  },
  {
    id: "desk-local-2",
    name: "Ban nang ha dien KAH Motion",
    price: 4_390_000,
    icon: partIcons.desk,
  },
  {
    id: "desk-local-3",
    name: "Bàn gaming 140x70 KAH Studio",
    price: 3_290_000,
    icon: partIcons.desk,
  },
].map((item) => toPickerItem({ ...item, source: "fallback" }, partIcons.desk));

const FALLBACK_ITEMS_BY_PART = {
  cpu: mapLegacyItems("cpu", partIcons.cpu),
  mainboard: mapLegacyItems("mainboard", partIcons.mainboard),
  ram: mapLegacyItems("ram", partIcons.ram),
  vga: mapLegacyItems("vga", partIcons.vga),
  ssd: mapLegacyItems("ssd", partIcons.ssd),
  hdd: mapLegacyItems("hdd", partIcons.hdd),
  cooler: mapLegacyItems("cooler", partIcons.cooler),
  psu: mapLegacyItems("psu", partIcons.psu),
  case: mapLegacyItems("case", partIcons.case),
  monitor: monitorFallbackItems,
  gear: gearFallbackItems,
  chair: chairFallbackItems,
  desk: deskFallbackItems,
};

const BUILD_PARTS = [
  {
    key: "cpu",
    label: "CPU",
    icon: partIcons.cpu,
    apiQueries: [{ focusFilter: "linh-kien-cpu" }],
  },
  {
    key: "mainboard",
    label: "MAINBOARD",
    icon: partIcons.mainboard,
    apiQueries: [{ focusFilter: "linh-kien-mainboard" }],
  },
  {
    key: "ram",
    label: "RAM",
    icon: partIcons.ram,
    apiQueries: [{ focusFilter: "linh-kien-ram" }],
  },
  {
    key: "vga",
    label: "CARD MÀN HÌNH",
    icon: partIcons.vga,
    apiQueries: [{ focusFilter: "linh-kien-gpu" }],
  },
  {
    key: "ssd",
    label: "SSD",
    icon: partIcons.ssd,
    apiQueries: [{ focusFilter: "linh-kien-ssd" }],
  },
  {
    key: "hdd",
    label: "HDD",
    icon: partIcons.hdd,
    apiQueries: [{ focusFilter: "linh-kien-hdd" }],
  },
  {
    key: "cooler",
    label: "TẢN NHIỆT / FAN",
    icon: partIcons.cooler,
    apiQueries: [{ focusFilter: "linh-kien-cooler" }],
  },
  {
    key: "psu",
    label: "NGUỒN",
    icon: partIcons.psu,
    apiQueries: [{ focusFilter: "linh-kien-psu" }],
  },
  {
    key: "case",
    label: "CASE PC",
    icon: partIcons.case,
    apiQueries: [{ focusFilter: "linh-kien-case" }],
  },
  {
    key: "monitor",
    label: "MÀN HÌNH",
    icon: partIcons.monitor,
    apiQueries: [{ categoryGroup: "man-hinh" }],
  },
  {
    key: "gear",
    label: "GAMING GEAR",
    icon: partIcons.gear,
    apiQueries: [{ categoryGroup: "gaming-gear" }],
  },
  {
    key: "chair",
    label: "GHẾ GAMING",
    icon: partIcons.chair,
    apiQueries: [{ search: "ghe", categoryGroup: "gaming-gear" }, { search: "chair" }],
  },
  {
    key: "desk",
    label: "BÀN GAMING",
    icon: partIcons.desk,
    apiQueries: [{ search: "ban gaming", categoryGroup: "gaming-gear" }, { search: "desk" }],
  },
];

const createEmptySelectionItem = (part) =>
  toPickerItem(
    {
      id: `${part.key}-empty`,
      name: `Chưa chọn ${part.label}`,
      brand: "-",
      price: 0,
      icon: part.icon,
      source: "empty",
    },
    part.icon
  );

const getFallbackItems = (partKey, fallbackIcon) => {
  const fallback = FALLBACK_ITEMS_BY_PART[partKey] || [];
  if (fallback.length > 0) return fallback;

  return [
    toPickerItem(
      {
        id: `${partKey}-empty`,
        name: `Chưa có dữ liệu ${partKey}`,
        price: 0,
        icon: fallbackIcon,
        source: "fallback",
      },
      fallbackIcon
    ),
  ];
};

const createDefaultSelection = () =>
  BUILD_PARTS.reduce((acc, part) => {
    acc[part.key] = null;
    return acc;
  }, {});

const createDefaultItemBank = () =>
  BUILD_PARTS.reduce((acc, part) => {
    acc[part.key] = getFallbackItems(part.key, part.icon);
    return acc;
  }, {});

const parseApiItem = (product, part) =>
  (() => {
    const rawText = `${product.name || ""} ${product.description || ""} ${product.category_name || ""}`;
    const gpuInfo = extractGpuInfo(rawText);
    return toPickerItem(
      {
        id: `api-${product.id}`,
        productId: Number(product.id || 0),
        name: String(product.name || `${part.label} ${product.id || ""}`).trim(),
        brand: resolvePartBrand(part.key, rawText),
        mainSeries: part.key === "mainboard" ? detectMainboardSeries(product.name || "") : "",
        ramBusMhz: part.key === "ram" ? extractRamBusMhz(rawText) : 0,
        gpuModelNo: part.key === "vga" ? gpuInfo.gpuModelNo : 0,
        gpuModelLabel: part.key === "vga" ? gpuInfo.gpuModelLabel : "",
        gpuGeneration: part.key === "vga" ? gpuInfo.gpuGeneration : "",
        gpuVramGb: part.key === "vga" ? gpuInfo.gpuVramGb : 0,
        storageCapacityGb: part.key === "ssd" || part.key === "hdd" ? extractCapacityGb(rawText) : 0,
        psuWatt: part.key === "psu" ? extractPsuWatt(rawText) : 0,
        price: Number(product.price || 0),
        productCode: String(product.product_code || ""),
        description: String(product.description || ""),
        categorySlug: String(product.category_slug || ""),
        categoryName: String(product.category_name || ""),
        icon: toAbsoluteImageUrl(product.image_url || ""),
        source: "api",
      },
      part.icon
    );
  })();

const getRowText = (row) => normalizeText(`${row?.name || ""} ${row?.description || ""}`);
const getRowCategory = (row) => normalizeText(`${row?.category_slug || ""} ${row?.category_name || ""}`);
const hasPartMarker = (row, marker) => normalizeText(row?.description || "").includes(`part: ${marker}`);

const isComponentBlockedRow = (row) => {
  const text = getRowText(row);
  const categoryText = getRowCategory(row);
  return includesAny(categoryText, ["laptop", "macbook", "pc-gaming"]) || includesAny(text, COMPONENT_BLOCK_KEYWORDS);
};

const isCpuItem = (row) => {
  const text = getRowText(row);
  const cpuBrand = detectCpuBrand(`${row?.name || ""} ${row?.description || ""}`);
  const requiredKeywords = ["cpu", "intel core", "ryzen", "pentium", "celeron", "threadripper", "xeon"];

  if (isComponentBlockedRow(row)) return false;
  if (!CPU_BRANDS.includes(cpuBrand)) return false;
  if (hasPartMarker(row, "cpu")) return true;
  return includesAny(text, requiredKeywords);
};

const isMainboardItem = (row) => {
  const text = getRowText(row);
  if (isComponentBlockedRow(row)) return false;
  if (hasPartMarker(row, "mainboard")) return true;
  if (detectMainboardSeries(text) !== "OTHER") return true;
  return includesAny(text, ["mainboard", "motherboard", "bo mach chu"]);
};

const isLinhKienItemByKeywords = (row, marker, keywords) => {
  const text = getRowText(row);
  if (isComponentBlockedRow(row)) return false;
  if (hasPartMarker(row, marker)) return true;
  return includesAny(text, keywords);
};

const isMainboardSignal = (row) => {
  const text = getRowText(row);
  if (hasPartMarker(row, "mainboard")) return true;
  return includesAny(text, ["mainboard", "motherboard", "bo mach chu", "chipset", "socket"]);
};

const hasValidRamBus = (row) => {
  const text = `${row?.name || ""} ${row?.description || ""}`;
  return extractRamBusMhz(text) > 0;
};

const isGpuInRequestedRange = (row) => {
  const text = `${row?.name || ""} ${row?.description || ""}`;
  const gpuInfo = extractGpuInfo(text);
  const family = String(gpuInfo.gpuModelLabel || "").split(" ")[0];
  if (!["GTX", "RTX"].includes(family)) return false;
  return gpuInfo.gpuModelNo >= 1650 && gpuInfo.gpuModelNo <= 5090;
};

const isStorageCapacityInRange = (row) => {
  const text = `${row?.name || ""} ${row?.description || ""}`;
  const capacityGb = extractCapacityGb(text);
  return capacityGb >= 128 && capacityGb <= 4096;
};

const isPsuWattInRange = (row) => {
  const text = `${row?.name || ""} ${row?.description || ""}`;
  const watt = extractPsuWatt(text);
  return watt >= 650 && watt <= 2000;
};

const isMonitorItem = (row) => {
  const text = getRowText(row);
  const category = getRowCategory(row);
  if (isComponentBlockedRow(row)) return false;
  if (hasPartMarker(row, "gpu") || hasPartMarker(row, "case")) return false;
  if (includesAny(category, ["laptop", "macbook"])) return false;
  if (includesAny(text, MONITOR_BLOCK_KEYWORDS)) return false;
  if (includesAny(category, ["man-hinh", "monitor"])) return true;
  return includesAny(text, MONITOR_SIGNAL_KEYWORDS);
};

const isGearItem = (row) => {
  const text = getRowText(row);
  const category = getRowCategory(row);
  if (includesAny(category, ["gaming-gear", "chuot", "ban-phim", "tai-nghe", "pad"])) return true;
  return includesAny(text, ["chuot", "ban phim", "tai nghe", "keyboard", "mouse", "headphone", "gear"]);
};

const isChairItem = (row) => {
  const text = getRowText(row);
  return includesAny(text, ["ghe gaming", "chair"]);
};

const isDeskItem = (row) => {
  const text = getRowText(row);
  return includesAny(text, ["ban gaming", "desk", "table"]);
};

const isApiProductMatchedPart = (partKey, row) => {
  if (partKey === "cpu") return isCpuItem(row);
  if (partKey === "mainboard") return isMainboardItem(row);
  if (partKey === "ram")
    return (
      isLinhKienItemByKeywords(row, "ram", ["ram", "ddr3", "ddr4", "ddr5", "sodimm"]) &&
      hasValidRamBus(row) &&
      !isMainboardSignal(row)
    );
  if (partKey === "vga")
    return (
      isLinhKienItemByKeywords(row, "gpu", ["vga", "gpu", "rtx", "gtx", "radeon", "geforce", "rx "]) &&
      isGpuInRequestedRange(row)
    );
  if (partKey === "ssd")
    return isLinhKienItemByKeywords(row, "ssd", ["ssd", "nvme", "m.2"]) && isStorageCapacityInRange(row);
  if (partKey === "hdd")
    return isLinhKienItemByKeywords(row, "hdd", ["hdd", "hard drive", "o cung", "sata"]) && isStorageCapacityInRange(row);
  if (partKey === "cooler") {
    if (isComponentBlockedRow(row)) return false;
    if (hasPartMarker(row, "cooler") || hasPartMarker(row, "fan")) return true;
    return includesAny(getRowText(row), ["tan nhiet", "aio", "heatsink", "fan", "radiator"]);
  }
  if (partKey === "psu")
    return isLinhKienItemByKeywords(row, "psu", ["nguon", "psu", "80+"]) && isPsuWattInRange(row);
  if (partKey === "case") return isLinhKienItemByKeywords(row, "case", ["case", "vo may", "mid tower", "full tower"]);
  if (partKey === "monitor") return isMonitorItem(row);
  if (partKey === "gear") return isGearItem(row);
  if (partKey === "chair") return isChairItem(row);
  if (partKey === "desk") return isDeskItem(row);
  return false;
};

const withImageFallback = (event, fallbackIcon = "") => {
  if (!fallbackIcon) return;
  if (event.currentTarget.src === fallbackIcon) return;
  event.currentTarget.src = fallbackIcon;
};

export default function BuildPC() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selectedByPart, setSelectedByPart] = useState(createDefaultSelection);
  const [partItemsByKey, setPartItemsByKey] = useState(createDefaultItemBank);
  const [activePartKey, setActivePartKey] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedMainSeries, setSelectedMainSeries] = useState([]);
  const [selectedRamBuses, setSelectedRamBuses] = useState([]);
  const [selectedGpuModels, setSelectedGpuModels] = useState([]);
  const [selectedGpuGenerations, setSelectedGpuGenerations] = useState([]);
  const [selectedGpuVrams, setSelectedGpuVrams] = useState([]);
  const [selectedSsdCaps, setSelectedSsdCaps] = useState([]);
  const [selectedPsuWatts, setSelectedPsuWatts] = useState([]);
  const [priceBand, setPriceBand] = useState("all");
  const [page, setPage] = useState(1);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");

  const selectedParts = useMemo(
    () =>
      BUILD_PARTS.map((part) => ({
        ...part,
        selectedItem: selectedByPart[part.key] || createEmptySelectionItem(part),
      })),
    [selectedByPart]
  );

  const activePart = useMemo(
    () => BUILD_PARTS.find((part) => part.key === activePartKey) || null,
    [activePartKey]
  );

  const activePartItems = useMemo(() => {
    if (!activePart) return [];

    const sourceItems = partItemsByKey[activePart.key] || getFallbackItems(activePart.key, activePart.icon);
    const mapped = sourceItems.map((item, index) => ({
      ...item,
      index,
      brand: resolvePartBrand(
        activePart.key,
        `${item.name || ""} ${item.description || ""} ${item.categoryName || ""}`
      ),
      mainSeries: activePart.key === "mainboard" ? detectMainboardSeries(item.name || "") : "",
      ...(activePart.key === "vga" ? extractGpuInfo(`${item.name || ""} ${item.description || ""}`) : {}),
      ramBusMhz:
        activePart.key === "ram"
          ? extractRamBusMhz(`${item.name || ""} ${item.description || ""}`)
          : Number(item.ramBusMhz || 0),
      storageCapacityGb:
        activePart.key === "ssd" || activePart.key === "hdd"
          ? extractCapacityGb(`${item.name || ""} ${item.description || ""}`)
          : Number(item.storageCapacityGb || 0),
      psuWatt:
        activePart.key === "psu"
          ? extractPsuWatt(`${item.name || ""} ${item.description || ""}`)
          : Number(item.psuWatt || 0),
      price: Number(item.price || 0),
      icon: item.icon || activePart.icon,
    }));

    if (activePart.key === "cpu") {
      return mapped.filter((item) => CPU_BRANDS.includes(item.brand));
    }

    if (activePart.key === "ram") {
      return mapped.filter((item) => {
        const row = {
          name: item.name,
          description: item.description,
          category_name: item.categoryName,
          category_slug: item.categorySlug,
        };
        return hasValidRamBus(row) && !isMainboardSignal(row);
      });
    }

    return mapped;
  }, [activePart, partItemsByKey]);

  const brandCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = String(item.brand || "OTHER");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeBrands = useMemo(() => {
    if (!activePart) return [];
    if (activePart.key === "cpu") return CPU_BRANDS;
    if (activePart.key === "mainboard") {
      const found = [...new Set(activePartItems.map((item) => item.brand).filter(Boolean))];
      const ordered = MAINBOARD_BRAND_ORDER.filter((brand) => found.includes(brand));
      const rest = found.filter((brand) => !MAINBOARD_BRAND_ORDER.includes(brand)).sort((a, b) => a.localeCompare(b));
      return [...ordered, ...rest];
    }
    return [...new Set(activePartItems.map((item) => item.brand).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [activePart, activePartItems]);

  const mainSeriesCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = String(item.mainSeries || "OTHER");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeMainSeries = useMemo(() => {
    if (!activePart || activePart.key !== "mainboard") return [];
    return [...new Set(activePartItems.map((item) => item.mainSeries).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "en", { numeric: true })
    );
  }, [activePart, activePartItems]);

  const ramBusCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = Number(item.ramBusMhz || 0);
        if (key <= 0) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeRamBuses = useMemo(() => {
    if (!activePart || activePart.key !== "ram") return [];
    return [...new Set(activePartItems.map((item) => Number(item.ramBusMhz || 0)).filter((value) => value > 0))].sort(
      (a, b) => a - b
    );
  }, [activePart, activePartItems]);

  const gpuModelCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = String(item.gpuModelLabel || "").trim();
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeGpuModels = useMemo(() => {
    if (!activePart || activePart.key !== "vga") return [];
    return [...new Set(activePartItems.map((item) => String(item.gpuModelLabel || "").trim()).filter(Boolean))].sort(
      (a, b) => {
        const familyDiff = parseGpuFamilyRank(a) - parseGpuFamilyRank(b);
        if (familyDiff !== 0) return familyDiff;
        const modelDiff = parseGpuModelNumber(a) - parseGpuModelNumber(b);
        if (modelDiff !== 0) return modelDiff;
        return a.localeCompare(b);
      }
    );
  }, [activePart, activePartItems]);

  const gpuGenerationCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = String(item.gpuGeneration || "").trim();
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeGpuGenerations = useMemo(() => {
    if (!activePart || activePart.key !== "vga") return [];
    return [...new Set(activePartItems.map((item) => String(item.gpuGeneration || "").trim()).filter(Boolean))].sort(
      (a, b) => {
        const seriesDiff = parseGpuGenerationRank(a) - parseGpuGenerationRank(b);
        if (seriesDiff !== 0) return seriesDiff;
        return a.localeCompare(b);
      }
    );
  }, [activePart, activePartItems]);

  const gpuVramCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = Number(item.gpuVramGb || 0);
        if (key <= 0) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeGpuVrams = useMemo(() => {
    if (!activePart || activePart.key !== "vga") return [];
    return [...new Set(activePartItems.map((item) => Number(item.gpuVramGb || 0)).filter((value) => value > 0))].sort(
      (a, b) => a - b
    );
  }, [activePart, activePartItems]);

  const ssdCapacityCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = Number(item.storageCapacityGb || 0);
        if (key <= 0) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activeSsdCaps = useMemo(() => {
    if (!activePart || !["ssd", "hdd"].includes(activePart.key)) return [];
    return [
      ...new Set(activePartItems.map((item) => Number(item.storageCapacityGb || 0)).filter((value) => value > 0)),
    ].sort((a, b) => a - b);
  }, [activePart, activePartItems]);

  const psuWattCounts = useMemo(
    () =>
      activePartItems.reduce((acc, item) => {
        const key = Number(item.psuWatt || 0);
        if (key <= 0) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [activePartItems]
  );

  const activePsuWatts = useMemo(() => {
    if (!activePart || activePart.key !== "psu") return [];
    return [...new Set(activePartItems.map((item) => Number(item.psuWatt || 0)).filter((value) => value > 0))].sort(
      (a, b) => a - b
    );
  }, [activePart, activePartItems]);

  const filteredItems = useMemo(() => {
    let items = [...activePartItems];
    const safeKeyword = normalizeText(keyword);
    const range = PRICE_BANDS.find((item) => item.key === priceBand) || PRICE_BANDS[0];

    if (safeKeyword) {
      items = items.filter((item) => normalizeText(item.name).includes(safeKeyword));
    }

    if (selectedBrands.length > 0) {
      items = items.filter((item) => selectedBrands.includes(item.brand));
    }

    if (activePart?.key === "mainboard" && selectedMainSeries.length > 0) {
      items = items.filter((item) => selectedMainSeries.includes(item.mainSeries));
    }

    if (activePart?.key === "ram" && selectedRamBuses.length > 0) {
      items = items.filter((item) => selectedRamBuses.includes(Number(item.ramBusMhz || 0)));
    }

    if (activePart?.key === "vga") {
      if (selectedGpuModels.length > 0) {
        items = items.filter((item) => selectedGpuModels.includes(String(item.gpuModelLabel || "")));
      }
      if (selectedGpuGenerations.length > 0) {
        items = items.filter((item) => selectedGpuGenerations.includes(String(item.gpuGeneration || "")));
      }
      if (selectedGpuVrams.length > 0) {
        items = items.filter((item) => selectedGpuVrams.includes(Number(item.gpuVramGb || 0)));
      }
    }

    if (["ssd", "hdd"].includes(activePart?.key || "") && selectedSsdCaps.length > 0) {
      items = items.filter((item) => selectedSsdCaps.includes(Number(item.storageCapacityGb || 0)));
    }

    if (activePart?.key === "psu" && selectedPsuWatts.length > 0) {
      items = items.filter((item) => selectedPsuWatts.includes(Number(item.psuWatt || 0)));
    }

    items = items.filter((item) => item.price >= range.min && item.price < range.max);

    if (sortBy === "price-asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [
    activePart?.key,
    activePartItems,
    keyword,
    priceBand,
    selectedBrands,
    selectedMainSeries,
    selectedRamBuses,
    selectedGpuModels,
    selectedGpuGenerations,
    selectedGpuVrams,
    selectedSsdCaps,
    selectedPsuWatts,
    sortBy,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const coreSubtotal = useMemo(
    () => selectedParts.reduce((sum, part) => sum + Number(part.selectedItem.price || 0), 0),
    [selectedParts]
  );
  const hasSelectedPart = useMemo(
    () => selectedParts.some((part) => part.selectedItem?.source !== "empty"),
    [selectedParts]
  );
  const selectedBuildRows = useMemo(
    () =>
      selectedParts
        .filter((part) => part.selectedItem?.source !== "empty")
        .map((part) => ({
          partLabel: part.label,
          productName: String(part.selectedItem?.name || "-"),
          brand: String(part.selectedItem?.brand || "-"),
          productCode: String(part.selectedItem?.productCode || "-"),
          specs: getPartSpecText(part.key, part.selectedItem),
          price: Number(part.selectedItem?.price || 0),
        })),
    [selectedParts]
  );
  const assemblyFee = hasSelectedPart ? 290_000 : 0;
  const total = coreSubtotal + assemblyFee;

  const handleExportExcel = () => {
    if (selectedBuildRows.length === 0) {
      notifyError("Bạn chưa chọn linh kiện để xuất file");
      return;
    }

    try {
      const rows = selectedBuildRows.map((row, index) => ({
        STT: index + 1,
        LINH_KIEN: row.partLabel,
        SAN_PHAM: row.productName,
        THUONG_HIEU: row.brand,
        MA_SP: row.productCode,
        THONG_SO: row.specs,
        GIA_VND: row.price,
      }));

      const summaryRows = [
        { MUC: "Tam tinh linh kien", GIA_TRI_VND: coreSubtotal },
        { MUC: "Phi lap dat", GIA_TRI_VND: assemblyFee },
        { MUC: "Tong cong", GIA_TRI_VND: total },
      ];

      const workbook = XLSX.utils.book_new();
      const configSheet = XLSX.utils.json_to_sheet(rows);
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

      XLSX.utils.book_append_sheet(workbook, configSheet, "Cau_hinh_PC");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Tong_ket");

      const filename = `cau-hinh-pc-${buildExportFileSuffix()}.xlsx`;
      XLSX.writeFile(workbook, filename);
      notifySuccess("Đã xuất file Excel cấu hình PC");
    } catch (error) {
      notifyError(error, "Xuất file Excel thất bại");
    }
  };

  const handleExportPdf = () => {
    if (selectedBuildRows.length === 0) {
      notifyError("Bạn chưa chọn linh kiện để xuất file");
      return;
    }

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const exportedAt = new Date().toLocaleString("vi-VN");

      doc.setFontSize(15);
      doc.text(toPdfSafeText("KAH GAMING - BAO CAO CAU HINH PC"), 40, 40);
      doc.setFontSize(10);
      doc.text(toPdfSafeText(`Thoi gian xuat: ${exportedAt}`), 40, 58);

      autoTable(doc, {
        startY: 74,
        head: [["STT", "Linh kien", "San pham", "Thuong hieu", "Thong so", "Ma SP", "Gia"]],
        body: selectedBuildRows.map((row, index) => [
          index + 1,
          toPdfSafeText(row.partLabel),
          toPdfSafeText(row.productName),
          toPdfSafeText(row.brand),
          toPdfSafeText(row.specs),
          toPdfSafeText(row.productCode),
          formatCurrency(row.price),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 5,
          textColor: [39, 28, 20],
          lineColor: [225, 207, 190],
          lineWidth: 0.4,
        },
        headStyles: {
          fillColor: [178, 108, 52],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 60 },
          2: { cellWidth: 152 },
          3: { cellWidth: 68 },
          4: { cellWidth: 120 },
          5: { cellWidth: 60 },
          6: { cellWidth: 70, halign: "right" },
        },
      });

      const finalY = doc.lastAutoTable?.finalY || 74;
      doc.setFontSize(10);
      doc.text(toPdfSafeText(`Tam tinh linh kien: ${formatCurrency(coreSubtotal)}`), 40, finalY + 24);
      doc.text(toPdfSafeText(`Phi lap dat: ${formatCurrency(assemblyFee)}`), 40, finalY + 40);
      doc.setFontSize(12);
      doc.text(toPdfSafeText(`Tong cong: ${formatCurrency(total)}`), 40, finalY + 62);

      const filename = `cau-hinh-pc-${buildExportFileSuffix()}.pdf`;
      doc.save(filename);
      notifySuccess("Đã xuất file PDF cấu hình PC");
    } catch (error) {
      notifyError(error, "Xuất file PDF thất bại");
    }
  };

  const openPicker = (partKey) => {
    setActivePartKey(partKey);
    setKeyword("");
    setSortBy("default");
    setSelectedBrands([]);
    setSelectedMainSeries([]);
    setSelectedRamBuses([]);
    setSelectedGpuModels([]);
    setSelectedGpuGenerations([]);
    setSelectedGpuVrams([]);
    setSelectedSsdCaps([]);
    setSelectedPsuWatts([]);
    setPriceBand("all");
    setPage(1);
    setPickerError("");
  };

  const closePicker = () => {
    setActivePartKey(null);
    setPickerError("");
  };

  const choosePartItem = (item) => {
    if (!activePart || !item) return;

    setSelectedByPart((prev) => ({
      ...prev,
      [activePart.key]: item,
    }));
    closePicker();
  };

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]
    );
    setPage(1);
  };

  const toggleMainSeries = (mainSeries) => {
    setSelectedMainSeries((prev) =>
      prev.includes(mainSeries) ? prev.filter((item) => item !== mainSeries) : [...prev, mainSeries]
    );
    setPage(1);
  };

  const toggleRamBus = (bus) => {
    setSelectedRamBuses((prev) => (prev.includes(bus) ? prev.filter((item) => item !== bus) : [...prev, bus]));
    setPage(1);
  };

  const toggleGpuModel = (model) => {
    setSelectedGpuModels((prev) =>
      prev.includes(model) ? prev.filter((item) => item !== model) : [...prev, model]
    );
    setPage(1);
  };

  const toggleGpuGeneration = (generation) => {
    setSelectedGpuGenerations((prev) =>
      prev.includes(generation) ? prev.filter((item) => item !== generation) : [...prev, generation]
    );
    setPage(1);
  };

  const toggleGpuVram = (vram) => {
    setSelectedGpuVrams((prev) => (prev.includes(vram) ? prev.filter((item) => item !== vram) : [...prev, vram]));
    setPage(1);
  };

  const toggleSsdCap = (capacity) => {
    setSelectedSsdCaps((prev) =>
      prev.includes(capacity) ? prev.filter((item) => item !== capacity) : [...prev, capacity]
    );
    setPage(1);
  };

  const togglePsuWatt = (watt) => {
    setSelectedPsuWatts((prev) => (prev.includes(watt) ? prev.filter((item) => item !== watt) : [...prev, watt]));
    setPage(1);
  };

  const resetBuild = () => {
    setSelectedByPart(createDefaultSelection());
  };

  const handleCheckoutBuild = async () => {
    const selectedItems = selectedParts
      .map((part) => part.selectedItem)
      .filter((item) => item && item.source !== "empty");

    if (selectedItems.length === 0) {
      notifyError("Bạn chưa chọn linh kiện để thanh toán");
      return;
    }

    const validItems = selectedItems.filter((item) => Number(item.productId) > 0);
    const invalidItems = selectedItems.filter((item) => Number(item.productId) <= 0);

    if (validItems.length === 0) {
      notifyError("Cấu hình hiện tại chưa có mã sản phẩm API để thêm vào giỏ hàng");
      return;
    }

    try {
      await Promise.all(
        validItems.map((item) =>
          addToCartApi(
            {
              productId: Number(item.productId),
              quantity: 1,
              guestProduct: {
                name: item.name,
                price: Number(item.price || 0),
                image_url: item.icon || "",
              },
            },
            token
          )
        )
      );

      if (invalidItems.length > 0) {
        notifySuccess(
          `Đã thêm ${validItems.length} linh kiện vào giỏ hàng. Bỏ qua ${invalidItems.length} mục chưa có mã API.`
        );
      } else {
        notifySuccess("Đã thêm toàn bộ cấu hình vào giỏ hàng");
      }

      navigate("/checkout");
    } catch (error) {
      notifyError(error, "Không thể thêm cấu hình vào giỏ hàng");
    }
  };

  useEffect(() => {
    if (!activePart) return undefined;

    let canceled = false;
    const loadApiItems = async () => {
      setIsPickerLoading(true);
      setPickerError("");

      const seenProductIds = new Set();
      const apiItems = [];
      let lastError = null;

      for (const queryConfig of activePart.apiQueries || []) {
        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages && currentPage <= API_MAX_PAGES) {
          let response = null;
          try {
            response = await fetchProducts({
              ...queryConfig,
              status: "active",
              page: currentPage,
              limit: API_FETCH_LIMIT,
              sortBy: "created_at",
              sortOrder: "desc",
            });
          } catch (error) {
            lastError = error;
            break;
          }

          const rows = Array.isArray(response?.data) ? response.data : [];

          rows.forEach((row) => {
            if (!isApiProductMatchedPart(activePart.key, row)) return;
            const productId = Number(row?.id);
            if (!Number.isFinite(productId) || productId <= 0) return;
            if (seenProductIds.has(productId)) return;
            seenProductIds.add(productId);
            apiItems.push(parseApiItem(row, activePart));
          });

          const reportedTotalPages = Number(response?.pagination?.totalPages || 0);
          if (Number.isFinite(reportedTotalPages) && reportedTotalPages > 0) {
            totalPages = reportedTotalPages;
          } else if (rows.length < API_FETCH_LIMIT) {
            totalPages = currentPage;
          } else {
            totalPages = currentPage + 1;
          }

          if (rows.length === 0) break;
          currentPage += 1;
        }
      }

      if (canceled) return;

      if (apiItems.length > 0) {
        setPartItemsByKey((prev) => ({
          ...prev,
          [activePart.key]: apiItems,
        }));
      } else {
        setPartItemsByKey((prev) => ({
          ...prev,
          [activePart.key]: getFallbackItems(activePart.key, activePart.icon),
        }));

        if (lastError?.message) {
          setPickerError(`${lastError.message} Đang hiển thị dữ liệu dự phòng.`);
        } else {
          setPickerError("Không có dữ liệu API phù hợp. Đang hiển thị dữ liệu dự phòng.");
        }
      }

      setIsPickerLoading(false);
    };

    loadApiItems();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closePicker();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      canceled = true;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activePart]);

  useEffect(() => {
    setPage(1);
  }, [
    keyword,
    selectedBrands,
    selectedMainSeries,
    selectedRamBuses,
    selectedGpuModels,
    selectedGpuGenerations,
    selectedGpuVrams,
    selectedSsdCaps,
    selectedPsuWatts,
    priceBand,
    sortBy,
    activePartKey,
  ]);

  return (
    <div className="buildpc-page">
      <div className="buildpc-shell">
        <section className="buildpc-header">
          <div>
            <p className="buildpc-kicker">Build PC</p>
            <h1>Chọn linh kiện theo từng nhóm API</h1>
            <p className="buildpc-desc">
              Mỗi nhóm sẽ gọi API riêng: CPU chỉ hiện CPU, VGA chỉ hiện card màn hình, thêm màn hình và gaming gear/bàn/ghế.
            </p>
          </div>

          <article className="buildpc-total-card">
            <p>Tổng tạm tính</p>
            <strong>{formatCurrency(total)}</strong>
            <span>Đã gồm phí lắp đặt {formatCurrency(assemblyFee)}</span>
            <button type="button" onClick={resetBuild}>
              Reset cấu hình
            </button>
          </article>
        </section>

        <section className="buildpc-layout">
          <div className="buildpc-part-list">
            {selectedParts.map((part) => (
              <article key={part.key} className="buildpc-part-row">
                <div className="buildpc-part-icon">
                  <img
                    src={part.selectedItem.icon || part.icon}
                    alt={part.label}
                    onError={(event) => withImageFallback(event, part.icon)}
                  />
                </div>

                <div className="buildpc-part-main">
                  <p>{part.label}</p>
                  <h3>{part.selectedItem.name}</h3>
                  <span>{formatCurrency(part.selectedItem.price)}</span>
                </div>

                <button type="button" onClick={() => openPicker(part.key)}>
                  Chọn {part.label}
                </button>
              </article>
            ))}
          </div>

          <aside className="buildpc-summary">
            <h2>Tổng quan cấu hình</h2>
            <div className="buildpc-summary-list">
              {selectedParts.map((part) => (
                <div key={`sum-${part.key}`} className="buildpc-summary-line">
                  <p>{part.label}</p>
                  <span>{formatCurrency(part.selectedItem.price)}</span>
                </div>
              ))}
            </div>

            <div className="buildpc-summary-total">
              <p>Tổng cộng</p>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <div className="buildpc-summary-actions">
              <button
                type="button"
                className="buildpc-summary-export"
                onClick={handleCheckoutBuild}
                disabled={!hasSelectedPart}
              >
                Thanh toán cấu hình
              </button>
              <button
                type="button"
                className="buildpc-summary-export"
                onClick={handleExportPdf}
                disabled={!hasSelectedPart}
              >
                Xuất PDF cấu hình
              </button>
              <button
                type="button"
                className="buildpc-summary-export"
                onClick={handleExportExcel}
                disabled={!hasSelectedPart}
              >
                Xuất Excel cấu hình
              </button>
              <Link to="/products" className="buildpc-summary-link">
                Xem thêm sản phẩm
              </Link>
            </div>
          </aside>
        </section>
      </div>

      {activePart ? (
        <div className="buildpc-picker-overlay" onClick={closePicker}>
          <section className="buildpc-picker" onClick={(event) => event.stopPropagation()}>
            <header className="buildpc-picker-head">
              <h2>Chọn linh kiện: {activePart.label}</h2>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Bạn cần tìm linh kiện gì?"
              />
              <button type="button" onClick={closePicker} aria-label="Đóng bộ lọc">
                x
              </button>
            </header>

            <div className="buildpc-picker-body">
              <aside className="buildpc-filter-col">
                <section className="buildpc-filter-section">
                  <h3>Hãng sản xuất</h3>
                  <div className="buildpc-filter-list">
                    {activeBrands.map((brand) => (
                      <label
                        key={`${activePart.key}-${brand}`}
                        className={`buildpc-filter-option ${selectedBrands.includes(brand) ? "is-active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          disabled={(brandCounts[brand] || 0) <= 0}
                        />
                        <span>{brand}</span>
                        <em>{brandCounts[brand] || 0}</em>
                      </label>
                    ))}
                  </div>
                </section>

                {activePart.key === "mainboard" && activeMainSeries.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>Dòng main</h3>
                    <div className="buildpc-filter-list">
                      {activeMainSeries.map((mainSeries) => (
                        <label
                          key={`${activePart.key}-series-${mainSeries}`}
                          className={`buildpc-filter-option ${selectedMainSeries.includes(mainSeries) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMainSeries.includes(mainSeries)}
                            onChange={() => toggleMainSeries(mainSeries)}
                            disabled={(mainSeriesCounts[mainSeries] || 0) <= 0}
                          />
                          <span>{mainSeries}</span>
                          <em>{mainSeriesCounts[mainSeries] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activePart.key === "ram" && activeRamBuses.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>Bus RAM (MHz)</h3>
                    <div className="buildpc-filter-list">
                      {activeRamBuses.map((bus) => (
                        <label
                          key={`${activePart.key}-ram-bus-${bus}`}
                          className={`buildpc-filter-option ${selectedRamBuses.includes(bus) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRamBuses.includes(bus)}
                            onChange={() => toggleRamBus(bus)}
                          />
                          <span>{bus} MHz</span>
                          <em>{ramBusCounts[bus] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activePart.key === "vga" && activeGpuModels.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>Mẫu card (1650-5090)</h3>
                    <div className="buildpc-filter-list">
                      {activeGpuModels.map((model) => (
                        <label
                          key={`${activePart.key}-gpu-model-${model}`}
                          className={`buildpc-filter-option ${selectedGpuModels.includes(model) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGpuModels.includes(model)}
                            onChange={() => toggleGpuModel(model)}
                          />
                          <span>{model}</span>
                          <em>{gpuModelCounts[model] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activePart.key === "vga" && activeGpuGenerations.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>Đời card</h3>
                    <div className="buildpc-filter-list">
                      {activeGpuGenerations.map((generation) => (
                        <label
                          key={`${activePart.key}-gpu-generation-${generation}`}
                          className={`buildpc-filter-option ${selectedGpuGenerations.includes(generation) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGpuGenerations.includes(generation)}
                            onChange={() => toggleGpuGeneration(generation)}
                          />
                          <span>{generation}</span>
                          <em>{gpuGenerationCounts[generation] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activePart.key === "vga" && activeGpuVrams.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>VRAM</h3>
                    <div className="buildpc-filter-list">
                      {activeGpuVrams.map((vram) => (
                        <label
                          key={`${activePart.key}-gpu-vram-${vram}`}
                          className={`buildpc-filter-option ${selectedGpuVrams.includes(vram) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGpuVrams.includes(vram)}
                            onChange={() => toggleGpuVram(vram)}
                          />
                          <span>{vram}GB</span>
                          <em>{gpuVramCounts[vram] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {["ssd", "hdd"].includes(activePart.key) && activeSsdCaps.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>{activePart.key === "hdd" ? "Dung lượng HDD (128GB-4TB)" : "Dung lượng SSD (128GB-4TB)"}</h3>
                    <div className="buildpc-filter-list">
                      {activeSsdCaps.map((capacity) => (
                        <label
                          key={`${activePart.key}-ssd-cap-${capacity}`}
                          className={`buildpc-filter-option ${selectedSsdCaps.includes(capacity) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSsdCaps.includes(capacity)}
                            onChange={() => toggleSsdCap(capacity)}
                          />
                          <span>{formatStorageLabel(capacity)}</span>
                          <em>{ssdCapacityCounts[capacity] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activePart.key === "psu" && activePsuWatts.length > 0 ? (
                  <section className="buildpc-filter-section">
                    <h3>Công suất nguồn (650W-2000W)</h3>
                    <div className="buildpc-filter-list">
                      {activePsuWatts.map((watt) => (
                        <label
                          key={`${activePart.key}-psu-watt-${watt}`}
                          className={`buildpc-filter-option ${selectedPsuWatts.includes(watt) ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPsuWatts.includes(watt)}
                            onChange={() => togglePsuWatt(watt)}
                          />
                          <span>{watt}W</span>
                          <em>{psuWattCounts[watt] || 0}</em>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="buildpc-filter-section">
                  <h3>Khoảng giá</h3>
                  <div className="buildpc-filter-list">
                    {PRICE_BANDS.map((band) => (
                      <label
                        key={`${activePart.key}-${band.key}`}
                        className={`buildpc-filter-option ${priceBand === band.key ? "is-active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="buildpc-price-band"
                          checked={priceBand === band.key}
                          onChange={() => setPriceBand(band.key)}
                        />
                        <span>{band.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              </aside>

              <div className="buildpc-result-col">
                <div className="buildpc-toolbar">
                  <p>
                    Hiển thị {pagedItems.length} / {filteredItems.length} kết quả
                  </p>
                  <label>
                    Sắp xếp:
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="default">Tùy chọn</option>
                      <option value="price-asc">Giá tăng dần</option>
                      <option value="price-desc">Giá giảm dần</option>
                      <option value="name-asc">Tên A-Z</option>
                    </select>
                  </label>
                </div>

                {isPickerLoading ? <p className="buildpc-picker-note">Đang tải dữ liệu API...</p> : null}
                {pickerError ? <p className="buildpc-picker-note buildpc-picker-error">{pickerError}</p> : null}

                <div className="buildpc-result-list">
                  {pagedItems.length > 0 ? (
                    pagedItems.map((item) => (
                      <article key={item.id} className="buildpc-result-item">
                        <div className="buildpc-result-thumb">
                          <img
                            src={item.icon || activePart.icon}
                            alt={item.name}
                            onError={(event) => withImageFallback(event, activePart.icon)}
                          />
                        </div>

                        <div className="buildpc-result-main">
                          <h4 className="buildpc-result-title">{item.name}</h4>
                          <p className="buildpc-result-meta">Thương hiệu: {item.brand}</p>
                          {activePart.key === "mainboard" ? (
                            <p className="buildpc-result-meta">Dòng main: {item.mainSeries || "OTHER"}</p>
                          ) : null}
                          {activePart.key === "ram" ? (
                            <p className="buildpc-result-spec">Bus RAM: {item.ramBusMhz > 0 ? `${item.ramBusMhz} MHz` : "-"}</p>
                          ) : null}
                          {activePart.key === "vga" ? (
                            <p className="buildpc-result-spec">
                              Loại card: {item.gpuModelLabel || "-"} | Đời card: {item.gpuGeneration || "-"} | VRAM:{" "}
                              {item.gpuVramGb > 0 ? `${item.gpuVramGb}GB` : "-"}
                            </p>
                          ) : null}
                          {["ssd", "hdd"].includes(activePart.key) ? (
                            <p className="buildpc-result-spec">Dung lượng: {formatStorageLabel(item.storageCapacityGb)}</p>
                          ) : null}
                          {activePart.key === "psu" ? (
                            <p className="buildpc-result-spec">Công suất: {item.psuWatt > 0 ? `${item.psuWatt}W` : "-"}</p>
                          ) : null}
                          {item.productCode ? <p className="buildpc-result-meta">Mã SP: {item.productCode}</p> : null}
                          <strong className="buildpc-result-price">{formatCurrency(item.price)}</strong>
                        </div>

                        <button className="buildpc-result-action" type="button" onClick={() => choosePartItem(item)}>
                          Thêm vào cấu hình
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="buildpc-empty">Không có linh kiện phù hợp bộ lọc hiện tại.</p>
                  )}
                </div>

                {pageCount > 1 ? (
                  <div className="buildpc-pagination">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={safePage <= 1}
                    >
                      Prev
                    </button>
                    <span>
                      {safePage}/{pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                      disabled={safePage >= pageCount}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}






