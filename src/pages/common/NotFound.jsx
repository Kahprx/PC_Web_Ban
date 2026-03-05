import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <section className="notfound-page">
      <div className="notfound-card">
        <h1>404</h1>
        <p>Trang ban tim khong ton tai.</p>
        <Link to="/user">Ve trang chu</Link>
      </div>
    </section>
  );
}
