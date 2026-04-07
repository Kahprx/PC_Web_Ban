import { Link } from "react-router-dom";
import "../shared/PageBlocks.css";

const coreValues = [
  {
    title: "Cấu hình đúng nhu cầu",
    text: "Không ép cấu hình dư thừa. Mỗi bộ máy được tư vấn theo mục tiêu sử dụng thật: gaming, đồ họa, học tập hay làm việc.",
  },
  {
    title: "Linh kiện rõ nguồn gốc",
    text: "Sản phẩm có mã hàng, hóa đơn và chính sách bảo hành minh bạch để khách hàng dễ tra cứu sau mua.",
  },
  {
    title: "Hỗ trợ sau bán hàng",
    text: "Theo dõi trạng thái đơn, hỗ trợ bảo hành và kiểm tra thanh toán online từ backend để xử lý nhanh và rõ ràng.",
  },
];

export default function About() {
  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Giới thiệu</p>
          <h1 className="page-title">KAH Gaming - Build máy đúng, dùng bền, hỗ trợ thật.</h1>
          <p className="page-subtitle">
            Chúng tôi tập trung vào trải nghiệm mua hàng rõ ràng, dữ liệu sản phẩm minh bạch và quy trình vận hành đồng bộ
            frontend/backend.
          </p>

          <div className="page-hero-actions">
            <Link to="/build-pc" className="page-btn">
              Build PC ngay
            </Link>
            <Link to="/contact" className="page-btn-outline">
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>

      <section className="page-highlight-grid">
        {coreValues.map((value) => (
          <article key={value.title} className="page-highlight-card">
            <p>{value.title}</p>
            <span>{value.text}</span>
          </article>
        ))}
      </section>

      <section className="page-panel">
        <div className="page-panel-header">
          <div>
            <p className="page-panel-kicker">Thông tin công ty</p>
            <h2>Cam kết vận hành</h2>
          </div>
        </div>

        <div className="page-note-list" style={{ marginTop: "10px" }}>
          <li>Đồng bộ giỏ hàng, đơn hàng, trạng thái thanh toán giữa frontend và backend.</li>
          <li>Tra cứu bảo hành theo mã đơn và sản phẩm cụ thể ngay trên website.</li>
          <li>Hỗ trợ liên hệ và phản hồi qua biểu mẫu trực tuyến đã kết nối API.</li>
        </div>
      </section>
    </div>
  );
}
