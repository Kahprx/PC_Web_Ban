# Báo Cáo Đồ Án Cuối Kỳ: Website Bán Linh Kiện Máy Tính Và Xây Dựng Cấu Hình PC

## Trang Bìa
**Tên Đồ Án:** Website Bán Linh Kiện Máy Tính Và Xây Dựng Cấu Hình PC  
**Môn Học:** Công Nghệ Phần Mềm  
**Giảng Viên Hướng Dẫn:** [Tên Giảng Viên]  
**Thành Viên Nhóm:**  
- Nguyễn Văn A (Nhóm Trưởng)  
- Trần Thị B  
- Lê Văn C  
- Phạm Thị D  

**Ngày Nộp:** 7 tháng 4, 2026  

---

## Mục Lục
1. Giới Thiệu Dự Án  
   1.1 Mục Tiêu Dự Án  
   1.2 Phạm Vi Dự Án  
   1.3 Công Cụ Và Công Nghệ Sử Dụng  
   1.4 Phân Công Công Việc  
   1.5 Vai Trò Của AI  
   1.6 Phân Tích Database Schema (ERD)  
   1.7 API Design Chi Tiết  
   1.8 Sequence Diagram / Architecture Diagram  
2. Bài 1: Thiết Kế UI/UX Với Figma  
3. Bài 2: Kiểm Thử Frontend Với Developer Tools  
4. Bài 3: Quản Lý Mã Nguồn Với GitHub  
5. Bài 4: Quản Trị Dự Án Với Jira  
6. Bài 5: Triển Khai Trên Cloud  
7. Kết Luận  
8. Tài Liệu Tham Khảo  

---

## 1. Giới Thiệu Dự Án

### 1.1 Mục Tiêu Dự Án
Dự án PC Store là một hệ thống bán lẻ linh kiện máy tính trực tuyến, được xây dựng bằng công nghệ fullstack bao gồm React cho frontend, Node.js với Express cho backend, và PostgreSQL cho cơ sở dữ liệu. Dự án nhằm cung cấp nền tảng cho người dùng có thể xem, tìm kiếm, và mua linh kiện PC, cũng như công cụ build PC tùy chỉnh.

### 1.2 Phạm Vi Dự Án
- **Frontend:** Giao diện người dùng responsive, bao gồm các trang chính như danh sách sản phẩm (src/pages/product/ProductList.jsx), chi tiết sản phẩm (src/pages/product/ProductDetail.jsx), giỏ hàng (src/pages/cart/Cart.jsx), thanh toán (src/pages/checkout/Checkout.jsx, src/pages/checkout/Confirm.jsx), build PC (src/pages/buildpc/BuildPC.jsx), và quản trị (src/pages/admin/Dashboard.jsx, ProductManager.jsx, OrderManager.jsx).
- **Backend:** API RESTful với xác thực JWT, quản lý sản phẩm, đơn hàng, người dùng, và thống kê (backend/routes/userRoutes.js, productRoutes.js, orderRoutes.js, statsRoutes.js, adminRoutes.js).
- **Database:** Cấu trúc quan hệ với 5 bảng chính: users, categories, products, orders, order_items (backend/models/). Bổ sung bảng product_images và payments tự động trên khởi động backend.
- **Công Nghệ Chính:** React (src/App.jsx), Node.js (backend/server.js), PostgreSQL, Docker (docker-compose.yml), GitHub, Jira.

Các component chính từ src/components/: Header.jsx, Footer.jsx, ProtectedRoute.jsx, SupportChatWidget.jsx.

### 1.3 Công Cụ Và Công Nghệ Sử Dụng
- **Frontend:** React với Vite, CSS, JavaScript.
- **Backend:** Node.js, Express, JWT, Multer cho upload ảnh.
- **Database:** PostgreSQL với schema và seed data.
- **DevOps:** Docker, Docker Compose.
- **Quản Lý:** GitHub cho version control, Jira cho project management, Figma cho UI/UX design.

### 1.4 Phân Công Công Việc
Tất cả thành viên tham gia vào từng hạng mục:
- Nguyễn Văn A: Backend API, Database, DevOps.
- Trần Thị B: Frontend Development, UI/UX Design.
- Lê Văn C: Testing, Documentation, Git Workflow.
- Phạm Thị D: Project Management với Jira, Cloud Deployment.

### 1.5 Vai Trò Của AI
Theo docs/ai-usage-log.md, AI được sử dụng xuyên suốt:
- Generate skeleton code cho React components (src/components/).
- Tối ưu API trong backend/routes/.
- Gợi ý workflow và convention.

Chi tiết vai trò AI trong từng bài sẽ được ghi chú rõ ràng.

### 1.6 Phân Tích Database Schema (ERD)
Dựa trên backend/sql/schema.sql, hệ thống sử dụng PostgreSQL với cấu trúc quan hệ gồm 10 bảng chính:

**Các Bảng Chính và Quan Hệ:**
- **users**: id (PK), full_name, email (UNIQUE), password_hash, role (admin/user), is_active, created_at, updated_at.
- **categories**: id (PK), name, slug (UNIQUE), created_at.
- **products**: id (PK), category_id (FK → categories), product_code (UNIQUE), name, slug (UNIQUE), description, price, stock_qty, image_url, status, created_at, updated_at.
- **product_images**: id (PK), product_id (FK → products), url.
- **orders**: id (PK), user_id (FK → users), total_amount, status (pending/processing/shipping/completed/cancelled), shipping_address, payment_method, created_at, updated_at.
- **order_items**: id (PK), order_id (FK → orders), product_id (FK → products), quantity, unit_price, line_total, created_at. (UNIQUE order_id, product_id)
- **payments**: id (PK), order_id (FK → orders), method, status, created_at, updated_at.
- **cart_items**: id (PK), user_id (FK → users), product_id (FK → products), quantity, created_at, updated_at. (UNIQUE user_id, product_id)
- **password_reset_tokens**: id (PK), user_id (FK → users), token (UNIQUE), expires_at, created_at.
- **wishlists**: (giả định từ routes, tương tự cart_items nhưng cho wishlist).

**Quan Hệ ERD:**
- users 1-N orders
- users 1-N cart_items
- users 1-N password_reset_tokens
- categories 1-N products
- products 1-N product_images
- products 1-N order_items
- products 1-N cart_items (qua wishlist nếu có)
- orders 1-N order_items
- orders 1-1 payments

[Hình ERD: Sơ đồ quan hệ giữa các bảng]  

### 1.7 API Design Chi Tiết
Hệ thống cung cấp RESTful API với Swagger docs tại /api-docs. Dưới đây là các endpoint chính với request/response mẫu:

**Authentication (backend/routes/userRoutes.js):**
- POST /api/users/register: Request {fullName, email, password} → Response {user, token}
- POST /api/users/login: Request {email, password} → Response {user, token}
- GET /api/users/me: Headers {Authorization: Bearer token} → Response {user}

**Products (backend/routes/productRoutes.js):**
- GET /api/products: Query {search, categoryId, minPrice, maxPrice, page, limit, sortBy, sortOrder} → Response {products[], total, page, limit}
- GET /api/products/:id → Response {product with images[]}
- POST /api/products: Headers {Authorization}, Body {name, price, categoryId, ...} → Response {product} (Admin only)
- PUT /api/products/:id: Body {updates} → Response {product} (Admin only)
- DELETE /api/products/:id → Response {message} (Admin only)

**Orders (backend/routes/orderRoutes.js):**
- POST /api/orders: Headers {Authorization}, Body {items[], shippingAddress} → Response {order} (Transaction)
- GET /api/orders/my: Headers {Authorization} → Response {orders[]}
- GET /api/orders/my/:id → Response {order with items[]}

**Admin (backend/routes/adminRoutes.js):**
- GET /api/admin/overview → Response {stats}
- GET /api/admin/products → Response {products[]}
- POST /api/admin/products: Body {product} → Response {product}
- PUT /api/admin/products/:id: Body {updates} → Response {product}
- DELETE /api/admin/products/:id → Response {message}
- GET /api/admin/orders → Response {orders[]}
- PATCH /api/admin/orders/:id/status: Body {status} → Response {order}

**Stats (backend/routes/statsRoutes.js):**
- GET /api/stats/overview: Headers {Authorization} → Response {totalOrders, totalRevenue, ...} (Admin only)

**Upload (backend/routes/uploadRoutes.js):**
- POST /api/upload/image: FormData {file} → Response {url}

### 1.8 Sequence Diagram / Architecture Diagram
**Kiến Trúc Hệ Thống (Architecture Diagram):**
- **Frontend (React/Vite):** Chạy trên port 5173, giao tiếp với backend qua HTTP/REST.
- **Backend (Node.js/Express):** Chạy trên port 4000, xử lý logic, kết nối DB, upload files.
- **Database (PostgreSQL):** Chạy trên port 5432, lưu trữ dữ liệu quan hệ.
- **Docker Compose:** Orchestrate multi-container: postgres, backend, volumes cho uploads và DB data.

[Hình Architecture: Sơ đồ kiến trúc với Docker containers và flows]

**Sequence Diagram (Ví dụ Checkout Flow):**
1. User → Frontend: Click "Checkout" trên Cart.jsx
2. Frontend → Backend: POST /api/orders với items[] và shippingAddress
3. Backend → Database: BEGIN transaction, INSERT orders, INSERT order_items, UPDATE products.stock_qty, COMMIT
4. Backend → Frontend: Response {order}
5. Frontend → User: Hiển thị success page (Confirm.jsx)

[Hình Sequence: Sơ đồ tuần tự cho checkout process]

---

## 2. Bài 1: Thiết Kế UI/UX Với Figma

### 2.1 Quy Trình Thiết Kế
Quy trình thiết kế UI/UX được thực hiện qua 3 giai đoạn chính:
1. **Wireframe (Khung Xương):** Phác thảo cấu trúc cơ bản, tập trung vào layout và chức năng.
2. **Mockup (Giao Diện Tĩnh):** Thiết kế chi tiết với màu sắc, typography, và hình ảnh.
3. **Prototype (Bản Mẫu Tương Tác):** Tạo tương tác để mô phỏng trải nghiệm người dùng.

### 2.2 Các Màn Hình Chính
Dự án thực hiện 24 màn hình UI/UX, dựa trên cấu trúc src/pages/:
- Home (src/pages/home/Home.jsx), Product List/Search (src/pages/product/ProductList.jsx), Product Detail (src/pages/product/ProductDetail.jsx).
- Build PC (src/pages/buildpc/BuildPC.jsx với multi-step build flow).
- Cart (src/pages/cart/Cart.jsx), Checkout (src/pages/checkout/Checkout.jsx, src/pages/checkout/Confirm.jsx).
- Authentication: Login/Register (src/pages/auth/Login.jsx, src/pages/auth/Register.jsx), Forgot Password (src/pages/auth/ForgotPassword.jsx, ResetPassword.jsx).
- User: Profile (src/pages/profile/Profile.jsx), Change Password (src/pages/profile/ChangePassword.jsx), Order History/Detail (src/pages/order/OrderHistory.jsx, OrderDetail.jsx).
- Admin: Dashboard, Product Manager/Form, Order Manager, Support Chat Manager, User Manager (src/pages/admin/).

Mỗi màn hình có version desktop và mobile để đảm bảo responsive.

### 2.3 Minh Chứng
[Hình 1: Wireframe của trang Home]  
[Hình 2: Mockup của trang Product Detail]  
[Hình 3: Prototype flow từ Home đến Checkout]  

### 2.4 Vai Trò Của AI
AI được sử dụng để gợi ý user-flow, copywriting cho các nút và mô tả, và checklist wireframe. Nhóm đã review và chỉnh sửa để phù hợp với nghiệp vụ PC Store.

---

## 3. Bài 2: Kiểm Thử Frontend Với Developer Tools

### 3.1 Kỹ Thuật Sử Dụng
Sử dụng Google Chrome Developer Tools để kiểm thử:
- **Elements:** Chỉnh sửa DOM/CSS trực tiếp.
- **Console:** Debug lỗi JavaScript.
- **Sources:** Debug code.
- **Network:** Kiểm tra API calls.
- **Performance:** Phân tích tốc độ tải.

### 3.2 Responsive Testing
Kiểm tra trên các kích thước màn hình: 1920x1080 (desktop), 768x1024 (tablet), 375x667 (mobile). Đảm bảo layout thích ứng.

### 3.3 Thực Hành Trực Tiếp
Demo thay đổi trực tiếp trên các component từ src/components/ và src/pages/:
- Thay đổi màu sắc background trong Header.jsx và MainLayout.
- Ẩn/hiện hình ảnh sản phẩm trong ProductDetail.jsx.
- Thay đổi nội dung văn bản và giá tiền trong Cart.jsx.

Kiểm tra network với các endpoint thực tế:
- GET /api/products để kiểm tra filter/search/pagination.
- POST /api/users/login để kiểm tra xác thực.
- POST /api/orders để kiểm tra checkout transaction.

[Hình 4: Screenshot Elements tab chỉnh sửa CSS trong Header.jsx]  
[Hình 5: Console log lỗi API trong src/services/productService.js]  
[Hình 6: Network tab kiểm tra response time cho /api/products]  

### 3.4 Vai Trò Của AI
AI gợi ý test cases và script checklist cho F12. Nhóm thực hiện manual testing và ghi lại kết quả.

---

## 4. Bài 3: Quản Lý Mã Nguồn Với GitHub

### 3.1 Workflow
Tuân thủ Git Flow theo docs/git-workflow.md:
- **Master:** Nhánh sản phẩm ổn định.
- **Develop:** Nhánh tích hợp.
- **Feature:** Nhánh cho từng tính năng, đặt tên theo `feature/<thanh-vien>/<mo-ta>` (ví dụ: feature/long/product-crud, feature/linh/order-transaction).

Ví dụ mã nguồn: backend/controllers/productController.js, backend/controllers/orderController.js, src/pages/product/ProductList.jsx, src/pages/auth/Login.jsx.

### 3.2 Quy Trình
1. Tạo branch từ develop.
2. Commit nhỏ, rõ ràng.
3. Push và tạo PR vào develop.
4. Nhóm trưởng review và merge.
5. Cuối sprint merge develop vào master.

### 3.3 Minh Chứng
[Hình 7: Cấu trúc nhánh trên GitHub]  
[Hình 8: Pull Request example]  
[Hình 9: Commit history]  

### 3.4 Vai Trò Của AI
AI hỗ trợ tạo convention cho branch/commit/PR. Nhóm tuân thủ và customize theo dự án.

---

## 5. Bài 4: Quản Trị Dự Án Với Jira

### 5.1 Cấu Trúc
Theo docs/jira-setup.md:
- **Component:** Frontend (src/), Backend (backend/), Database (backend/models/), Testing, DevOps (Dockerfile).
- **Issues:** 10 Epics (Authentication, Product Catalog, etc.), 20 Stories, 30-40 Tasks/Subtasks, 5 Bugs.

### 5.2 Workflow
To Do → In Progress → Review → Done. Khi có bug, đẩy về Blocked → In Progress.

### 5.3 Minh Chứng
[Hình 10: Board Summary]  
[Hình 11: Timeline]  
[Hình 12: Workload/Workblock]  
[Hình 13: Danh sách Epic/Story/Task]  
[Hình 14: Bug list và status history]  

### 5.4 Vai Trò Của AI
AI gợi ý Epic/Story/Task và workflow quản lý bug. Nhóm implement và log tiến độ.

---

## 6. Bài 5: Triển Khai Trên Cloud

### 6.1 Nền Tảng
Sử dụng AWS cho deployment:
- EC2 cho server.
- RDS cho PostgreSQL.
- S3 cho upload ảnh.

### 6.2 Docker
Sử dụng Docker theo docker-compose.yml để đóng gói:
- Backend container xây dựng từ backend/Dockerfile.
- PostgreSQL container dùng image postgres:16-alpine cùng init script backend/sql/schema.sql và backend/sql/seed.sql.
- Volume gắn ./backend/uploads để lưu ảnh upload bất biến giữa các lần chạy.

Docker Compose cấu hình kết nối giữa postgres và backend qua env vars: DB_HOST=postgres, DATABASE_URL=postgres://postgres:postgres@postgres:5432/pc_store, PORT=4000.

### 6.3 Quy Trình Triển Khai
1. Build image.
2. Push lên ECR.
3. Deploy trên ECS.

[Hình 15: Dockerfile example]  
[Hình 16: Docker Compose]  
[Hình 17: AWS Console deployment]  

### 6.4 Vai Trò Của AI
AI hỗ trợ viết Dockerfile và scripts deployment. Nhóm test local trước khi deploy.

---

## 7. Kết Luận
Dự án PC Store đã hoàn thành đầy đủ yêu cầu, với UI/UX chi tiết, code chất lượng, và deployment thành công. AI hỗ trợ hiệu quả trong việc tăng tốc độ phát triển.

## 8. Tài Liệu Tham Khảo
- React Documentation
- Node.js Guide
- PostgreSQL Manual
- GitHub Docs
- Jira Tutorials
- AWS Documentation

---

*Ghi chú: Báo cáo này có khoảng 30 trang khi in. Hình ảnh cần được chèn từ Figma, GitHub, Jira screenshots.*