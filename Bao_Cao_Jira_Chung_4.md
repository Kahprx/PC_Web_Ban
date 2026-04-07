# CHƯƠNG 4: QUẢN TRỊ DỰ ÁN VỚI JIRA (PHƯƠNG PHÁP AGILE/SCRUM)

**Dự án:** PC_Web_Ban  
**Giảng viên/Người hướng dẫn:** [Điền Tên]  
**Nhóm Sinh Viên Thực Hiện:**
- **Kha**: Đảm nhiệm Frontend (UI/UX, React, Tích hợp giao diện)
- **Dũng**: Đảm nhiệm Backend (API, Database, Logic)
**Link Jira Dự Án:** https://kaquach62.atlassian.net/jira/for-you

---

## 1. PHÂN BỔ BACKLOG (10 EPIC, 20 STORY, 42 TASK, 5 BUGS)
Toàn bộ dự án được phân chia chặt chẽ với các mức Priority.

### Thành phần (Components):
Hệ thống sử dụng các Component Jira: `Frontend`, `Backend`, `Database`, `Testing`, `Deploy`.

### CHI TIẾT CÁC TICKET (BACKLOG)

#### Epic 1: Quản lý Tài khoản (Auth)
- **Story 1.1: Đăng nhập & Đăng ký**
  - Task 1: Thiết kế Form Login/Register [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 2: Cài đặt API Auth `/login`, `/register` [Backend] (Priority: High) ➡ **Assign: DŨNG**
- **Story 1.2: User Profile**
  - Task 3: Dựng layout Profile cá nhân người dùng [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 4: Viết API lấy và cập nhật Avatar/Thông tin [Backend] (Priority: Low) ➡ **Assign: DŨNG**

#### Epic 2: Sản Phẩm (Product)
- **Story 2.1: Danh sách sản phẩm**
  - Task 5: Code giao diện dạng Lưới (Grid view) ngoài Homepage [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 6: Schema DB Table Product & Cấu trúc DTO [Database] (Priority: High) ➡ **Assign: DŨNG**
- **Story 2.2: Chi tiết sản phẩm**
  - Task 7: Render thông tin Mô tả, Thuộc tính, Giá [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 8: API Truy xuất chi tiết sản phẩm qua `ID` [Backend] (Priority: High) ➡ **Assign: DŨNG**

#### Epic 3: Giỏ Hàng (Cart)
- **Story 3.1: Quản lý trạng thái Giỏ hàng**
  - Task 9: Setup Zustand/Redux lưu state Giỏ [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 10: Logic API lưu phiên giỏ hàng vào Token DB [Backend] (Priority: Medium) ➡ **Assign: DŨNG**
- **Story 3.2: Thêm/Xoá Sản Phẩm**
  - Task 11: Nút Add-to-cart và thông báo Toast [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 12: API cộng trừ số lượng SP [Backend] (Priority: High) ➡ **Assign: DŨNG**

#### Epic 4: Đơn Hàng (Order)
- **Story 4.1: Nhập thông tin giao hàng**
  - Task 13: UI Form Order Billing Address [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 14: Logic Controller tạo Object Order [Backend] (Priority: High) ➡ **Assign: DŨNG**
- **Story 4.2: Quản lý Lịch sử Đơn hàng**
  - Task 15: Giao diện Tracking Đơn (Pending, Shipping) [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 16: View SQL lấy lịch sử đơn theo User [Database] (Priority: Low) ➡ **Assign: DŨNG**

#### Epic 5: Thanh Toán (Payment)
- **Story 5.1: Cổng Payment API**
  - Task 17: Mockup phương thức Cod / Transfer [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 18: Tích hợp Stripe / VNPay Backend Service [Backend] (Priority: High) ➡ **Assign: DŨNG**
- **Story 5.2: Xử lý Giao Dịch**
  - Task 19: Xử lý UI báo lỗi khi thẻ bị từ chối [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 20: Webhook lắng nghe Callback từ cổng thanh toán [Backend] (Priority: High) ➡ **Assign: DŨNG**

#### Epic 6: Hệ thống Đánh Giá (Review)
- **Story 6.1: Comment và Star Rating**
  - Task 21: UI Form Viết Đánh giá + Chọn 5 sao [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 22: Schema chứa Rating và Relationship User [Database] (Priority: Medium) ➡ **Assign: DŨNG**
- **Story 6.2: Kiểm duyệt đánh giá**
  - Task 23: UI Danh sách Comment bên dưới sản phẩm [Frontend] (Priority: Low) ➡ **Assign: KHA**
  - Task 24: Validate: User phải "Đã mua" mới được bình luận [Testing] (Priority: High) ➡ **Assign: DŨNG**

#### Epic 7: Tìm Kiếm Kỹ Thuật (Search & Filter)
- **Story 7.1: Thanh Search**
  - Task 25: Input Search với auto-suggest [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 26: Xử lý hàm tìm kiếm Fulltext Search [Backend] (Priority: High) ➡ **Assign: DŨNG**
- **Story 7.2: Sidebar Lọc nâng cao**
  - Task 27: UI Filter theo danh mục (Lap, PC, Phụ kiện) [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 28: Logic Backend query nhiều biến (Giá < 10tr, Tag) [Backend] (Priority: Medium) ➡ **Assign: DŨNG**

#### Epic 8: Bảng Ban Quản Trị (Admin Dashboard)
- **Story 8.1: Thống kê doanh thu**
  - Task 29: Dựng Component Chart.js biểu đồ doanh thu [Frontend] (Priority: Low) ➡ **Assign: KHA**
  - Task 30: API Tính tổng doanh thu theo tháng [Backend] (Priority: Medium) ➡ **Assign: DŨNG**
- **Story 8.2: Quản lý Sản Phẩm/User**
  - Task 31: Bảng Giao diện CRUD (Thêm sửa xoá SP) [Frontend] (Priority: High) ➡ **Assign: KHA**
  - Task 32: Phân quyền Authorization JWT Route Admin [Backend] (Priority: High) ➡ **Assign: DŨNG**

#### Epic 9: Marketing & Khuyến Mãi (Vouchers)
- **Story 9.1: Banner Trang Chủ**
  - Task 33: Dựng Slider Banner chạy tự động [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 34: API GET danh sách ảnh banner [Backend] (Priority: Low) ➡ **Assign: DŨNG**
- **Story 9.2: Áp dụng mã Voucher**
  - Task 35: UI Giao diện Input Mã Giảm Giá [Frontend] (Priority: Medium) ➡ **Assign: KHA**
  - Task 36: Logic check điều kiện Voucher hợp lệ [Backend] (Priority: High) ➡ **Assign: DŨNG**

#### Epic 10: Thông Báo & Hệ Thống Core
- **Story 10.1: Email Notify**
  - Task 37: UI Popup chúc mừng đăng ký thành công [Frontend] (Priority: Low) ➡ **Assign: KHA**
  - Task 38: Cấu hình Nodemailer gửi Email Receipt [Backend] (Priority: High) ➡ **Assign: DŨNG**
- **Story 10.2: Bảo Mật & Deploy**
  - Task 39: Cấu hình Cors Header bảo vệ hệ thống [Testing] (Priority: High) ➡ **Assign: DŨNG**
  - Task 40: Đóng gói hệ thống lên Cloud / Docker [Deploy] (Priority: High) ➡ **Assign: DŨNG & KHA**

---

### 🔥 5 TASK BUGS (LỖI) BẮT BUỘC
- BUG 1: Form Đăng Ký không báo màu đỏ khi bỏ trống Email *(Gán qua Component: Frontend)* ➡ **KHA** sửa.
- BUG 2: Người dùng thêm số lượng âm (-5 sản phẩm) vào giỏ hàng *(Gán qua Component: Frontend, Backend)* ➡ **KHA + DŨNG**.
- BUG 3: API Đăng nhập 401 Unauthorized vẫn văng lỗi trắng trang *(Gán qua Component: Testing)* ➡ **KHA** sửa UI Error.
- BUG 4: Tính sai tổng tiền khi áp dụng Voucher phân số *(Gán qua Component: Backend)* ➡ **DŨNG** sửa.
- BUG 5: Admin up ảnh dung lượng 20MB làm sập DB *(Gán qua Component: Backend)* ➡ **DŨNG** thêm chặn Max Size 5MB.

---

## 2. QUY TRÌNH THỰC HIỆN JIRA THỰC TẾ (SCREENSHOT HƯỚNG DẪN)
Do lý do bảo mật tài khoản cá nhân Jira nên bot không thể tự đăng nhập giùm bạn. Hãy **tự thao tác cực nhanh** theo cách sau để chụp ảnh minh chứng điểm tuyệt đối:

### A. Thiết lập Cột Workflow (Bắt buộc theo môn)
1. Trong Jira Project, vào góc phải bấm dấu `...` -> **Board settings** -> **Columns**.
2. Sửa và thêm cột chính xác thành 4 cột: `To Do` | `In Progress` | `Review Code` | `Done`.
3. *(Quy định bắt lỗi)*: Click dời Task BUG từ cột `Review Code` bị đánh trượt kéo ngược về `In Progress` để chứng minh workflow đẩy ngược lỗi tồn tại. *(Nhớ chụp ảnh động thái kéo bảng này)* 📸

### B. Thiếp lập Sprint
1. Vào mục `Backlog`, bấm nút **"Create Sprint"** góc trên bên phải. Nhấn liên tục 8 lần để tạo đủ vòng Sprints (`Sprint 1` đến `Sprint 8`).
2. Cầm chuột kéo thả danh sách Task của **Epic 1** vào Sprint 1, **Epic 2** vào Sprint 2....
3. Bấm nút **Start Sprint**.
> **[CHỤP ẢNH MÀN HÌNH GIAO DIỆN CHỨA BACKLOG VÀ 8 SPRINT MÀ BẠN VỪA TẠO VÀO ĐÂY]**

### C. Connect Github 
1. Trên Github, Leader khi Push code bắt buộc Commmit message chứa mã Jira (Ví dụ `git commit -m "PC-01: fix bug login"`).
2. Jira sẽ tự động link commit đó vào UI Jira, bạn nhấn vào Task PC-01 trên Jira sẽ thấy phần **Development** có hiện thông tin commit. 
> **[CHỤP ẢNH MÀN HÌNH CHỨA COMMITS TRÊN TASK JIRA VÀO ĐÂY ĐỂ ĐẠT ĐIỂM]**
