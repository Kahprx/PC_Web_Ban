import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import iconPhone from "../assets/images/PC/ICON/phone-call.png";
import iconLocation from "../assets/images/PC/ICON/location.png";
import iconShipping from "../assets/images/PC/ICON/delivery-truck.png";
import iconClock from "../assets/images/PC/ICON/clock.png";
import iconCategory from "../assets/images/PC/ICON/category.png";
import iconSearch from "../assets/images/PC/ICON/search.png";
import iconUser from "../assets/images/PC/ICON/user.png";
import iconCart from "../assets/images/PC/ICON/shopping-cart.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchCart, removeCartItemApi } from "../services/cartService";
import { fetchProducts, toAbsoluteImageUrl } from "../services/productService";
import { formatVnd } from "../utils/currency";

const navItems = [
  { to: "/products?title=PC%20GAMING", label: "PC" },
  { to: "/build-pc", label: "BUILD PC" },
  { to: "/products?title=LAPTOP", label: "LAPTOP" },
  { to: "/products?title=MACBOOK", label: "MACBOOK" },
  { to: "/products?title=LINH%20KIEN", label: "LINH KIỆN" },
  { to: "/products?title=MAN%20HINH", label: "MÀN HÌNH" },
  { to: "/products?title=GAMING%20GEAR", label: "GAMING GEAR" },
  { to: "/blog", label: "TIN TỨC" },
];

const megaSidebarItems = [
  { key: "pc-ai", label: "PC Gaming" },
  { key: "main-cpu-vga", label: "Main, CPU, VGA" },
  { key: "case-psu-cooler", label: "Case, Nguồn, Tản" },
  { key: "ram-ssd", label: "RAM, SSD, HDD" },
  { key: "audio-mic-webcam", label: "Loa, Micro, Webcam" },
  { key: "monitor", label: "Màn hình" },
  { key: "laptop", label: "Laptop" },
  { key: "laptop-gaming", label: "Laptop gaming" },
  { key: "keyboard", label: "Bàn phím" },
  { key: "mouse", label: "Chuột + pad chuột" },
  { key: "headset", label: "Tai nghe" },
  { key: "desk-chair", label: "Bàn - ghế" },
  { key: "software-network", label: "Phần mềm, mạng" },
  { key: "accessories", label: "Phụ kiện" },
  { key: "controller", label: "Tay cầm" },
  { key: "service", label: "Dịch vụ thêm" },
];

const megaBoardByKey = {
  "pc-ai": [
    {
      title: "PC THEO GIÁ",
      items: [
        "PC dưới 30 triệu",
        "PC từ 30 - 50 triệu",
        "PC từ 50 - 70 triệu",
        "PC từ 70 - 100 triệu",
        "PC từ 100 - 200 triệu",
        "PC trên 200 triệu",
      ],
    },
    {
      title: "PC THEO NHU CẦU",
      items: ["PC Esport", "PC Game AAA", "PC đồ họa", "PC văn phòng", "PC stream game"],
    },
    {
      title: "PC THEO VGA",
      items: [
        "PC RTX 5000 SERIES",
        "PC RTX 4000 SERIES",
        "PC RTX 3000 SERIES",
        "PC GTX 2000 SERIES",
      ],
    },
    {
      title: "PC THEO CPU",
      items: ["PC chip Intel", "PC AMD"],
    },
    {
      title: "PC THEO KHUYẾN MÃI",
      items: ["PC tặng màn", "PC AIO max setting", "PC tầm cao setting", "PC tặng quà", "PC tặng gear"],
    },
  ],
  "main-cpu-vga": [
    {
      title: "MAINBOARD",
      items: ["Main Intel H", "Main Intel B", "Main Intel Z", "Main AMD B", "Main AMD X"],
    },
    {
      title: "CPU INTEL",
      items: ["Core i3", "Core i5", "Core i7", "Core i9", "Intel Ultra"],
    },
    {
      title: "CPU AMD",
      items: ["Ryzen 5", "Ryzen 7", "Ryzen 9", "Threadripper", "A-Series"],
    },
    {
      title: "VGA NVIDIA",
      items: ["RTX 5060", "RTX 5070", "RTX 5080", "RTX 5090", "RTX Pro"],
    },
    {
      title: "VGA AMD",
      items: ["RX 7600", "RX 7700 XT", "RX 7800 XT", "RX 7900 GRE", "Radeon Pro"],
    },
  ],
  "case-psu-cooler": [
    { title: "CASE", items: ["ATX Mid Tower", "ATX Full Tower", "mATX", "ITX", "Case show" ] },
    { title: "NGUỒN", items: ["650W Bronze", "750W Bronze", "850W Gold", "1000W Gold", "1200W Platinum"] },
    { title: "TẢN NHIỆT KHÍ", items: ["Single Tower", "Dual Tower", "Topflow", "Low profile", "ARGB"] },
    { title: "AIO", items: ["AIO 120", "AIO 240", "AIO 280", "AIO 360", "LCD Screen"] },
    { title: "FAN", items: ["Fan PWM", "Fan ARGB", "Fan Reverse", "Hub fan", "Phụ kiện fan"] },
  ],
  "ram-ssd": [
    { title: "RAM", items: ["DDR4 3200", "DDR4 3600", "DDR5 5200", "DDR5 6000", "RAM RGB"] },
    { title: "SSD", items: ["SSD SATA", "SSD NVMe Gen3", "SSD NVMe Gen4", "SSD NVMe Gen5", "SSD 2TB+"] },
    { title: "HDD", items: ["HDD 1TB", "HDD 2TB", "HDD 4TB", "HDD NAS", "HDD Enterprise"] },
    { title: "THẺ NHỚ", items: ["MicroSD", "SD Card", "CFexpress", "USB 3.2", "USB-C"] },
    { title: "LƯU TRỮ", items: ["Dock SSD", "Box SSD", "NAS 2 Bay", "NAS 4 Bay", "Phụ kiện lưu trữ"] },
  ],
  "audio-mic-webcam": [
    { title: "LOA", items: ["Loa 2.0", "Loa 2.1", "Soundbar", "Loa Bluetooth", "Loa monitor"] },
    { title: "MICRO", items: ["Mic USB", "Mic XLR", "Mic lavalier", "Arm mic", "Audio interface"] },
    { title: "WEBCAM", items: ["Webcam 1080p", "Webcam 2K", "Webcam 4K", "Webcam stream", "Capture card"] },
    { title: "STREAM", items: ["Stream deck", "Lighting", "Green screen", "Tripod", "Mount"] },
    { title: "PHỤ KIỆN", items: ["Shock mount", "Pop filter", "Cable", "Hub USB", "Adapter"] },
  ],
  monitor: [
    { title: "KÍCH THƯỚC", items: ["24 inch", "27 inch", "32 inch", "34 inch", "43 inch"] },
    { title: "ĐỘ PHÂN GIẢI", items: ["FHD", "2K", "4K", "5K", "Ultrawide"] },
    { title: "TẦN SỐ QUÉT", items: ["75Hz", "120Hz", "144Hz", "180Hz", "240Hz+"] },
    { title: "PANEL", items: ["IPS", "VA", "TN", "OLED", "Mini LED"] },
    { title: "THƯƠNG HIỆU", items: ["ASUS", "MSI", "LG", "DELL", "AOC"] },
  ],
  laptop: [
    { title: "THEO NHU CẦU", items: ["Văn phòng", "Sinh viên", "Đồ họa", "Lập trình", "Đa nhiệm"] },
    { title: "THEO CPU", items: ["Intel Core", "Intel Ultra", "AMD Ryzen", "Snapdragon", "Apple"] },
    { title: "THEO GIÁ", items: ["Dưới 15 triệu", "15-25 triệu", "25-35 triệu", "35-50 triệu", "Trên 50 triệu"] },
    { title: "THEO KÍCH THƯỚC", items: ["13 inch", "14 inch", "15.6 inch", "16 inch", "17 inch"] },
    { title: "THƯƠNG HIỆU", items: ["ASUS", "MSI", "Acer", "Lenovo", "Dell"] },
  ],
  "laptop-gaming": [
    { title: "PHÂN KHÚC", items: ["Esport", "AAA", "Creator", "Thin & Light", "Flagship"] },
    { title: "GPU", items: ["RTX 4050", "RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090"] },
    { title: "MÀN HÌNH", items: ["144Hz", "165Hz", "240Hz", "QHD", "Mini LED"] },
    { title: "THEO HÃNG", items: ["ROG", "TUF", "Legion", "Predator", "Stealth"] },
    { title: "KHUYẾN MÃI", items: ["Tặng RAM", "Tặng SSD", "Tặng chuột", "Tặng balo", "Trả góp 0%"] },
  ],
  keyboard: [
    { title: "BÀN PHÍM CƠ", items: ["TKL", "Full size", "75%", "65%", "60%"] },
    { title: "RAPID TRIGGER", items: ["HE Hall Effect", "8K Polling", "SOCD", "Snap Tap", "Custom"] },
    { title: "SWITCH", items: ["Linear", "Tactile", "Clicky", "Magnetic", "Silent"] },
    { title: "KEYCAP", items: ["PBT", "ABS", "Shine-through", "Profile OEM", "Profile Cherry"] },
    { title: "THƯƠNG HIỆU", items: ["Wooting", "Melgeek", "Logitech", "Drunkdeer", "Monsgeek"] },
  ],
  mouse: [
    { title: "CHUỘT GAMING", items: ["Ergo", "Symmetric", "Ultra light", "Wireless", "Wired"] },
    { title: "POLLING RATE", items: ["1000Hz", "2000Hz", "4000Hz", "8000Hz", "Dongle 8K"] },
    { title: "CẢM BIẾN", items: ["PAW3395", "Focus Pro", "Hero 2", "PixArt", "Custom sensor"] },
    { title: "PAD CHUỘT", items: ["Control", "Speed", "Glass", "XL Deskmat", "Skates"] },
    { title: "THƯƠNG HIỆU", items: ["Razer", "Logitech", "Pulsar", "Lamzu", "Zowie"] },
  ],
  headset: [
    { title: "TAI NGHE", items: ["Over-ear", "On-ear", "IEM", "Wireless", "Gaming"] },
    { title: "MIC", items: ["Có mic", "Tách rời", "Noise cancel", "Boom mic", "USB-C"] },
    { title: "AUDIO", items: ["Stereo", "7.1", "Hi-Res", "DAC amp", "Open-back"] },
    { title: "PHỤ KIỆN", items: ["Ear pad", "Cable", "Dongle", "Case", "Mic filter"] },
    { title: "THƯƠNG HIỆU", items: ["Sennheiser", "Razer", "Logitech", "HyperX", "Sony"] },
  ],
  "desk-chair": [
    { title: "BÀN", items: ["Bàn gaming", "Bàn nâng hạ", "Bàn góc", "Bàn văn phòng", "Bàn gỗ"] },
    { title: "GHẾ", items: ["Ghế công thái học", "Ghế gaming", "Ghế văn phòng", "Ghế lưới", "Ghế da"] },
    { title: "PHỤ KIỆN", items: ["Kê tay", "Gối tựa", "Kê chân", "Bánh xe", "Giá đỡ màn hình"] },
    { title: "SETUP", items: ["Bàn + ghế", "Setup trắng", "Setup đen", "Setup RGB", "Setup streamer"] },
    { title: "DỊCH VỤ", items: ["Lắp đặt", "Bảo trì", "Bảo hành", "Vệ sinh", "Nâng cấp"] },
  ],
  "software-network": [
    { title: "PHẦN MỀM", items: ["Windows", "Office", "Adobe", "Antivirus", "Bản quyền game"] },
    { title: "MẠNG", items: ["Router", "Mesh WiFi", "Switch", "Access point", "LAN card"] },
    { title: "CABLE", items: ["LAN CAT6", "LAN CAT7", "HDMI", "DisplayPort", "USB-C"] },
    { title: "LẮP ĐẶT", items: ["Cấu hình mạng", "Kéo dây", "Căn chỉnh", "Đo sóng", "Bảo trì"] },
    { title: "DOANH NGHIỆP", items: ["Server nhỏ", "NAS", "VPN", "Cloud backup", "Bảo mật"] },
  ],
  accessories: [
    { title: "PHỤ KIỆN PC", items: ["Hub USB", "Sound card", "Capture card", "Giá đỡ", "Led strip"] },
    { title: "PHỤ KIỆN LAPTOP", items: ["Đế tản nhiệt", "Dock", "Sạc", "Túi chống sốc", "Giá đỡ"] },
    { title: "PHỤ KIỆN GAME", items: ["Grip", "Skates", "Switch phím", "Lube", "Keycap"] },
    { title: "PHỤ KIỆN STREAM", items: ["Ring light", "Boom arm", "Tripod", "Backdrop", "Cable"] },
    { title: "PHỤ KIỆN DI ĐỘNG", items: ["Pin dự phòng", "Cáp sạc", "Củ sạc", "OTG", "Adapter"] },
  ],
  controller: [
    { title: "TAY CẦM", items: ["Xbox", "PlayStation", "Switch", "PC wireless", "PC wired"] },
    { title: "RACING", items: ["Vô lăng", "Pedal", "Shifter", "Handbrake", "Cockpit"] },
    { title: "FLIGHT", items: ["Joystick", "Throttle", "Yoke", "Rudder", "Mount"] },
    { title: "RETRO", items: ["Arcade stick", "Fight pad", "Retro pad", "Adapter", "USB receiver"] },
    { title: "PHỤ KIỆN", items: ["Cáp sạc", "Grip", "Case", "Nút thay", "Giá đỡ"] },
  ],
  service: [
    { title: "DỊCH VỤ BUILD", items: ["Build theo nhu cầu", "Build theo ngân sách", "Build theo game", "Build theo công việc", "Build nhanh 24h"] },
    { title: "BẢO HÀNH", items: ["1 đổi 1", "Bảo hành tại nhà", "Bảo hành mở rộng", "Hỗ trợ online", "Tra cứu serial"] },
    { title: "VỆ SINH - BẢO TRÌ", items: ["Vệ sinh PC", "Thay keo tản nhiệt", "Cable management", "Căn chỉnh fan", "Test nhiệt độ"] },
    { title: "NÂNG CẤP", items: ["Nâng cấp RAM", "Nâng cấp SSD", "Nâng cấp VGA", "Nâng cấp PSU", "Nâng cấp tản nhiệt"] },
    { title: "HỖ TRỢ", items: ["Tư vấn cấu hình", "Remote support", "Cài đặt driver", "Tối ưu FPS", "Sao lưu dữ liệu"] },
  ],
};

const megaTitleByKey = {
  "pc-ai": "PC Gaming",
  "main-cpu-vga": "Linh kiện",
  "case-psu-cooler": "Linh kiện",
  "ram-ssd": "Linh kiện",
  "audio-mic-webcam": "Linh kiện",
  monitor: "Màn hình",
  laptop: "Laptop",
  "laptop-gaming": "Laptop",
  keyboard: "Bàn phím",
  mouse: "Chuột",
  headset: "Tai nghe",
  "desk-chair": "Gaming Gear",
  "software-network": "Linh kiện",
  accessories: "Linh kiện",
  controller: "Gaming Gear",
  service: "Linh kiện",
};

const normalizeMenuText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const buildMegaProductLink = (groupKey, entryLabel) => {
  const params = new URLSearchParams();
  const titleByGroup = {
    "pc-ai": "PC Gaming",
    "main-cpu-vga": "Linh kien",
    "case-psu-cooler": "Linh kien",
    "ram-ssd": "Linh kien",
    "audio-mic-webcam": "Gaming Gear",
    monitor: "Man hinh",
    laptop: "Laptop",
    "laptop-gaming": "Laptop",
    keyboard: "Ban phim",
    mouse: "Chuot",
    headset: "Tai nghe",
    "desk-chair": "Gaming Gear",
    "software-network": "Linh kien",
    accessories: "Linh kien",
    controller: "Gaming Gear",
    service: "Linh kien",
  };
  const title = titleByGroup[groupKey] || "San pham";
  const rawEntry = String(entryLabel || "").trim();
  const normalizedEntry = normalizeMenuText(rawEntry);

  params.set("title", title);

  if (groupKey === "pc-ai") {
    // Du lieu seed hien tai co khung gia PC khong dong deu.
    // De tranh click menu xong ra trang trong, cac muc "PC theo gia" se ve list PC tong.
    if (normalizedEntry.includes("trieu")) {
      return `/products?${params.toString()}`;
    }

    if (normalizedEntry.includes("rtx 5000")) {
      params.set("search", "RTX 50");
      return `/products?${params.toString()}`;
    }
    if (normalizedEntry.includes("rtx 4000")) {
      params.set("search", "RTX 40");
      return `/products?${params.toString()}`;
    }
    if (normalizedEntry.includes("rtx 3000")) {
      params.set("search", "RTX 30");
      return `/products?${params.toString()}`;
    }
    if (normalizedEntry.includes("gtx 2000")) {
      params.set("search", "GTX");
      return `/products?${params.toString()}`;
    }
    if (normalizedEntry.includes("chip intel")) {
      params.set("search", "Intel");
      return `/products?${params.toString()}`;
    }
    if (normalizedEntry.includes("pc amd")) {
      params.set("search", "AMD");
      return `/products?${params.toString()}`;
    }
  }

  if (groupKey === "main-cpu-vga") {
    if (normalizedEntry.includes("cpu intel")) {
      params.set("title", "CPU");
      params.set("search", "Intel");
    } else if (normalizedEntry.includes("cpu amd")) {
      params.set("title", "CPU");
      params.set("search", "Ryzen");
    } else if (normalizedEntry.includes("vga nvidia")) {
      params.set("title", "Card man hinh");
      params.set("search", "RTX");
    } else if (normalizedEntry.includes("vga amd")) {
      params.set("title", "Card man hinh");
      params.set("search", "RX");
    } else if (normalizedEntry.includes("mainboard")) {
      params.set("title", "Mainboard");
      params.set("search", "Mainboard");
    }
  }

  return `/products?${params.toString()}`;
};

const buildMegaCategoryLink = (groupKey) => {
  const params = new URLSearchParams();

  const titleByGroup = {
    "pc-ai": "PC Gaming",
    "main-cpu-vga": "Linh kien",
    "case-psu-cooler": "Linh kien",
    "ram-ssd": "Linh kien",
    "audio-mic-webcam": "Gaming Gear",
    monitor: "Man hinh",
    laptop: "Laptop",
    "laptop-gaming": "Laptop",
    keyboard: "Ban phim",
    mouse: "Chuot",
    headset: "Tai nghe",
    "desk-chair": "Gaming Gear",
    "software-network": "Linh kien",
    accessories: "Linh kien",
    controller: "Gaming Gear",
    service: "Linh kien",
  };

  params.set("title", titleByGroup[groupKey] || "San pham");
  return `/products?${params.toString()}`;
};

const mapCartDrawerItems = (items = []) =>
  items.map((item) => ({
    id: item.id ?? item.cart_item_id ?? item.product_id,
    productId: item.product_id ?? item.productId ?? item.id,
    name: item.product_name ?? item.name ?? "Sản phẩm",
    image: item.image_url || item.image || "",
    price: Number(item.price ?? item.unit_price ?? 0),
    quantity: Number(item.quantity ?? item.qty ?? 1),
  }));

const FALLBACK_SEARCH_IMAGE = "/vite.svg";
const QUICK_CART_DRAWER_ENABLED =
  String(import.meta.env.VITE_QUICK_CART_DRAWER_ENABLED || "1").trim() === "1";

const mapSearchItems = (items = []) =>
  items.map((item) => ({
    id: item.id,
    name: String(item.name || "Sản phẩm").trim(),
    productCode: String(item.product_code || "").trim() || "SP-N/A",
    price: Number(item.price || 0),
    image: toAbsoluteImageUrl(item.image_url || item.image || "") || FALLBACK_SEARCH_IMAGE,
  }));

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [activeMegaKey, setActiveMegaKey] = useState("pc-ai");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const cartDrawerOpenedByUserRef = useRef(false);
  const megaMenuRef = useRef(null);
  const searchWrapRef = useRef(null);
  const cartDrawerRef = useRef(null);

  const activeMegaColumns = useMemo(
    () => megaBoardByKey[activeMegaKey] ?? megaBoardByKey["pc-ai"],
    [activeMegaKey]
  );

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
        0
      ),
    [cartItems]
  );

  const trimmedSearchKeyword = useMemo(() => String(searchKeyword || "").trim(), [searchKeyword]);

  const handleSearchSubmit = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (!trimmedSearchKeyword) {
        setIsSearchOpen(false);
        return;
      }
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(trimmedSearchKeyword)}`);
    },
    [navigate, trimmedSearchKeyword]
  );

  const handleSearchSelect = useCallback(
    (productId) => {
      setIsSearchOpen(false);
      setSearchKeyword("");
      navigate(`/product/${productId}`);
    },
    [navigate]
  );

  useEffect(() => {
    const keyword = trimmedSearchKeyword;
    if (keyword.length < 2) {
      setSearchLoading(false);
      setSearchResults([]);
      setIsSearchOpen(false);
      return undefined;
    }

    let isActive = true;
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetchProducts({
          search: keyword,
          status: "active",
          page: 1,
          limit: 6,
        });

        if (!isActive) return;
        setSearchResults(mapSearchItems(response?.data || []));
        setIsSearchOpen(true);
      } catch {
        if (!isActive) return;
        setSearchResults([]);
        setIsSearchOpen(true);
      } finally {
        if (isActive) {
          setSearchLoading(false);
        }
      }
    }, 260);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [trimmedSearchKeyword]);

  const loadCartSnapshot = useCallback(async () => {
    if (isAdmin) {
      setCartItems([]);
      return;
    }

    try {
      setLoadingCart(true);
      const data = await fetchCart(token);
      setCartItems(mapCartDrawerItems(data));
    } catch {
      setCartItems([]);
    } finally {
      setLoadingCart(false);
    }
  }, [isAdmin, token]);

  const openCartDrawer = useCallback(() => {
    if (isAdmin) return;
    if (!QUICK_CART_DRAWER_ENABLED) {
      navigate("/cart");
      return;
    }
    cartDrawerOpenedByUserRef.current = true;
    setIsCartDrawerOpen((prev) => !prev);
    loadCartSnapshot();
  }, [isAdmin, loadCartSnapshot, navigate]);

  const closeCartDrawer = useCallback(() => {
    cartDrawerOpenedByUserRef.current = false;
    setIsCartDrawerOpen(false);
  }, []);

  const handleOpenCartPage = useCallback(() => {
    closeCartDrawer();
    navigate("/cart");
  }, [closeCartDrawer, navigate]);

  const handleCheckoutNow = useCallback(() => {
    closeCartDrawer();
    navigate("/checkout");
  }, [closeCartDrawer, navigate]);

  const handleRemoveDrawerItem = useCallback(
    async (itemId) => {
      try {
        await removeCartItemApi(itemId, token);
        await loadCartSnapshot();
      } catch {
        // ignore remove errors in quick drawer
      }
    },
    [loadCartSnapshot, token]
  );

  useEffect(() => {
    loadCartSnapshot();
  }, [loadCartSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onCartUpdated = () => {
      loadCartSnapshot();
    };

    window.addEventListener("pc-store:cart-updated", onCartUpdated);
    return () => {
      window.removeEventListener("pc-store:cart-updated", onCartUpdated);
    };
  }, [loadCartSnapshot]);

  useEffect(() => {
    if (!QUICK_CART_DRAWER_ENABLED) {
      setIsCartDrawerOpen(false);
    }
  }, []);

  useEffect(() => {
    cartDrawerOpenedByUserRef.current = false;
    setIsCartDrawerOpen(false);
  }, []);

  useEffect(() => {
    cartDrawerOpenedByUserRef.current = false;
    setIsCartDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isCartDrawerOpen) return;
    if (cartDrawerOpenedByUserRef.current) return;
    setIsCartDrawerOpen(false);
  }, [isCartDrawerOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!megaMenuRef.current?.contains(event.target)) {
        setIsMegaOpen(false);
      }
      if (!searchWrapRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (isCartDrawerOpen && !cartDrawerRef.current?.contains(event.target)) {
        closeCartDrawer();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMegaOpen(false);
        setIsCartDrawerOpen(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeCartDrawer, isCartDrawerOpen]);

  useEffect(() => {
    if (!isCartDrawerOpen || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCartDrawerOpen]);

  useEffect(() => {
    if (!isCartDrawerOpen || typeof window === "undefined") return undefined;
    const closeOnViewportAction = () => closeCartDrawer();
    window.addEventListener("resize", closeOnViewportAction);
    window.addEventListener("scroll", closeOnViewportAction, { passive: true });
    window.addEventListener("wheel", closeOnViewportAction, { passive: true });
    return () => {
      window.removeEventListener("resize", closeOnViewportAction);
      window.removeEventListener("scroll", closeOnViewportAction);
      window.removeEventListener("wheel", closeOnViewportAction);
    };
  }, [closeCartDrawer, isCartDrawerOpen]);

  return (
    <header className="site-header">
      <div className="site-header-top">
        <div className="container mx-auto site-header-top-inner">
          <div className="site-meta-line">
            <span>
              <img src={iconPhone} alt="Phone" className="site-icon-img" />
              HOTLINE: 1900.XXXX
            </span>
            <span>
              <img src={iconLocation} alt="Location" className="site-icon-img" />
              SHOWROOM: TP.HCM
            </span>
          </div>

          <div className="site-meta-line">
            <span>
              <img src={iconShipping} alt="Shipping" className="site-icon-img" />
              GIAO HÀNG SIÊU TỐC TRONG 2H
            </span>
            <span>
              <img src={iconClock} alt="Clock" className="site-icon-img" />
              MỞ CỬA: 08:30 - 21:00
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto site-header-main">
        <Link to="/" className="site-logo" aria-label="KAH Gaming">
          <strong>KAH</strong>
          <small>GAMING</small>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          <div ref={megaMenuRef} className={`site-nav-mega-wrap ${isMegaOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="site-nav-link site-nav-mega-trigger"
              aria-haspopup="menu"
              aria-expanded={isMegaOpen}
              onClick={() => setIsMegaOpen((prev) => !prev)}
            >
              <img src={iconCategory} alt="Menu" className="site-nav-menu-icon" />
              DANH MỤC
              <span className="site-nav-caret">▾</span>
            </button>

            {isMegaOpen && (
              <div className="site-mega-menu">
                <aside className="site-mega-sidebar">
                  <div className="site-mega-sidebar-select-wrap">
                    <select
                      className="site-mega-sidebar-select"
                      value={activeMegaKey}
                      onChange={(event) => setActiveMegaKey(event.target.value)}
                    >
                      {megaSidebarItems.map((item) => (
                        <option key={`select-${item.key}`} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {megaSidebarItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`site-mega-sidebar-item ${activeMegaKey === item.key ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveMegaKey(item.key)}
                      onClick={() => {
                        setActiveMegaKey(item.key);
                        setIsMegaOpen(false);
                        navigate(buildMegaCategoryLink(item.key));
                      }}
                    >
                      <span>{item.label}</span>
                      <span aria-hidden="true">›</span>
                    </button>
                  ))}
                </aside>

                <section className="site-mega-board">
                  {activeMegaColumns.map((column) => (
                    <div key={`${activeMegaKey}-${column.title}`} className="site-mega-board-col">
                      <p>{column.title}</p>
                      <ul>
                        {column.items.map((entry) => (
                          <li key={`${column.title}-${entry}`}>
                            <Link
                              to={buildMegaProductLink(activeMegaKey, entry)}
                              onClick={() => setIsMegaOpen(false)}
                            >
                              {entry}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>

          {navItems.map((item, index) => (
            <Link key={`${item.label}-${item.to}-${index}`} to={item.to} className="site-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          ref={searchWrapRef}
          className="site-search-wrap"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <img src={iconSearch} alt="Search" className="site-search-icon-img" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            onFocus={() => {
              if (trimmedSearchKeyword.length >= 2) {
                setIsSearchOpen(true);
              }
            }}
            aria-label="Tìm kiếm sản phẩm"
          />

          {isSearchOpen ? (
            <div className="site-search-dropdown">
              {searchLoading ? (
                <p className="site-search-state">Đang tìm sản phẩm...</p>
              ) : searchResults.length === 0 ? (
                <p className="site-search-state">Không tìm thấy sản phẩm phù hợp.</p>
              ) : (
                <>
                  <div className="site-search-list">
                    {searchResults.map((item) => (
                      <button
                        key={`search-${item.id}`}
                        type="button"
                        className="site-search-item"
                        onClick={() => handleSearchSelect(item.id)}
                      >
                        <img src={item.image} alt={item.name} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>Mã: {item.productCode}</small>
                        </span>
                        <em>{formatVnd(item.price)}</em>
                      </button>
                    ))}
                  </div>

                  <button type="submit" className="site-search-more">
                    Xem tất cả kết quả
                  </button>
                </>
              )}
            </div>
          ) : null}
        </form>

        <div className="site-actions">
          <button
            type="button"
            className="site-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? "☀" : "☾"}
          </button>

          {isAuthenticated ? (
            <>
              <Link to={isAdmin ? "/admin/dashboard" : "/profile"}>
                <img src={iconUser} alt="User" className="site-action-icon" />
                {isAdmin ? "QUẢN TRỊ" : "TÀI KHOẢN"}
              </Link>
              {!isAdmin && (
                <button type="button" onClick={openCartDrawer}>
                  <img src={iconCart} alt="Cart" className="site-action-icon" />
                  GIỎ HÀNG
                  {cartItemCount > 0 ? (
                    <span className="site-cart-count">{cartItemCount}</span>
                  ) : null}
                </button>
              )}
              <Link
                to="/login"
                onClick={(event) => {
                  event.preventDefault();
                  logout();
                  navigate("/login");
                }}
              >
                ĐĂNG XUẤT
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <img src={iconUser} alt="User" className="site-action-icon" />
                TÀI KHOẢN
              </Link>
              <button type="button" onClick={openCartDrawer}>
                <img src={iconCart} alt="Cart" className="site-action-icon" />
                GIỎ HÀNG
                {cartItemCount > 0 ? (
                  <span className="site-cart-count">{cartItemCount}</span>
                ) : null}
              </button>
            </>
          )}
        </div>
      </div>

      {QUICK_CART_DRAWER_ENABLED && isCartDrawerOpen ? (
        <>
          <div
            className={`site-cart-overlay ${isCartDrawerOpen ? "is-open" : ""}`}
            onClick={closeCartDrawer}
            aria-hidden={!isCartDrawerOpen}
          />

          <aside
            ref={cartDrawerRef}
            className={`site-cart-drawer ${isCartDrawerOpen ? "is-open" : ""}`}
            aria-hidden={!isCartDrawerOpen}
          >
            <header className="site-cart-drawer-head">
              <h3>Giỏ hàng</h3>
              <button type="button" onClick={closeCartDrawer} aria-label="Đóng giỏ hàng">
                x
              </button>
            </header>

            <div className="site-cart-drawer-body">
              {loadingCart ? (
                <p className="site-cart-empty">Đang tải giỏ hàng...</p>
              ) : cartItems.length === 0 ? (
                <p className="site-cart-empty">Chưa có sản phẩm trong giỏ.</p>
              ) : (
                cartItems.map((item) => (
                  <article key={`${item.id}-${item.productId}`} className="site-cart-row">
                    <button
                      type="button"
                      className="site-cart-thumb-btn"
                      onClick={() => {
                        closeCartDrawer();
                        navigate(`/product/${item.productId}`);
                      }}
                    >
                      <img src={item.image} alt={item.name} />
                    </button>

                    <div className="site-cart-info">
                      <p className="site-cart-name">{item.name}</p>
                      <span className="site-cart-meta">
                        {Math.max(1, Number(item.quantity || 1))} x {formatVnd(item.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="site-cart-remove"
                      onClick={() => handleRemoveDrawerItem(item.id)}
                    >
                      x
                    </button>
                  </article>
                ))
              )}
            </div>

            <footer className="site-cart-drawer-foot">
              <div className="site-cart-total">
                <span>Tổng phụ:</span>
                <strong>{formatVnd(cartSubtotal)}</strong>
              </div>
              <button type="button" className="is-ghost" onClick={handleOpenCartPage}>
                Xem giỏ hàng
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={handleCheckoutNow}
                disabled={cartItems.length === 0}
              >
                Thanh toán
              </button>
            </footer>
          </aside>
        </>
      ) : null}
    </header>
  );
}
