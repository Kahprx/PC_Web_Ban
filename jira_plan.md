# Kế Hoạch Quản Lý Dự Án Jira (Bổ sung đầy đủ theo yêu cầu mới)

Theo yêu cầu bổ sung của đồ án:
- **Cấu trúc Component**: Frontend, Backend, Database, Testing, Deploy.
- **Workflow Tùy Chỉnh**: `To Do` → `In Progress` → `Review Code` → `Done`. Nếu tìm thấy lỗi (Bug), task/story phải được quay trở lại trạng thái `In Progress` (Hoặc thêm trạng thái `Re-open`).
- **Lỗi (Bugs)**: Quản lý ít nhất 5 Log lỗi.
- **Tích hợp**: Cần kết nối Jira với GitHub. Mọi Github Commit đều kèm Key task.

---

## 1. Cấu Trúc Components Trên Jira
Hãy tạo **Components** trong dự án Jira và gán các Task/Bugs tương ứng vào:
1. **Frontend**: Giao diện, UI/UX, Component React/Vue.
2. **Backend**: Logic API, Authentication, Payment Gateway.
3. **Database**: CRUD logic, thiết kế Schema, tối ưu câu query SQL.
4. **Testing**: Các task tạo Unit Test hoặc ghi nhận Log Bug.
5. **Deploy**: Đóng gói Docker, Cấu hình CI/CD, thiết lập AWS/Azure/Salesforce.

---

## 2. Danh Sách 5 Bugs Hệ Thống (Yêu Cầu Bài 4)

Hãy thêm 5 task dạng **Bug** vào dự án và gán vào các Component để Tester/SV test báo cáo lỗi:

| Key | Tên Bug (Issue Summary) | Độ Ưu Tiên | Component Kèm Theo | Assignee xử lý | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BUG-01 | Lỗi vỡ giao diện (Layout vỡ) trên màn hình iPhone 14 Pro Max | Medium | Frontend | SV2 | In Progress |
| BUG-02 | Crash trắng trang khi người dùng chuyển hướng tới Giỏ Hàng rỗng | High | Frontend | SV3 | To Do |
| BUG-03 | API `/auth/login` không trả về Token dù nhập đúng tài khoản/mật khẩu | Highest | Backend, Database | SV1 | Review Code |
| BUG-04 | Dữ liệu tính Toán giỏ hàng bị sai sai số thập phân (Lỗi float) | High | Backend, Testing | SV3 | To Do |
| BUG-05 | Lỗi không gửi được mail biên lai tới khách hàng sau khi thanh toán | Medium | Backend, Deploy | SV4 | In Progress |

---

## 3. Bảng Chi Tiết Epic, Story và Task (Cập Nhật)

*(Gồm 10 Epics, 20 Stories, 42 Tasks - gắn thêm Component)*

| Epic | Key | Task/Subtask (Kèm Component) | Assignee | Nhanh nhánh Github Gợi ý |
| :--- | :--- | :--- | :--- | :--- |
| **Epic 1: Auth** | TASK-01 | Thiết kế giao diện form Login & Register [Frontend] | SV1 | `feature/auth/login-ui` |
| | TASK-02 | Viết API `/api/auth/login` và `/register` [Backend] | SV1 | `feature/auth/login-api` |
| | TASK-03 | Thiết kế UI trang thông tin cá nhân [Frontend] | SV1 | `feature/profile/ui` |
| | TASK-04 | Đổi mật khẩu & Cập nhật TT [Backend, Database] | SV1 | `feature/profile/api` |
| **Epic 2: Product** | TASK-05 | Thiết kế UI danh sách sản phẩm (Grid View) [Frontend] | SV2 | `feature/product/list-ui` |
| | TASK-06 | Tích hợp API lấy DSSP ra Home [Frontend, Backend] | SV2 | `feature/product/fetch-list` |
| | TASK-07 | Dựng UI trang Chi tiết sản phẩm [Frontend] | SV2 | `feature/product/detail-ui` |
| | TASK-08 | Logic chọn biến thể SP (Size, Màu) [Frontend] | SV2 | `feature/product/variants` |
| **Epic 3: Cart** | TASK-09 | Thiết lập State (Redux/Zustand) cho Cart [Frontend] | SV3 | `feature/cart/state-setup` |
| | TASK-10 | Viết hàm "Add to Cart" + Toast [Frontend] | SV3 | `feature/cart/add-action` |
| | TASK-11 | Xử lý tăng/giảm số lượng SP [Frontend] | SV3 | `feature/cart/update-qty` |
| | TASK-12 | Xử lý logic xóa SP khỏi giỏ [Frontend] | SV3 | `feature/cart/remove-item` |
| **Epic 4: Payment**| TASK-13 | Dựng UI form nhập thông tin địa chỉ [Frontend] | SV4 | `feature/payment/shipping-ui` |
| | TASK-14 | Validate dữ liệu giao hàng [Frontend, Testing] | SV4 | `feature/payment/validation` |
| | TASK-15 | Tích hợp API cổng thanh toán VNPay/Stripe [Backend] | SV4 | `feature/payment/gateway` |
| | TASK-16 | Xử lý kết quả Callback thanh toán [Backend] | SV4 | `feature/payment/callback` |
| | TASK-17 | Hiển thị Lỗi/Thành công thanh toán [Frontend] | SV4 | `feature/payment/status-ui` |
| **Epic 5: Order** | TASK-18 | DB Schema cho Đơn hàng SQL/MongoDB [Database] | SV4 | `feature/order/schema` |
| | TASK-19 | API lưu đơn hàng (`POST /orders`) [Backend] | SV4 | `feature/order/create-api` |
| | TASK-20 | Màn hình Lịch sử đơn hàng [Frontend] | SV4 | `feature/order/history-ui` |
| | TASK-21 | API fetch và tracking đơn hàng [Backend] | SV4 | `feature/order/fetch-api` |
| **Epic 6: Search** | TASK-22 | Search Box ở thanh Header [Frontend] | SV2 | `feature/search/box-ui` |
| | TASK-23 | Thuật toán Search Text Regex [Backend, Database] | SV2 | `feature/search/logic` |
| | TASK-24 | Dựng Filter Sidebar (Giá/Tags) [Frontend] | SV2 | `feature/filter/sidebar` |
| | TASK-25 | Đồng bộ Filter URL Query [Frontend] | SV2 | `feature/filter/url-sync` |
| **Epic 7: Review** | TASK-26 | Form viết Review & Chấm sao [Frontend] | SV3 | `feature/review/form-ui` |
| | TASK-27 | API lưu text Review [Backend, Database] | SV3 | `feature/review/save-api` |
| | TASK-28 | Render list Review trong Chi tiết SP [Frontend] | SV3 | `feature/review/list-ui` |
| | TASK-29 | Auth chỉ User đã mua mới đc Review [Backend] | SV3 | `feature/review/authorization` |
| **Epic 8: Voucher**| TASK-30 | UI Input mã giảm giá Checkout [Frontend] | SV3 | `feature/voucher/input-ui` |
| | TASK-31 | API check Voucher & Tính total [Backend] | SV3 | `feature/voucher/apply-api` |
| | TASK-32 | Carousel Banner trang Home [Frontend] | SV2 | `feature/banner/carousel` |
| | TASK-33 | Load banner Data từ CMS [Backend] | SV2 | `feature/banner/fetch-api` |
| **Epic 9: Admin** | TASK-34 | Phân quyền Backend (User/Admin) [Backend] | SV1 | `feature/admin/role-auth` |
| | TASK-35 | Layout Dashboard thống kê [Frontend] | SV1 | `feature/admin/dashboard-ui` |
| | TASK-36 | Form CRUD quản lý kho hàng, Sản phẩm [Frontend] | SV1 | `feature/admin/crud-product` |
| | TASK-37 | Upload ảnh lên Cloudinary [Deploy, Backend] | SV1 | `feature/admin/upload-image` |
| | TASK-38 | Unit Test mock chức năng Inventory [Testing] | Leader | `feature/testing/inventory` |
| **Epic 10: System**| TASK-39 | Thư viện Nodemailer gửi Email [Backend] | SV4 | `feature/notify/email-setup` |
| | TASK-40 | Auto gửi Email Receipt Confirm [Backend] | SV4 | `feature/notify/order-email` |
| | TASK-41 | Render Bell Notification UI [Frontend] | SV4 | `feature/notify/bell-ui` |
| | TASK-42 | Build Docker Image & Deploy AWS [Deploy] | Leader | `feature/deploy/docker-aws` |

---

## 4. Workflow Jira Nâng Cao (Quản lý Bug)

Khi thành viên lập trình xong, trạng thái của Task chuyển sang **Review Code**.
- Đạt chuẩn -> Bấm vào **Done**.
- Nếu Leader hoặc Tester test ra lỗi -> Comment vào Task -> Chỉnh Status kéo lùi về cột **In Progress** (Thêm comment ghi rõ lỗi: "Bug tại form không validate email").
- Tích hợp Git: Bạn yêu cầu SV code xong khi commit phải gắn Tag (VD: `git commit -m "TASK-14: Thêm validator cho form"`). Hành động này cho phép Leader click vào Task trên Jira và thấy luôn chính xác commit code nằm ở đâu trên Github!
