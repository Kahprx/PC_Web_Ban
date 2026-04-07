# Full Database Source (PC Store)

Thu muc nay la bo database day du cho project.

## Files
- `00_reset_full.sql`: xoa toan bo bang (de reset local)
- `01_schema_full.sql`: tao schema day du
- `02_seed_full.sql`: du lieu mau (2 user + category + products + promotions + demo order)

## Run local PostgreSQL
```bash
createdb pc_store
psql -d pc_store -f backend/sql/full/01_schema_full.sql
psql -d pc_store -f backend/sql/full/02_seed_full.sql
```

Neu can reset:
```bash
psql -d pc_store -f backend/sql/full/00_reset_full.sql
psql -d pc_store -f backend/sql/full/01_schema_full.sql
psql -d pc_store -f backend/sql/full/02_seed_full.sql
```

## Demo account
- Admin: `admin@kahstore.vn` / `Admin@123`
- User: `user@kahstore.vn` / `User@123`

## Bang duoc tao
- Core: users, categories, products, orders, order_items
- Extra: cart_items, wishlist, reviews, comments, payments, promotions

Schema nay khop voi source backend hien tai (models/controllers/routes).
