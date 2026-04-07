import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../../data/blogData";
import "../shared/PageBlocks.css";
import "./ContentPages.css";

export default function Blog() {
  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Tin tức / Blog</p>
          <h1 className="page-title">Cập nhật kiến thức build PC và công nghệ mới.</h1>
          <p className="page-subtitle">
            Chuyên mục chia sẻ hướng dẫn chọn linh kiện, tối ưu hiệu năng và kinh nghiệm mua hàng.
          </p>
        </div>
      </section>

      <section className="content-grid">
        {BLOG_POSTS.map((post) => (
          <article key={post.id} className="content-card">
            <Link to={`/blog/${post.slug}`} className="content-card__thumb">
              <img src={post.coverImage} alt={post.title} />
            </Link>

            <div className="content-card__body">
              <div className="content-meta">
                <span className="content-chip">{post.category}</span>
                <span className="content-chip">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</span>
                <span className="content-chip">{post.readMinutes} phút đọc</span>
              </div>

              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>

              <div className="page-actions">
                <Link to={`/blog/${post.slug}`} className="page-btn">
                  Đọc chi tiết
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
