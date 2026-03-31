# PC Store Backend (Node.js + PostgreSQL)

Backend API dùng Node.js/Express và PostgreSQL, phù hợp kết nối DB đang quản lý qua pgAdmin 4.

## 1) Cài đặt
```bash
cd backend
npm install
copy .env.example .env
```

## 2) Cấu hình PostgreSQL (pgAdmin 4)
Trong pgAdmin 4, tạo database tên `QuanLyPc` (nếu chưa có), sau đó sửa file `.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/QuanLyPc
```

Hoặc dùng dạng tách biến:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=QuanLyPc
DB_USER=postgres
DB_PASSWORD=postgres
```

## 3) Khởi tạo schema + dữ liệu mẫu
```bash
npm run db:check
npm run db:init
npm run db:seed
```

Muốn reset toàn bộ DB rồi tạo lại:
```bash
npm run db:reset
```

## 4) Chạy backend
```bash
npm run dev
```

- Backend: `http://localhost:4000`
- Swagger: `http://localhost:4000/api-docs`
- Health check: `http://localhost:4000/api/health`

## 5) Tài khoản mẫu
- Admin: `admin@kahstore.vn` / `Admin@123`
- User: `user@kahstore.vn` / `User@123`

## 6) API chính
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/products?search=&page=&limit=&sortBy=&sortOrder=`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `POST /api/orders` (transaction)
- `GET /api/stats/overview` (admin)
- `POST /api/upload/image` (admin)
