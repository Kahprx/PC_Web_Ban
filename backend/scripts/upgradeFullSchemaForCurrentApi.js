require("dotenv").config();

const bcrypt = require("bcrypt");
const { query, pool } = require("../utils/db");

const SQL_STEPS = [
  // --- users ---
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`,
  `UPDATE users u
   SET full_name = COALESCE(up.full_name, split_part(u.email, '@', 1))
   FROM user_profiles up
   WHERE up.user_id = u.id
     AND (u.full_name IS NULL OR u.full_name = '');`,
  `UPDATE users
   SET full_name = COALESCE(NULLIF(full_name, ''), split_part(email, '@', 1));`,
  `UPDATE users u
   SET role = LOWER(r.name)
   FROM user_roles ur
   JOIN roles r ON r.id = ur.role_id
   WHERE ur.user_id = u.id;`,
  `UPDATE users
   SET role = CASE
     WHEN LOWER(COALESCE(role, '')) IN ('admin', 'user') THEN LOWER(role)
     WHEN LOWER(email) LIKE '%admin%' THEN 'admin'
     ELSE 'user'
   END;`,

  // --- categories ---
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(140);`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE categories
   SET slug = LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(name, ''), '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
   WHERE slug IS NULL OR slug = '';`,
  `UPDATE categories
   SET slug = 'category-' || id
   WHERE slug IS NULL OR slug = '';`,
  `WITH ranked AS (
     SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) rn
     FROM categories
   )
   UPDATE categories c
   SET slug = c.slug || '-' || c.id
   FROM ranked r
   WHERE c.id = r.id
     AND r.rn > 1;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_slug ON categories(slug);`,
  `SELECT setval(
     pg_get_serial_sequence('categories', 'id'),
     COALESCE((SELECT MAX(id) FROM categories), 1),
     true
   );`,
  `INSERT INTO categories (name, slug)
   VALUES ('Gaming Gear', 'gaming-gear')
   ON CONFLICT (slug) DO NOTHING;`,

  // --- products ---
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(24);`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(260);`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 0;`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE products p
   SET stock_qty = COALESCE(s.quantity, p.stock_qty, 0)
   FROM stock s
   WHERE s.product_id = p.id;`,
  `UPDATE products p
   SET image_url = (
     SELECT pi.url
     FROM product_images pi
     WHERE pi.product_id = p.id
     ORDER BY pi.id ASC
     LIMIT 1
   )
   WHERE p.image_url IS NULL OR p.image_url = '';`,
  `UPDATE products
   SET status = CASE
     WHEN LOWER(COALESCE(status, '')) IN ('active', 'inactive') THEN LOWER(status)
     ELSE 'active'
   END;`,
  `UPDATE products
   SET slug = LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(name, ''), '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
   WHERE slug IS NULL OR slug = '';`,
  `UPDATE products
   SET slug = 'product-' || id
   WHERE slug IS NULL OR slug = '';`,
  `WITH ranked AS (
     SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) rn
     FROM products
   )
   UPDATE products p
   SET slug = p.slug || '-' || p.id
   FROM ranked r
   WHERE p.id = r.id
     AND r.rn > 1;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_products_slug ON products(slug);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code ON products(product_code) WHERE product_code IS NOT NULL;`,
  `SELECT setval(
     pg_get_serial_sequence('products', 'id'),
     COALESCE((SELECT MAX(id) FROM products), 1),
     true
   );`,
  `WITH c AS (
     SELECT id FROM categories WHERE slug = 'gaming-gear' LIMIT 1
   )
   INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)
   VALUES
     ((SELECT id FROM c), 'Gaming Gear Combo FPS Pro', 'gaming-gear-combo-fps-pro', 'Combo chuot wireless + ban phim tkl cho esports FPS.', 4990000, 15, '/uploads/benq-zowie-u2-dw-chu-t-khong-day-60g-4k-polling-rate-1180434581.webp', 'active'),
     ((SELECT id FROM c), 'Gaming Gear Combo HE 8K', 'gaming-gear-combo-he-8k', 'Ban phim rapid trigger 8K, chuot dongle 4K, toi uu do tre.', 7390000, 10, '/uploads/d-t-tr-c-ban-phim-he-melgeek-made84-pro-8k-h-tr-rapid-trigger-1167857152.webp', 'active'),
     ((SELECT id FROM c), 'Gaming Gear Starter Pack', 'gaming-gear-starter-pack', 'Combo chuot gaming, ban phim co, tai nghe in-ear cho nguoi moi.', 3590000, 20, '/uploads/27257d40-4d12-48e3-ba03-786c4df2c3fb.jpg', 'active')
   ON CONFLICT (slug) DO NOTHING;`,

  // --- orders ---
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14, 2);`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20);`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE orders
   SET total_amount = COALESCE(total_amount, total, 0);`,
  `UPDATE orders o
   SET status = LOWER(os.name)
   FROM order_status os
   WHERE o.status_id = os.id
     AND (o.status IS NULL OR o.status = '');`,
  `UPDATE orders
   SET status = 'pending'
   WHERE status IS NULL OR status = '';`,
  `UPDATE orders
   SET shipping_address = COALESCE(NULLIF(shipping_address, ''), 'N/A');`,
  `UPDATE orders
   SET payment_method = COALESCE(NULLIF(payment_method, ''), 'cod');`,

  // --- order_items ---
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2);`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(14, 2);`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE order_items
   SET unit_price = COALESCE(unit_price, price, 0);`,
  `UPDATE order_items
   SET line_total = COALESCE(line_total, quantity * COALESCE(unit_price, price, 0), 0);`,

  // --- cart_items ---
  `ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS user_id INTEGER;`,
  `ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE cart_items ci
   SET user_id = c.user_id
   FROM carts c
   WHERE ci.cart_id = c.id
     AND ci.user_id IS NULL;`,
  `WITH dup AS (
     SELECT MIN(id) keep_id, user_id, product_id, SUM(COALESCE(quantity, 1)) qty
     FROM cart_items
     GROUP BY user_id, product_id
     HAVING COUNT(*) > 1
   )
   UPDATE cart_items c
   SET quantity = dup.qty
   FROM dup
   WHERE c.id = dup.keep_id;`,
  `WITH dup AS (
     SELECT MIN(id) keep_id, user_id, product_id
     FROM cart_items
     GROUP BY user_id, product_id
     HAVING COUNT(*) > 1
   )
   DELETE FROM cart_items c
   USING dup
   WHERE c.user_id IS NOT DISTINCT FROM dup.user_id
     AND c.product_id = dup.product_id
     AND c.id <> dup.keep_id;`,
  `UPDATE cart_items SET quantity = COALESCE(NULLIF(quantity, 0), 1);`,
  `CREATE INDEX IF NOT EXISTS idx_cart_items_user_id_compat ON cart_items(user_id);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_cart_items_user_product ON cart_items(user_id, product_id);`,

  // --- wishlist compatibility table ---
  `CREATE TABLE IF NOT EXISTS wishlist (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (user_id, product_id)
   );`,
  `INSERT INTO wishlist (user_id, product_id, created_at)
   SELECT w.user_id, wi.product_id, NOW()
   FROM wishlists w
   JOIN wishlist_items wi ON wi.wishlist_id = w.id
   ON CONFLICT (user_id, product_id) DO NOTHING;`,
  `CREATE INDEX IF NOT EXISTS idx_wishlist_user_id_compat ON wishlist(user_id);`,

  // --- reviews ---
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER;`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE reviews r
   SET rating = rt.rating
   FROM ratings rt
   WHERE rt.user_id = r.user_id
     AND rt.product_id = r.product_id
     AND r.rating IS NULL;`,
  `UPDATE reviews
   SET rating = COALESCE(rating, 5);`,
  `WITH dup AS (
     SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, product_id ORDER BY id DESC) rn
     FROM reviews
   )
   DELETE FROM reviews r
   USING dup d
   WHERE r.id = d.id
     AND d.rn > 1;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_reviews_user_product ON reviews(user_id, product_id);`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_product_id_compat ON reviews(product_id);`,

  // --- comments compatibility table ---
  `CREATE TABLE IF NOT EXISTS comments (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
     parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );`,
  `CREATE INDEX IF NOT EXISTS idx_comments_product_id_compat ON comments(product_id);`,

  // --- payments ---
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS method VARCHAR(50);`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE payments
   SET method = COALESCE(NULLIF(method, ''), 'cod');`,

  // --- notifications compatibility ---
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(200);`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general';`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500);`,
  `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `UPDATE notifications
   SET title = COALESCE(NULLIF(title, ''), 'Thong bao'),
       content = COALESCE(NULLIF(content, ''), message);`,

  // --- generic updated_at trigger ---
  `CREATE OR REPLACE FUNCTION set_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;`,
  `DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
   CREATE TRIGGER trg_users_updated_at
   BEFORE UPDATE ON users
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
  `DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
   CREATE TRIGGER trg_products_updated_at
   BEFORE UPDATE ON products
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
  `DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
   CREATE TRIGGER trg_orders_updated_at
   BEFORE UPDATE ON orders
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
  `DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON cart_items;
   CREATE TRIGGER trg_cart_items_updated_at
   BEFORE UPDATE ON cart_items
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
  `DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
   CREATE TRIGGER trg_reviews_updated_at
   BEFORE UPDATE ON reviews
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
  `DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
   CREATE TRIGGER trg_comments_updated_at
   BEFORE UPDATE ON comments
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
  `DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
   CREATE TRIGGER trg_payments_updated_at
   BEFORE UPDATE ON payments
   FOR EACH ROW
   EXECUTE FUNCTION set_updated_at();`,
];

const isBcryptHash = (value = "") => /^\$2[aby]\$/.test(String(value));

async function hashLegacyPasswords() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const result = await query(`SELECT id, password, password_hash FROM users ORDER BY id ASC`);

  for (const user of result.rows) {
    const current = String(user.password_hash || "");
    if (isBcryptHash(current)) continue;

    const source = String(user.password || user.password_hash || "123456");
    const hashed = await bcrypt.hash(source, rounds);

    await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [user.id, hashed]);
  }
}

async function main() {
  try {
    for (const step of SQL_STEPS) {
      await query(step);
    }

    await hashLegacyPasswords();

    const tableCount = await query(
      `SELECT COUNT(*)::int AS total
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'`
    );

    console.log("Compatibility upgrade completed.");
    console.log(`Public tables: ${tableCount.rows[0].total}`);
  } catch (error) {
    console.error("Compatibility upgrade failed.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
