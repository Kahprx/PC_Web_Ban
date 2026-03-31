# PC Store Project (Final Assignment)

Du an fullstack cho do an cuoi ky: React + Node.js + PostgreSQL.

## Cau truc
- `backend/`: Express API + PostgreSQL + JWT + Swagger + Upload
- `src/`: Frontend React (Vite)
- `docs/`: Tai lieu nop bai va checklist

## Backend nhanh
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Swagger: `http://localhost:4000/api-docs`

## Database (bo toi gian theo rubric)
```bash
createdb pc_store
psql -d pc_store -f backend/sql/schema_minimal.sql
psql -d pc_store -f backend/sql/seed_minimal.sql
```

Tai khoan mau:
- Admin: `admin@kahstore.vn` / `Admin@123`
- User: `user@kahstore.vn` / `User@123`

## Frontend nhanh
```bash
npm install
npm run dev
```

## Docker
```bash
docker compose up --build
```

## Ho so nop bai
Xem trong `docs/submission-checklist.md`.
