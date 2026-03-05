import "../shared/PageBlocks.css";

export default function ChangePassword() {
  return (
    <div className="page-shell">
      <section className="page-section">
        <h1 className="page-title">Đổi mật khẩu</h1>
        <p className="page-subtitle">Để bảo mật tài khoản, hãy chọn mật khẩu mạnh và không dùng lại mật khẩu cũ.</p>
      </section>

      <section className="page-form-card">
        <form className="page-form" onSubmit={(event) => event.preventDefault()}>
          <div className="page-field">
            <label>Mật khẩu hiện tại</label>
            <input type="password" placeholder="Nhập mật khẩu hiện tại" />
          </div>
          <div className="page-field">
            <label>Mật khẩu mới</label>
            <input type="password" placeholder="Nhập mật khẩu mới" />
          </div>
          <div className="page-field">
            <label>Nhập lại mật khẩu mới</label>
            <input type="password" placeholder="Nhập lại mật khẩu mới" />
          </div>

          <div className="page-actions">
            <button type="submit" className="page-btn">CẬP NHẬT MẬT KHẨU</button>
          </div>
        </form>
      </section>
    </div>
  );
}
