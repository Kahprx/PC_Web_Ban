import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import iconPhone from "../assets/images/PC/ICON/phone-call.png";
import iconLocation from "../assets/images/PC/ICON/location.png";
import iconShipping from "../assets/images/PC/ICON/delivery-truck.png";
import iconClock from "../assets/images/PC/ICON/clock.png";
import iconCategory from "../assets/images/PC/ICON/category.png";
import iconSearch from "../assets/images/PC/ICON/search.png";
import iconUser from "../assets/images/PC/ICON/user.png";
import iconCart from "../assets/images/PC/ICON/shopping-cart.png";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/build-pc", label: "BUILD PC" },
  { to: "/products?title=LAPTOP", label: "LAPTOP" },
  { to: "/products?title=LINH%20KIEN", label: "LINH KIEN" },
  { to: "/products?title=MAN%20HINH", label: "MAN HINH" },
  { to: "/products?title=GAMING%20GEAR", label: "GAMING GEAR" },
];

const megaSidebarItems = [
  { key: "pc-ai", label: "PC AI" },
  { key: "main-cpu-vga", label: "Main, CPU, VGA" },
  { key: "case-psu-cooler", label: "Case, Nguon, Tan" },
  { key: "ram-ssd", label: "O cung, Ram, The nho" },
  { key: "audio-mic-webcam", label: "Loa, Micro, Webcam" },
  { key: "monitor", label: "Man hinh" },
  { key: "laptop", label: "Laptop" },
  { key: "laptop-gaming", label: "Laptop gaming" },
  { key: "keyboard", label: "Ban phim" },
  { key: "mouse", label: "Chuot + pad chuot" },
  { key: "headset", label: "Tai nghe" },
  { key: "desk-chair", label: "Ban - ghe" },
  { key: "software-network", label: "Phan mem, mang" },
  { key: "accessories", label: "Phu kien" },
  { key: "controller", label: "Tay cam" },
  { key: "service", label: "Dich vu thong tin them" },
];

const megaBoardByKey = {
  "pc-ai": [
    {
      title: "PC THEO GIA",
      items: [
        "PC duoi 30 trieu",
        "PC tu 30 - 50 trieu",
        "PC tu 50 - 70 trieu",
        "PC tu 70 - 100 trieu",
        "PC tu 100 - 200 trieu",
        "PC tren 200 trieu",
      ],
    },
    {
      title: "PC THEO NHU CAU",
      items: ["PC Esport", "PC Game AAA", "PC do hoa", "PC van phong", "PC stream game"],
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
      title: "PC THEO KHUYEN MAI",
      items: ["PC tang man", "PC AIO max setting", "PC tam cao setting", "PC tang qua", "PC tang gear"],
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
    { title: "NGUON", items: ["650W Bronze", "750W Bronze", "850W Gold", "1000W Gold", "1200W Platinum"] },
    { title: "TAN NHIET KHI", items: ["Single Tower", "Dual Tower", "Topflow", "Low profile", "ARGB"] },
    { title: "AIO", items: ["AIO 120", "AIO 240", "AIO 280", "AIO 360", "LCD Screen"] },
    { title: "FAN", items: ["Fan PWM", "Fan ARGB", "Fan Reverse", "Hub fan", "Phu kien fan"] },
  ],
  "ram-ssd": [
    { title: "RAM", items: ["DDR4 3200", "DDR4 3600", "DDR5 5200", "DDR5 6000", "RAM RGB"] },
    { title: "SSD", items: ["SSD SATA", "SSD NVMe Gen3", "SSD NVMe Gen4", "SSD NVMe Gen5", "SSD 2TB+"] },
    { title: "HDD", items: ["HDD 1TB", "HDD 2TB", "HDD 4TB", "HDD NAS", "HDD Enterprise"] },
    { title: "THE NHO", items: ["MicroSD", "SD Card", "CFexpress", "USB 3.2", "USB-C"] },
    { title: "LUU TRU", items: ["Dock SSD", "Box SSD", "NAS 2 Bay", "NAS 4 Bay", "Phu kien luu tru"] },
  ],
  "audio-mic-webcam": [
    { title: "LOA", items: ["Loa 2.0", "Loa 2.1", "Soundbar", "Loa Bluetooth", "Loa monitor"] },
    { title: "MICRO", items: ["Mic USB", "Mic XLR", "Mic lavalier", "Arm mic", "Audio interface"] },
    { title: "WEBCAM", items: ["Webcam 1080p", "Webcam 2K", "Webcam 4K", "Webcam stream", "Capture card"] },
    { title: "STREAM", items: ["Stream deck", "Lighting", "Green screen", "Tripod", "Mount"] },
    { title: "PHU KIEN", items: ["Shock mount", "Pop filter", "Cable", "Hub USB", "Adapter"] },
  ],
  monitor: [
    { title: "KICH THUOC", items: ["24 inch", "27 inch", "32 inch", "34 inch", "43 inch"] },
    { title: "DO PHAN GIAI", items: ["FHD", "2K", "4K", "5K", "Ultrawide"] },
    { title: "TAN SO QUET", items: ["75Hz", "120Hz", "144Hz", "180Hz", "240Hz+"] },
    { title: "PANEL", items: ["IPS", "VA", "TN", "OLED", "Mini LED"] },
    { title: "THUONG HIEU", items: ["ASUS", "MSI", "LG", "DELL", "AOC"] },
  ],
  laptop: [
    { title: "THEO NHU CAU", items: ["Van phong", "Sinh vien", "Do hoa", "Lap trinh", "Da nhiem"] },
    { title: "THEO CPU", items: ["Intel Core", "Intel Ultra", "AMD Ryzen", "Snapdragon", "Apple"] },
    { title: "THEO GIA", items: ["Duoi 15 trieu", "15-25 trieu", "25-35 trieu", "35-50 trieu", "Tren 50 trieu"] },
    { title: "THEO KICH THUOC", items: ["13 inch", "14 inch", "15.6 inch", "16 inch", "17 inch"] },
    { title: "THUONG HIEU", items: ["ASUS", "MSI", "Acer", "Lenovo", "Dell"] },
  ],
  "laptop-gaming": [
    { title: "PHAN KHUC", items: ["Esport", "AAA", "Creator", "Thin & Light", "Flagship"] },
    { title: "GPU", items: ["RTX 4050", "RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090"] },
    { title: "MAN HINH", items: ["144Hz", "165Hz", "240Hz", "QHD", "Mini LED"] },
    { title: "THEO HANG", items: ["ROG", "TUF", "Legion", "Predator", "Stealth"] },
    { title: "KHUYEN MAI", items: ["Tang RAM", "Tang SSD", "Tang chuot", "Tang balo", "Tra gop 0%"] },
  ],
  keyboard: [
    { title: "BAN PHIM CO", items: ["TKL", "Full size", "75%", "65%", "60%"] },
    { title: "RAPID TRIGGER", items: ["HE Hall Effect", "8K Polling", "SOCD", "Snap Tap", "Custom"] },
    { title: "SWITCH", items: ["Linear", "Tactile", "Clicky", "Magnetic", "Silent"] },
    { title: "KEYCAP", items: ["PBT", "ABS", "Shine-through", "Profile OEM", "Profile Cherry"] },
    { title: "THUONG HIEU", items: ["Wooting", "Melgeek", "Logitech", "Drunkdeer", "Monsgeek"] },
  ],
  mouse: [
    { title: "CHUOT GAMING", items: ["Ergo", "Symmetric", "Ultra light", "Wireless", "Wired"] },
    { title: "POLLING RATE", items: ["1000Hz", "2000Hz", "4000Hz", "8000Hz", "Dongle 8K"] },
    { title: "CAM BIEN", items: ["PAW3395", "Focus Pro", "Hero 2", "PixArt", "Custom sensor"] },
    { title: "PAD CHUOT", items: ["Control", "Speed", "Glass", "XL Deskmat", "Skates"] },
    { title: "THUONG HIEU", items: ["Razer", "Logitech", "Pulsar", "Lamzu", "Zowie"] },
  ],
  headset: [
    { title: "TAI NGHE", items: ["Over-ear", "On-ear", "IEM", "Wireless", "Gaming"] },
    { title: "MIC", items: ["Co mic", "Tach roi", "Noise cancel", "Boom mic", "USB-C"] },
    { title: "AUDIO", items: ["Stereo", "7.1", "Hi-Res", "DAC amp", "Open-back"] },
    { title: "PHU KIEN", items: ["Ear pad", "Cable", "Dongle", "Case", "Mic filter"] },
    { title: "THUONG HIEU", items: ["Sennheiser", "Razer", "Logitech", "HyperX", "Sony"] },
  ],
  "desk-chair": [
    { title: "BAN", items: ["Ban gaming", "Ban nang ha", "Ban goc", "Ban van phong", "Ban go"] },
    { title: "GHE", items: ["Ghe cong thai hoc", "Ghe gaming", "Ghe van phong", "Ghe luoi", "Ghe da"] },
    { title: "PHU KIEN", items: ["Ke tay", "Goi tua", "Ke chan", "Banh xe", "Gia do man hinh"] },
    { title: "SETUP", items: ["Ban + ghe", "Setup trang", "Setup den", "Setup RGB", "Setup streamer"] },
    { title: "DICH VU", items: ["Lap dat", "Bao tri", "Bao hanh", "Ve sinh", "Nang cap"] },
  ],
  "software-network": [
    { title: "PHAN MEM", items: ["Windows", "Office", "Adobe", "Antivirus", "Ban quyen game"] },
    { title: "MANG", items: ["Router", "Mesh WiFi", "Switch", "Access point", "LAN card"] },
    { title: "CABLE", items: ["LAN CAT6", "LAN CAT7", "HDMI", "DisplayPort", "USB-C"] },
    { title: "LAP DAT", items: ["Cau hinh mang", "Keo day", "Can chinh", "Do song", "Bao tri"] },
    { title: "DOANH NGHIEP", items: ["Server nho", "NAS", "VPN", "Cloud backup", "Bao mat"] },
  ],
  accessories: [
    { title: "PHU KIEN PC", items: ["Hub USB", "Sound card", "Capture card", "Giá do", "Led strip"] },
    { title: "PHU KIEN LAPTOP", items: ["De tan nhiet", "Dock", "Sac", "Tui chong soc", "Gia do"] },
    { title: "PHU KIEN GAME", items: ["Grip", "Skates", "Switch phim", "Lube", "Keycap"] },
    { title: "PHU KIEN STREAM", items: ["Ring light", "Boom arm", "Tripod", "Backdrop", "Cable"] },
    { title: "PHU KIEN DI DONG", items: ["Pin du phong", "Cap sac", "Cu sac", "OTG", "Adapter"] },
  ],
  controller: [
    { title: "TAY CAM", items: ["Xbox", "PlayStation", "Switch", "PC wireless", "PC wired"] },
    { title: "RACING", items: ["Volang", "Pedal", "Shifter", "Handbrake", "Cockpit"] },
    { title: "FLIGHT", items: ["Joystick", "Throttle", "Yoke", "Rudder", "Mount"] },
    { title: "RETRO", items: ["Arcade stick", "Fight pad", "Retro pad", "Adapter", "USB receiver"] },
    { title: "PHU KIEN", items: ["Cap sac", "Grip", "Case", "Nut thay", "Gia do"] },
  ],
  service: [
    { title: "DICH VU BUILD", items: ["Build theo nhu cau", "Build theo ngan sach", "Build theo game", "Build theo cong viec", "Build nhanh 24h"] },
    { title: "BAO HANH", items: ["1 doi 1", "Bao hanh tai nha", "Bao hanh mo rong", "Ho tro online", "Tra cuu serial"] },
    { title: "VE SINH - BAO TRI", items: ["Ve sinh PC", "Thay keo tan nhiet", "Cable management", "Can chinh fan", "Test nhiet do"] },
    { title: "NANG CAP", items: ["Nang cap RAM", "Nang cap SSD", "Nang cap VGA", "Nang cap PSU", "Nang cap tan nhiet"] },
    { title: "HO TRO", items: ["Tu van cau hinh", "Remote support", "Cai dat driver", "Toi uu FPS", "Sao luu du lieu"] },
  ],
};

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [activeMegaKey, setActiveMegaKey] = useState("pc-ai");
  const megaMenuRef = useRef(null);

  const activeMegaColumns = useMemo(
    () => megaBoardByKey[activeMegaKey] ?? megaBoardByKey["pc-ai"],
    [activeMegaKey]
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!megaMenuRef.current?.contains(event.target)) {
        setIsMegaOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMegaOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
              GIAO HANG SIEU TOC TRONG 2H
            </span>
            <span>
              <img src={iconClock} alt="Clock" className="site-icon-img" />
              MO CUA: 08:30 - 21:00
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
              DANH MUC
              <span className="site-nav-caret">▾</span>
            </button>

            {isMegaOpen && (
              <div className="site-mega-menu">
                <aside className="site-mega-sidebar">
                  {megaSidebarItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`site-mega-sidebar-item ${activeMegaKey === item.key ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveMegaKey(item.key)}
                      onClick={() => setActiveMegaKey(item.key)}
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
                          <li key={`${column.title}-${entry}`}>{entry}</li>
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

        <div className="site-search-wrap">
          <img src={iconSearch} alt="Search" className="site-search-icon-img" />
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
        </div>

        <div className="site-actions">
          {isAuthenticated ? (
            <>
              <Link to={isAdmin ? "/admin/dashboard" : "/profile"}>
                <img src={iconUser} alt="User" className="site-action-icon" />
                {isAdmin ? "QUAN TRI" : "TAI KHOAN"}
              </Link>
              {!isAdmin && (
                <Link to="/cart">
                  <img src={iconCart} alt="Cart" className="site-action-icon" />
                  GIỎ HÀNG
                </Link>
              )}
              <Link
                to="/login"
                onClick={(event) => {
                  event.preventDefault();
                  logout();
                  navigate("/login");
                }}
              >
                DANG XUAT
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <img src={iconUser} alt="User" className="site-action-icon" />
                TAI KHOAN
              </Link>
              <Link to="/cart">
                <img src={iconCart} alt="Cart" className="site-action-icon" />
                GIỎ HÀNG
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
