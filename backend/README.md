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

## 7) Admin API mới (require Bearer token admin)
- `GET /api/admin/overview`
- `GET /api/admin/users?search=&role=&isActive=&page=&limit=`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/active`
- `GET /api/admin/orders?search=&status=&page=&limit=`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/products?search=&status=&categoryId=&page=&limit=`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

## 8) Seed catalog lon (1990 san pham)
- Chay 1 lenh:
```bash
cd backend
npm run db:seed:1990
```

- Script se tao dung 1990 san pham voi cac nhom:
  - PC build (chip Intel/AMD, mainboard X/Z/B + AMD B, RAM DDR3/DDR4/DDR5, SSD/HDD 128GB-4TB, PSU 350W-1250W, VGA 1650-5090 + day du AMD, case da hang)
  - Linh kien (CPU, Mainboard, RAM, SSD, HDD, PSU, VGA, CASE)
  - Gear (Chuot, Pad, Ban phim, Tai nghe) theo brand da khai bao
  - Man hinh da brand voi tan so quet 144Hz-540Hz

## 9) Export seed_1990.sql (import bang pgAdmin)
```bash
cd backend
npm run db:export:seed:1990
```

- File tao ra: `backend/sql/seed_1990.sql`
- Import bang Query Tool trong pgAdmin va chay toan bo file.
