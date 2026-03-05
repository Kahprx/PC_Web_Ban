-- backend/sql/seed.sql
INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Admin KAH', 'admin@kahstore.vn', crypt('Admin@123', gen_salt('bf')), 'admin'),
  ('User Demo', 'user@kahstore.vn', crypt('User@123', gen_salt('bf')), 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, slug)
VALUES
  ('PC Gaming', 'pc-gaming'),
  ('Laptop', 'laptop'),
  ('Màn hình', 'man-hinh'),
  ('Chuột', 'chuot'),
  ('Bàn phím', 'ban-phim'),
  ('Tai nghe', 'tai-nghe')
ON CONFLICT (slug) DO NOTHING;

WITH c AS (
  SELECT id, slug FROM categories
)
INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)
VALUES
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'Bộ PC Gaming Ryzen 7 7800X3D RTX 5070', 'bo-pc-gaming-7800x3d-5070', 'PC gaming cấu hình cao cho AAA 2K.', 39990000, 12, '/uploads/pc-7800x3d-5070.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'Bộ PC Gaming i7 14700K RTX 5070 Ti', 'bo-pc-gaming-i7-14700k-5070ti', 'Tối ưu hiệu năng stream/game.', 43240000, 9, '/uploads/pc-i7-5070ti.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'Bộ PC Đồ họa Ryzen 9 9950X RTX 5080', 'bo-pc-do-hoa-9950x-5080', 'Thiết kế 3D, render và AI.', 57990000, 6, '/uploads/pc-9950x-5080.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'Màn hình ASUS ROG XG27UCDMG', 'man-hinh-asus-rog-xg27ucdmg', 'Màn hình OLED 27 inch, 4K.', 16942000, 15, '/uploads/asus-rog-xg27ucdmg.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'Màn hình MSI MAG 273QP QD-OLED', 'man-hinh-msi-mag-273qp-qd-oled', 'QHD 360Hz cho esports.', 18990000, 11, '/uploads/msi-mag-273qp.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Razer Viper V3 Pro SE', 'razer-viper-v3-pro-se', 'Chuột không dây nhẹ cho thi đấu.', 2700000, 40, '/uploads/razer-viper-v3-pro-se.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Lamzu Maya X', 'lamzu-maya-x', 'Chuột gaming 8K polling.', 2900000, 22, '/uploads/lamzu-maya-x.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Pulsar Tenz Red', 'pulsar-tenz-red', 'Phiên bản hợp tác Tenz.', 4142000, 8, '/uploads/pulsar-tenz-red.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Wooting 80HE V2', 'wooting-80he-v2', 'Hall-effect, rapid trigger.', 8990000, 18, '/uploads/wooting-80he-v2.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'DrunkDeer A75 Master 8K', 'drunkdeer-a75-master-8k', 'Bàn phím HE 8K dành cho game.', 4999000, 20, '/uploads/drunkdeer-a75-8k.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'SIMGOT Supermix 5', 'simgot-supermix-5', 'IEM gaming & nhạc.', 5150000, 14, '/uploads/simgot-supermix-5.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Finalmouse ULX Frostlord', 'finalmouse-ulx-frostlord', 'Chuột ULX magnesium đặc biệt.', 5390000, 7, '/uploads/finalmouse-ulx-frostlord.jpg', 'active')
ON CONFLICT (slug) DO NOTHING;
