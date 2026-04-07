-- 02_seed_full.sql
-- Sample data for full schema

INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Admin KAH', 'admin@kahstore.vn', '$2b$10$OBGvd3o5bwfMRsu3I/CzkOH0T2aQ5Jbtu1Ck26xUH5.MCG/7PKCFa', 'admin'),
  ('User Demo', 'user@kahstore.vn', '$2b$10$DZZm4LGdNm4IffWaaJQ80uP9XNpd/bnZwd.yjUJl3qF1WyB9d77z.', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, slug)
VALUES
  ('PC Gaming', 'pc-gaming'),
  ('Laptop', 'laptop'),
  ('Man hinh', 'man-hinh'),
  ('Chuot', 'chuot'),
  ('Ban phim', 'ban-phim'),
  ('Tai nghe', 'tai-nghe')
ON CONFLICT (slug) DO NOTHING;

WITH c AS (
  SELECT id, slug FROM categories
)
INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)
VALUES
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming i5 RTX 4060', 'pc-gaming-i5-4060', 'Cau hinh choi game 1080p.', 18990000, 10, '/uploads/pc1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming i7 RTX 4070', 'pc-gaming-i7-4070', 'Can game 2K va stream.', 28990000, 8, '/uploads/pc2.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Ryzen 7 RTX 5070', 'pc-ryzen7-5070', 'Da nhiem va do hoa.', 35990000, 5, '/uploads/pc3.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'laptop'), 'Laptop Gaming 16 inch', 'laptop-gaming-16', 'Laptop gaming tam trung.', 25990000, 7, '/uploads/laptop1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'Man hinh 27 inch 2K', 'man-hinh-27-2k', 'Tan so quet 180Hz.', 6990000, 20, '/uploads/monitor1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Chuot Wireless Pro', 'chuot-wireless-pro', 'Trong luong nhe, 4K polling.', 2490000, 30, '/uploads/mouse1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Ban phim Co 75%', 'ban-phim-75', 'Switch linear, hot swap.', 2190000, 25, '/uploads/keyboard1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Tai nghe Gaming', 'tai-nghe-gaming', 'Am thanh lap the, mic ro.', 1990000, 22, '/uploads/headphone1.jpg', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO promotions (title, code, discount_type, value, min_order, is_active)
VALUES
  ('Giam 10 phan tram cho don tren 30 trieu', 'PC30', 'percent', 10, 30000000, TRUE),
  ('Free ship noi thanh', 'FREESHIP', 'shipping', 0, 1000000, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Optional demo order (for statistic dashboard)
WITH user_row AS (
  SELECT id FROM users WHERE email = 'user@kahstore.vn' LIMIT 1
),
product_row AS (
  SELECT id, price FROM products ORDER BY id ASC LIMIT 1
),
new_order AS (
  INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
  SELECT user_row.id, product_row.price, 'completed', '123 Demo Street, Ho Chi Minh', 'cod'
  FROM user_row, product_row
  WHERE NOT EXISTS (SELECT 1 FROM orders)
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
SELECT new_order.id, product_row.id, 1, product_row.price, product_row.price
FROM new_order, product_row;

INSERT INTO payments (order_id, method, status)
SELECT o.id, 'cod', 'paid'
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE payments.order_id = o.id)
ORDER BY o.id ASC
LIMIT 1;
