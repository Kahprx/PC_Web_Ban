# Phân tích nghiệp vụ PC Store

## 1. Người dùng
- Xem danh sách sản phẩm, xem chi tiết sản phẩm
- Tìm kiếm theo tên/mô tả
- Build PC theo cấu hình linh kiện
- Đặt hàng và theo dõi lịch sử đơn

## 2. Admin
- CRUD sản phẩm
- Quản lý đơn hàng
- Xem thống kê số đơn và doanh thu

## 3. Database (PostgreSQL)
Dùng 5 bảng:
- `users`
- `categories`
- `products`
- `orders`
- `order_items`

Quan hệ:
- `categories (1) - (N) products`
- `users (1) - (N) orders`
- `orders (1) - (N) order_items`
- `products (1) - (N) order_items`

## 4. Luồng transaction khi tạo order
1. `BEGIN`
2. Kiểm tra tồn kho từng sản phẩm
3. Tạo record `orders`
4. Tạo các record `order_items`
5. Trừ tồn kho `products.stock_qty`
6. `COMMIT`
7. Lỗi bất kỳ bước nào: `ROLLBACK`

## 5. API chính
- Auth: `register`, `login`, `me`
- Products: `GET list/search`, `GET detail`, `POST`, `PUT`, `DELETE`
- Orders: `POST create`, `GET my`, `GET all(admin)`
- Stats: `GET overview`
- Upload: `POST /api/upload/image`

## 6. Trạng thái trả về
- `200`, `201`, `400`, `401`, `403`, `404`, `500`

## 7. Deliverables đã thêm vào source
- DB scripts: `backend/sql/schema.sql`, `backend/sql/seed.sql`
- Backend source: `backend/*`
- Postman: `backend/postman/pc-store.postman_collection.json`
- Docker: `backend/Dockerfile`, `docker-compose.yml`
- API docs: `/api-docs` (Swagger)

## 8. UI
- Giữ nguyên template UI hiện tại theo Figma của dự án.
- Tích hợp API theo service layer để không phá vỡ layout cũ.
