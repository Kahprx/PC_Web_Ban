import { Link, useParams } from "react-router-dom";
import { BLOG_POSTS, getBlogBySlug } from "../../data/blogData";
import "../shared/PageBlocks.css";
import "./ContentPages.css";

export default function BlogDetail() {
  const { slug } = useParams();
  const post = getBlogBySlug(slug);

  if (!post) {
    return (
      <div className="page-shell">
        <section className="page-empty-state">
          <h2>Không tìm thấy bài viết</h2>
          <p>Bài viết có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.</p>
          <div className="page-actions">
            <Link to="/blog" className="page-btn">
              Quay lại trang tin tức
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const relatedPosts = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <div className="page-shell">
      <section className="content-article">
        <img className="content-article__cover" src={post.coverImage} alt={post.title} />
        <div className="content-article__body">
          <div className="content-meta">
            <span className="content-chip">{post.category}</span>
            <span className="content-chip">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</span>
            <span className="content-chip">{post.readMinutes} phút đọc</span>
          </div>

          <h1 className="page-title">{post.title}</h1>
          <p className="page-subtitle">{post.excerpt}</p>

          {post.content.map((paragraph, index) => (
            <p key={`${post.id}-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="page-panel">
        <div className="page-panel-header">
          <div>
            <p className="page-panel-kicker">Đọc tiếp</p>
            <h2>Bài viết liên quan</h2>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: "12px" }}>
          {relatedPosts.map((item) => (
            <article key={item.id} className="content-card">
              <Link to={`/blog/${item.slug}`} className="content-card__thumb">
                <img src={item.coverImage} alt={item.title} />
              </Link>
              <div className="content-card__body">
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <div className="page-actions">
                  <Link to={`/blog/${item.slug}`} className="page-btn-outline">
                    Xem bài viết
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
