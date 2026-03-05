# PC Store Backend

## 1) Chuẩn bị
- Cài Node.js >= 18
- Cài PostgreSQL local hoặc dùng Docker Compose

## 2) Cài package backend
```bash
cd backend
npm install
```

## 3) Tạo DB local thủ công
```bash
createdb pc_store
psql -d pc_store -f sql/schema.sql
psql -d pc_store -f sql/seed.sql
```

## 4) Chạy backend
```bash
cp .env.example .env
npm run dev
```

Backend chạy ở: `http://localhost:4000`
Swagger: `http://localhost:4000/api-docs`

## 5) Tài khoản mẫu seed
- Admin: `admin@kahstore.vn` / `Admin@123`
- User: `user@kahstore.vn` / `User@123`

## 6) Endpoints chính
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/products?search=&page=&limit=&sortBy=&sortOrder=`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `POST /api/orders` (transaction)
- `GET /api/stats/overview` (admin)
- `POST /api/upload/image` (admin)

## 7) Chạy bằng Docker
```bash
docker compose up --build
```
