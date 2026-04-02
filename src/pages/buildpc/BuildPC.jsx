import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildBottomBanners,
  buildPartCatalog,
  gearCatalogList,
  formatCurrency,
  linhKienCatalogList,
  monitorCatalogList,
  pcCatalogList,
} from "../../data/storeData";
import iconMonitor from "../../assets/images/PC/ICON/monitor.png";
import iconKeyboard from "../../assets/images/PC/ICON/keyboard.png";
import iconMouse from "../../assets/images/PC/ICON/mouse.png";
import iconMousePad from "../../assets/images/PC/ICON/mouse (1).png";
import iconHeadphone from "../../assets/images/PC/ICON/headphones.png";
import iconSpeaker from "../../assets/images/PC/ICON/woofer.png";
import iconChair from "../../assets/images/PC/ICON/chair.png";
import iconDesk from "../../assets/images/PC/ICON/computer.png";
import iconWebcam from "../../assets/images/PC/ICON/webcam.png";
import iconMic from "../../assets/images/PC/ICON/Microphone-1--Streamline-Ultimate.png";
import iconStream from "../../assets/images/PC/ICON/social-media.png";
import iconMount from "../../assets/images/PC/ICON/motion-graphic.png";
import iconSoftware from "../../assets/images/PC/ICON/terminal.png";
import "./BuildPC.css";

const builderGuideGroups = [
  {
    title: "Muc tieu build",
    items: ["Esports / FPS cao", "AAA 2K - 4K", "Edit video / stream", "Render / workstation"],
  },
  {
    title: "Loi the",
    items: ["Tong gia realtime", "Chon theo tung hang muc", "De mo rong ve sau", "Phu hop layout ban"],
  },
  {
    title: "Check nhanh",
    items: ["Main + CPU dong socket", "RAM dung the he", "PSU du cong suat", "Case hop tan nhiet"],
  },
];

const builderServiceCards = [
  {
    title: "Build sach se",
    text: "Di day, test nhiet do, cap nhat driver truoc khi giao.",
  },
  {
    title: "Tinh tong gia ngay",
    text: "Moi thay doi linh kien deu cap nhat tong chi phi lap dat.",
  },
  {
    title: "Toi uu theo nhu cau",
    text: "Co the chot nhanh gaming, stream, workstation hoac da nhiem.",
  },
  {
    title: "Ho tro sau ban",
    text: "Nhan vien co the xem lai cau hinh de nang cap ve sau.",
  },
];

const buildExtraRows = [
  {
    id: "extra-monitor",
    label: "Man hinh phu",
    caption: "Mo rong khong gian stream / dashboard",
    icon: iconMonitor,
    price: 3_490_000,
  },
  {
    id: "extra-keyboard",
    label: "Ban phim",
    caption: "Rapid trigger hoac co layout gon",
    icon: iconKeyboard,
    price: 1_790_000,
  },
  {
    id: "extra-mouse",
    label: "Chuot gaming",
    caption: "Polling rate cao, trong luong nhe",
    icon: iconMouse,
    price: 1_390_000,
  },
  {
    id: "extra-mousepad",
    label: "Lot chuot",
    caption: "Control pad / speed pad cho setup",
    icon: iconMousePad,
    price: 390_000,
  },
  {
    id: "extra-headphone",
    label: "Tai nghe",
    caption: "On-ear hoac IEM cho gaming va voice chat",
    icon: iconHeadphone,
    price: 2_490_000,
  },
  {
    id: "extra-speaker",
    label: "Loa may tinh",
    caption: "2.0 / 2.1 de giai tri va monitor am thanh",
    icon: iconSpeaker,
    price: 1_250_000,
  },
  {
    id: "extra-chair",
    label: "Ghe gaming",
    caption: "Ho tro setup ngoi lau, gap lung on dinh",
    icon: iconChair,
    price: 4_290_000,
  },
  {
    id: "extra-desk",
    label: "Ban may tinh",
    caption: "Mat ban rong cho dual monitor va loa",
    icon: iconDesk,
    price: 3_990_000,
  },
  {
    id: "extra-webcam",
    label: "Webcam",
    caption: "1080p / 2K cho hop online va stream",
    icon: iconWebcam,
    price: 1_190_000,
  },
  {
    id: "extra-mic",
    label: "Microphone",
    caption: "Mic USB de chat voice va record",
    icon: iconMic,
    price: 2_150_000,
  },
  {
    id: "extra-stream",
    label: "Stream / studio",
    caption: "Dong goi arm mic, light va phu kien nho",
    icon: iconStream,
    price: 2_990_000,
  },
  {
    id: "extra-mount",
    label: "Gia treo man hinh",
    caption: "Giai phong mat ban va gom setup gon hon",
    icon: iconMount,
    price: 1_490_000,
  },
  {
    id: "extra-software",
    label: "Phan mem",
    caption: "Windows, Office hoac bo phan mem co ban",
    icon: iconSoftware,
    price: 2_390_000,
  },
];

const createDefaultSelection = () =>
  buildPartCatalog.reduce((acc, part) => {
    acc[part.key] = 0;
    return acc;
  }, {});

const createDefaultExtras = () =>
  buildExtraRows.reduce((acc, item) => {
    acc[item.id] = false;
    return acc;
  }, {});

const totalCoreChoices = buildPartCatalog.reduce(
  (sum, part) => sum + part.items.length,
  0
);

export default function BuildPC() {
  const [selectedByPart, setSelectedByPart] = useState(createDefaultSelection);
  const [selectedExtras, setSelectedExtras] = useState(createDefaultExtras);

  const selectedParts = useMemo(
    () =>
      buildPartCatalog.map((part) => {
        const selectedIndex = selectedByPart[part.key] ?? 0;
        const safeIndex =
          ((selectedIndex % part.items.length) + part.items.length) % part.items.length;

        return {
          ...part,
          selectedIndex: safeIndex,
          selectedItem: part.items[safeIndex],
        };
      }),
    [selectedByPart]
  );

  const subtotal = useMemo(
    () => selectedParts.reduce((total, part) => total + part.selectedItem.price, 0),
    [selectedParts]
  );

  const activeExtras = useMemo(
    () => buildExtraRows.filter((item) => selectedExtras[item.id]),
    [selectedExtras]
  );

  const extrasTotal = useMemo(
    () => activeExtras.reduce((total, item) => total + item.price, 0),
    [activeExtras]
  );

  const assemblyFee = 290_000;
  const total = subtotal + extrasTotal + assemblyFee;

  const mostExpensivePart = useMemo(
    () =>
      selectedParts.reduce((largest, current) =>
        current.selectedItem.price > largest.selectedItem.price ? current : largest
      ),
    [selectedParts]
  );

  const performancePreset = useMemo(() => {
    if (total >= 60_000_000) {
      return {
        label: "Flagship creator rig",
        description: "Du suc cho AAA, render, stream va du phong nang cap.",
      };
    }

    if (total >= 38_000_000) {
      return {
        label: "Balanced gaming / stream",
        description: "Can bang giua FPS cao, edit co ban va su on dinh nhiet do.",
      };
    }

    return {
      label: "Value-first gaming build",
      description: "Toi uu chi phi nhung van de mo rong cho cac dot nang cap tiep theo.",
    };
  }, [total]);

  const cyclePartItem = (partKey, step) => {
    setSelectedByPart((prev) => {
      const targetPart = buildPartCatalog.find((part) => part.key === partKey);
      if (!targetPart) return prev;

      const current = prev[partKey] ?? 0;
      const next =
        (current + step + targetPart.items.length) % targetPart.items.length;

      return {
        ...prev,
        [partKey]: next,
      };
    });
  };

  const toggleExtra = (extraId) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [extraId]: !prev[extraId],
    }));
  };

  const scrollToBuilder = () => {
    if (typeof document === "undefined") return;

    document
      .getElementById("build-configurator")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="build-page">
      <div className="build-shell">
        <section className="build-hero">
          <div className="build-hero-copy">
            <p className="build-eyebrow">Custom rig studio</p>
            <h1>Build PC theo nhu cau, chot tong gia ngay tren giao dien.</h1>
            <p className="build-hero-text">
              Giao dien nay duoc doi sang dang configurator ro tung buoc: chon
              linh kien core, them phu kien setup va theo doi tong chi phi theo
              thoi gian thuc.
            </p>

            <div className="build-hero-actions">
              <button
                type="button"
                className="build-cta build-cta-primary"
                onClick={scrollToBuilder}
              >
                Bat dau build
              </button>
              <Link to="/products" className="build-cta build-cta-secondary">
                Xem sản phẩm có sẵn
              </Link>
            </div>
          </div>

          <div className="build-hero-card">
            <div className="build-hero-stat-grid">
              <article>
                <p>Core parts</p>
                <strong>{selectedParts.length}</strong>
                <span>hang muc bat buoc</span>
              </article>
              <article>
                <p>Lua chon</p>
                <strong>{totalCoreChoices}</strong>
                <span>option trong catalog</span>
              </article>
              <article>
                <p>Extras</p>
                <strong>{activeExtras.length}</strong>
                <span>phu kien dang bat</span>
              </article>
              <article>
                <p>Lap dat</p>
                <strong>{formatCurrency(assemblyFee)}</strong>
                <span>phi build co dinh</span>
              </article>
            </div>

            <div className="build-hero-focus">
              <p>Preset dang dat duoc</p>
              <h2>{performancePreset.label}</h2>
              <span>{performancePreset.description}</span>
            </div>
          </div>
        </section>

        <section className="build-layout" id="build-configurator">
          <aside className="build-sidebar">
            <article className="build-side-panel">
              <div className="build-section-head">
                <p className="build-section-kicker">Guide</p>
                <h2>Cach dung builder</h2>
              </div>

              <div className="build-side-stack">
                {builderGuideGroups.map((group) => (
                  <div key={group.title} className="build-guide-block">
                    <h3>{group.title}</h3>
                    <div className="build-chip-list">
                      {group.items.map((item) => (
                        <span key={`${group.title}-${item}`}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="build-side-panel">
              <div className="build-section-head">
                <p className="build-section-kicker">Shortcut</p>
                <h2>Danh muc lien quan</h2>
              </div>

              <div className="build-link-list">
                <Link to="/category/pc-gaming">PC</Link>
                <Link to="/products">RAM</Link>
                <Link to="/products">VGA</Link>
                <Link to="/products">COOLING</Link>
                <Link to="/products">SSD / PSU</Link>
              </div>
            </article>

            <article className="build-side-panel build-side-panel-accent">
              <p className="build-price-label">Tong tam tinh hien tai</p>
              <strong>{formatCurrency(total)}</strong>
              <span>
                Bao gom linh kien core, extras dang bat va phi lap dat co ban.
              </span>
            </article>
          </aside>

          <main className="build-main">
            <section className="build-stage">
              <header className="build-stage-head">
                <div className="build-section-head">
                  <p className="build-section-kicker">Configurator</p>
                  <h2>Chon tung linh kien core</h2>
                </div>

                <div className="build-stage-meta">
                  <p>Hang muc dat nhat</p>
                  <strong>{mostExpensivePart.label}</strong>
                  <span>{formatCurrency(mostExpensivePart.selectedItem.price)}</span>
                </div>
              </header>

              <div className="build-part-list">
                {selectedParts.map((part, index) => (
                  <article key={part.key} className="build-part-card">
                    <div className="build-part-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="build-part-media">
                      <img src={part.selectedItem.icon} alt={part.label} />
                    </div>

                    <div>
                      <div className="build-part-topline">
                        <p>{part.label}</p>
                        <span>
                          {part.selectedIndex + 1}/{part.items.length}
                        </span>
                      </div>
                      <h3>{part.selectedItem.name}</h3>
                      <div className="build-part-meta">
                        <strong>{formatCurrency(part.selectedItem.price)}</strong>
                        <small>{part.items.length} lua chon trong muc nay</small>
                      </div>
                    </div>

                    <div className="build-part-actions">
                      <button
                        type="button"
                        className="build-part-action is-ghost"
                        onClick={() => cyclePartItem(part.key, -1)}
                        aria-label={`Chon lua chon truoc cho ${part.label}`}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="build-part-action"
                        onClick={() => cyclePartItem(part.key, 1)}
                        aria-label={`Chon lua chon tiep theo cho ${part.label}`}
                      >
                        Next
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="build-extra-section">
              <header className="build-section-head">
                <p className="build-section-kicker">Setup add-ons</p>
                <h2>Them phu kien, studio va noi that</h2>
              </header>

              <div className="build-extra-grid">
                {buildExtraRows.map((item) => {
                  const isActive = Boolean(selectedExtras[item.id]);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`build-extra-card ${isActive ? "is-active" : ""}`}
                      onClick={() => toggleExtra(item.id)}
                      aria-pressed={isActive}
                    >
                      <div className="build-extra-icon">
                        <img src={item.icon} alt={item.label} />
                      </div>

                      <div className="build-extra-content">
                        <div className="build-extra-topline">
                          <p>{item.label}</p>
                          <span>{isActive ? "Da them" : "Tuy chon"}</span>
                        </div>
                        <small>{item.caption}</small>
                        <strong>{formatCurrency(item.price)}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </main>

          <aside className="build-summary">
            <div className="build-summary-stack">
              <section className="build-summary-card">
                <div className="build-section-head">
                  <p className="build-section-kicker">Realtime summary</p>
                  <h2>Tong cau hinh</h2>
                </div>

                <div className="build-summary-list">
                  {selectedParts.map((part) => (
                    <div key={`sum-${part.key}`} className="build-summary-line">
                      <p>{part.label}</p>
                      <span>{formatCurrency(part.selectedItem.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="build-summary-subsection">
                  <div className="build-summary-subtitle">
                    <p>Extras da chon</p>
                    <span>{activeExtras.length}</span>
                  </div>

                  {activeExtras.length > 0 ? (
                    <div className="build-summary-list is-compact">
                      {activeExtras.map((item) => (
                        <div key={`extra-${item.id}`} className="build-summary-line">
                          <p>{item.label}</p>
                          <span>{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="build-summary-empty">
                      Chua them phu kien nao cho setup nay.
                    </div>
                  )}
                </div>

                <div className="build-summary-totals">
                  <div className="build-summary-line">
                    <p>Core subtotal</p>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="build-summary-line">
                    <p>Extras</p>
                    <span>{formatCurrency(extrasTotal)}</span>
                  </div>
                  <div className="build-summary-line">
                    <p>Lap dat</p>
                    <span>{formatCurrency(assemblyFee)}</span>
                  </div>
                </div>

                <div className="build-total">
                  <p>Tong cong</p>
                  <strong>{formatCurrency(total)}</strong>
                  <span>
                    Gia tham khao cho giao dien demo, chua tinh uu dai theo dot.
                  </span>
                </div>

                <div className="build-summary-actions">
                  <button type="button" className="build-summary-button is-primary">
                    Dat cau hinh nay
                  </button>
                  <Link to="/products" className="build-summary-button is-secondary">
                    Tham khao bo may co san
                  </Link>
                </div>
              </section>

              <section className="build-summary-card is-muted">
                <div className="build-section-head">
                  <p className="build-section-kicker">Workflow</p>
                  <h2>Nhanh va gon</h2>
                </div>

                <ul className="build-summary-note-list">
                  <li>Chot cau hinh core truoc, them extras sau.</li>
                  <li>Uu tien VGA, CPU va PSU neu ban build cho gaming.</li>
                  <li>Voi stream / editor, can nhac them monitor phu va mic.</li>
                </ul>
              </section>
            </div>
          </aside>
        </section>

        <section className="build-service-strip">
          {builderServiceCards.map((card) => (
            <article key={card.title} className="build-service-card">
              <p>{card.title}</p>
              <span>{card.text}</span>
            </article>
          ))}
        </section>

        <section className="build-catalog-section">
          <article className="build-catalog-card">
            <header>
              <p>DANH SACH PC</p>
              <h3>PC de ban</h3>
            </header>
            <div className="build-catalog-list">
{pcCatalogList.map((item) => (
                <Link key={item.id} to={item.href || "/products"} className="build-catalog-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="build-catalog-card">
            <header>
              <p>DANH SACH GEAR</p>
              <h3>Gear gaming</h3>
            </header>
            <div className="build-catalog-list">
{gearCatalogList.map((item) => (
                <Link key={item.id} to={item.href || "/products"} className="build-catalog-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="build-catalog-card">
            <header>
              <p>DANH SACH LINH KIEN</p>
              <h3>CPU / RAM / SSD / PSU</h3>
            </header>
            <div className="build-catalog-list">
{linhKienCatalogList.map((item) => (
                <Link key={item.id} to={item.href || "/build-pc"} className="build-catalog-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="build-catalog-card">
            <header>
              <p>MAN HINH</p>
              <h3>144HZ den 540HZ</h3>
            </header>
            <div className="build-catalog-list">
              {monitorCatalogList.map((item) => (
                <Link key={item.id} to={item.href || "/products"} className="build-catalog-item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.subtitle} | {formatCurrency(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="build-showcase-grid">
          {buildBottomBanners.filter(Boolean).map((image, index) => (
            <article
              key={`build-banner-${index}`}
              className={`build-showcase-card ${index === 0 ? "is-featured" : ""}`}
            >
              <img src={image} alt={`Build banner ${index + 1}`} />
              <div className="build-showcase-overlay">
                <p>{index === 0 ? "Build inspiration" : "Setup moodboard"}</p>
                <strong>
                  {index === 0
                    ? "Visual direction cho khu build"
                    : `Goc nhin ${index + 1} cho giao dien`}
                </strong>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
