# Kế Hoạch Quản Lý Dự Án Jira (Agile/Scrum Workspace)

Theo yêu cầu môn học, hệ thống JIRA của dự án (Giả sử làm website E-commerce) được khởi tạo với cấu trúc như sau:
- **Tổng quan**: 10 Epics, 20 Stories, 42 Tasks
- **Thời lượng**: 8 Sprints (1 tuần/sprint)
- **Thành viên**: Leader (Review, Merge), SV1 (Auth/Admin), SV2 (Product), SV3 (Cart/Review), SV4 (Payment/Order)
- **Workflow Jira**: `To Do` → `In Progress` → `Review Code` → `Done`

Dưới đây là Backlog chi tiết để bạn có thể tiến hành nhập vào hệ thống JIRA:

## Bảng Chi Tiết Epic, Story và Task

| Epic | Story | Key | Task/Subtask | Priority | Assignee | Sprint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Epic 1: Quản lý Tài khoản (Auth)** | Story 1.1: Đăng nhập/Đăng ký | TASK-01 | Thiết kế giao diện form Login & Register | High | SV1 | Sprint 1 |
| | | TASK-02 | Viết API `/api/auth/login` và `/register` trên Backend | High | SV1 | Sprint 1 |
| | Story 1.2: Quản lý User Profile | TASK-03 | Thiết kế UI trang thông tin cá nhân | Medium | SV1 | Sprint 1 |
| | | TASK-04 | Viết chức năng cập nhật thông tin và đổi mật khẩu | High | SV1 | Sprint 1 |
| **Epic 2: Quản lý Sản phẩm** | Story 2.1: Hiển thị sản phẩm | TASK-05 | Thiết kế UI danh sách sản phẩm (Grid View) trang chủ | High | SV2 | Sprint 2 |
| | | TASK-06 | Tích hợp API lấy danh sách sản phẩm hiển thị ra Home | High | SV2 | Sprint 2 |
| | Story 2.2: Chi tiết sản phẩm | TASK-07 | Dựng UI trang Chi tiết sản phẩm (Hình ảnh, Mô tả, Giá) | High | SV2 | Sprint 2 |
| | | TASK-08 | Logic chọn biến thể sản phẩm (Size, Màu sắc) | Medium | SV2 | Sprint 2 |
| **Epic 3: Giỏ hàng (Cart)** | Story 3.1: Thêm vào giỏ hàng | TASK-09 | Thiết lập State Management (Redux/Context) cho Cart | High | SV3 | Sprint 3 |
| | | TASK-10 | Viết hàm xử lý nút "Add to Cart" có hiển thị popup/toast | High | SV3 | Sprint 3 |
| | Story 3.2: Cập nhật giỏ hàng | TASK-11 | Xử lý tăng/giảm số lượng sản phẩm trong giỏ | High | SV3 | Sprint 3 |
| | | TASK-12 | Xử lý logic xóa sản phẩm khỏi giỏ hàng | High | SV3 | Sprint 3 |
| **Epic 4: Thanh toán (Payment)** | Story 4.1: Điền thông tin giao hàng | TASK-13 | Dựng UI form nhập thông tin địa chỉ người nhận | High | SV4 | Sprint 4 |
| | | TASK-14 | Validate dữ liệu (Tên, SĐT, Địa chỉ) | Medium | SV4 | Sprint 4 |
| | Story 4.2: Tích hợp thanh toán | TASK-15 | Tích hợp API cổng thanh toán giả lập (Ví dụ: Stripe Sandbox) | High | SV4 | Sprint 4 |
| | | TASK-16 | Xử lý callback trạng thái thanh toán (Thành công) | High | SV4 | Sprint 4 |
| | | TASK-17 | Xử lý hiển thị UI/Lỗi khi thanh toán bị từ chối | Medium | SV4 | Sprint 4 |
| **Epic 5: Quản lý Đơn hàng** | Story 5.1: Lưu trữ đơn hàng | TASK-18 | Thiết kế Database Schema lưu dữ liệu Order (SQL/NoSQL) | High | SV4 | Sprint 5 |
| | | TASK-19 | Viết API lưu đơn hàng vào DB (`POST /api/orders`) | High | SV4 | Sprint 5 |
| | Story 5.2: Theo dõi trạng thái | TASK-20 | Xây dựng màn hình Lịch sử đơn hàng cho Client | High | SV4 | Sprint 5 |
| | | TASK-21 | Viết API lấy danh sách đơn hàng User đã đặt | Medium | SV4 | Sprint 5 |
| **Epic 6: Tìm kiếm & Lọc** | Story 6.1: Thanh tìm kiếm | TASK-22 | Component Search Box ở thanh Header | High | SV2 | Sprint 6 |
| | | TASK-23 | Kết nối thuật toán xử lý Search keywords trên Backend | High | SV2 | Sprint 6 |
| | Story 6.2: Bộ lọc (Filter) | TASK-24 | Dựng Filter Sidebar bên trái màn hình (Lọc Giá/Danh mục) | Medium | SV2 | Sprint 6 |
| | | TASK-25 | Đồng bộ Filter lên URL (Query Parameters) | Medium | SV2 | Sprint 6 |
| **Epic 7: Đánh giá & Bình luận** | Story 7.1: Gửi đánh giá sao | TASK-26 | Dựng Form viết Review và chấm sao tại trang Chi tiết SP | Medium | SV3 | Sprint 7 |
| | | TASK-27 | API lưu text Review vào Collection Database | Medium | SV3 | Sprint 7 |
| | Story 7.2: Hiển thị reviews | TASK-28 | Load và render list những Review từ Backend ra trang UI | Low | SV3 | Sprint 7 |
| | | TASK-29 | Chỉ cho phép User đã mua hàng được quyền viết Review | High | SV3 | Sprint 7 |
| **Epic 8: Khuyến mãi (Voucher)**| Story 8.1: Nhập mã giảm giá | TASK-30 | UI Input mã giảm giá ở màn hình Checkout | Medium | SV3 | Sprint 8 |
| | | TASK-31 | Logic check Voucher và tính lại mức giá Tổng trên Frontend | High | SV3 | Sprint 8 |
| | Story 8.2: Banner quảng cáo | TASK-32 | Component Carousel Banner trên trang chủ Homepage | Low | SV2 | Sprint 2 |
| | | TASK-33 | API lấy danh sách banner đang active từ database | Low | SV2 | Sprint 2 |
| **Epic 9: Bảng Điều Khiển Admin**| Story 9.1: Quản lý người dùng | TASK-34 | Phân quyền Backend Routing middleware (Admin vs User) | High | SV1 | Sprint 8 |
| | | TASK-35 | Layout giao diện CMS hiển thị bảng thông tin Users | Medium | SV1 | Sprint 8 |
| | Story 9.2: Quản lý kho hàng | TASK-36 | Form Thêm/Sửa/Xóa dữ liệu Sản phẩm cho Admin | High | SV1 | Sprint 8 |
| | | TASK-37 | Chức năng tải ảnh sản phẩm lên Cloud (VD: Cloudinary) | Medium | SV1 | Sprint 8 |
| | | TASK-38 | Viết thư viện Unit Test mock chức năng Admin Product | Low | Leader | Sprint 8 |
| **Epic 10: Thông Báo (Notify)** | Story 10.1: Email giao dịch | TASK-39 | Tích hợp thu viện Gửi Email (Nodemailer/SendGrid) | Medium | SV4 | Sprint 8 |
| | | TASK-40 | Auto gửi Email Receipt Confirm khi thanh toán thành công | High | SV4 | Sprint 8 |
| | Story 10.2: Thông báo In-app | TASK-41 | Render nút chuông báo Notification góc trên Header | Low | SV4 | Sprint 8 |
| | | TASK-42 | Deploy dự án Frontend/Backend lên Cloud làm Production | High | Leader | Sprint 8 |

---

## Các Bước Triển Khai Lên Hệ Thống JIRA Thực Tế:

1. **Tạo Project**: 
   - Đăng nhập Jira, chọn `Create Project` (Dạng **Scrum** để quản lý Sprint).
2. **Cấu hình Trạng Thái (Workflow)**: 
   - Ở phần Project Settings -> Board -> Cấu hình các cột (Columns): `To Do` | `In Progress` | `Review Code` | `Done`.
3. **Thêm Thành Viên**: 
   - Mời các thành viên theo danh sách (SV1 -> SV4, Leader).
4. **Tạo Epic & Task**:
   - Ở màn hình **Backlog**, vào thanh Epics. Tạo lần lượt 10 Epics như bảng trên.
   - Bắt đầu tạo Issue cho từng Task. Nhớ gắn tag **Story** / **Task** vào đúng **Epic** cha của nó.
5. **Gán Sprint**:
   - Tạo **Sprint 1** đến **Sprint 8**. Kéo thả các dòng Task tương ứng vào các Sprint theo kế hoạch.
   - Assign người phụ trách & Priority.
6. **Vận hành**:
   - Khởi động (Start) Sprint 1. Bắt đầu làm việc và kéo trạng thái Task sang các cột.

 > [!NOTE]
 > Đặc biệt, theo đề bài yêu cầu: khi **Quy tắc Commit Code Github** được sử dụng, bắt buộc ở message commit, Leader hoặc Tester phải ghi cụ thể Key Jira (VD: `git commit -m "TASK-01: fix UI login form"`). Việc này giúp Jira tự động track công việc dựa trên message commit!
