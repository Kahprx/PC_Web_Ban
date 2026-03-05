import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildBottomBanners,
  buildPartCatalog,
  formatCurrency,
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

const createDefaultSelection = () =>
  buildPartCatalog.reduce((acc, part) => {
    acc[part.key] = 0;
    return acc;
  }, {});

const buildExtraRows = [
  { id: "extra-monitor", label: "MAN HINH 2", icon: iconMonitor },
  { id: "extra-keyboard", label: "BAN PHIM", icon: iconKeyboard },
  { id: "extra-mouse", label: "CHUOT MAY TINH", icon: iconMouse },
  { id: "extra-mousepad", label: "LOT CHUOT MAY TINH", icon: iconMousePad },
  { id: "extra-headphone", label: "TAI NGHE", icon: iconHeadphone },
  { id: "extra-speaker", label: "LOA MAY TINH", icon: iconSpeaker },
  { id: "extra-chair", label: "GHE GAMING", icon: iconChair },
  { id: "extra-desk", label: "BAN MAY TINH", icon: iconDesk },
  { id: "extra-webcam", label: "WEBCAM", icon: iconWebcam },
  { id: "extra-mic", label: "MICROPHONE", icon: iconMic },
  { id: "extra-stream", label: "THIET BI STREAM,STUDIO", icon: iconStream },
  { id: "extra-mount", label: "GIA TREO MAN HINH", icon: iconMount },
  { id: "extra-software", label: "PHAN MEM", icon: iconSoftware },
];

export default function BuildPC() {
  const [selectedByPart, setSelectedByPart] = useState(createDefaultSelection);

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
  const assemblyFee = 290_000;
  const total = subtotal + assemblyFee;

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

  return (
    <div className="build-page">
      <div className="build-shell">
        <section className="build-header">
          <h1>BUILD PC</h1>
          <p>Chon linh kien theo nhu cau va xem tong gia realtime.</p>
        </section>

        <section className="build-top-grid">
          <aside className="build-filter-col">
            <article className="build-panel">
              <h3>Danh Muc</h3>
              <div className="build-link-list">
                <Link to="/category/pc-gaming">PC</Link>
                <Link to="/products">RAM</Link>
                <Link to="/products">VGA</Link>
                <Link to="/products">COOLING</Link>
              </div>
            </article>

            <article className="build-panel">
              <h3>Khoang gia</h3>
              <div className="build-price-pill">500,000,000</div>
            </article>

            <article className="build-panel">
              <h3>GPU</h3>
              <div className="build-link-list">
                <button type="button">RTX 5000 SERIES</button>
                <button type="button">RTX 4000 SERIES</button>
                <button type="button">RTX 3000 SERIES</button>
                <button type="button">RX 7000 SERIES</button>
              </div>
            </article>
          </aside>

          <main className="build-main-col">
            <section className="build-parts-box">
              {selectedParts.map((part) => (
                <article key={part.key} className="build-part-row">
                  <div className="build-part-info">
                    <img src={part.selectedItem.icon} alt={part.label} />
                    <div>
                      <p>{part.label}</p>
                      <h3>{part.selectedItem.name}</h3>
                      <span>{formatCurrency(part.selectedItem.price)}</span>
                    </div>
                  </div>

                  <div className="build-part-actions">
                    <button type="button" onClick={() => cyclePartItem(part.key, -1)}>
                      {"<"}
                    </button>
                    <button type="button" onClick={() => cyclePartItem(part.key, 1)}>
                      CHON {">"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </main>

          <aside className="build-summary-col">
            <section className="build-summary-box">
              <h2>TAM TINH</h2>

              <div className="build-summary-list">
                {selectedParts.map((part) => (
                  <div key={`sum-${part.key}`}>
                    <p>{part.label}</p>
                    <span>{formatCurrency(part.selectedItem.price)}</span>
                  </div>
                ))}

                <div>
                  <p>CONG LAP DAT</p>
                  <span>{formatCurrency(assemblyFee)}</span>
                </div>
              </div>

              <div className="build-total">
                <p>TONG CONG</p>
                <strong>{formatCurrency(total)}</strong>
              </div>

              <button type="button" className="build-submit">Dat cau hinh nay</button>
              <Link to="/products" className="build-link">Them vao gio hang</Link>
            </section>
          </aside>
        </section>

        <section className="build-extra-grid">
          <div className="build-extra-box">
            {buildExtraRows.slice(0, 10).map((item, index) => (
              <article
                key={item.id}
                className={`build-extra-row ${index === 0 ? "is-active" : ""}`}
              >
                <div className="build-extra-info">
                  <img src={item.icon} alt={item.label} />
                  <div>
                    <p>{item.label}</p>
                    <small>CHUA CHON</small>
                  </div>
                </div>

                <button type="button" className="build-extra-btn">
                  CHON <span>{">"}</span>
                </button>
              </article>
            ))}

            <div className="build-extra-divider" />

            {buildExtraRows.slice(10).map((item) => (
              <article key={item.id} className="build-extra-row">
                <div className="build-extra-info">
                  <img src={item.icon} alt={item.label} />
                  <div>
                    <p>{item.label}</p>
                    <small>CHUA CHON</small>
                  </div>
                </div>

                <button type="button" className="build-extra-btn">
                  CHON <span>{">"}</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="build-wide-banner">
          <img src={buildBottomBanners[0]} alt="Build wide banner" />
        </section>

        <section className="build-action-bar">
          <button type="button">THEM VAO GIO HANG</button>
          <button type="button">TRA TRUOC 0, GIAO HANG 2H</button>
          <button type="button">XEM VR</button>
          <button type="button">TAI ANH CAU HINH</button>
        </section>

        <section className="build-bottom-banners">
          {buildBottomBanners.map((image, index) => (
            <article key={`build-banner-${index}`}>
              <img src={image} alt={`Build banner ${index + 1}`} />
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
