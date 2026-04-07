-- backend/sql/seed_minimal.sql
-- 2 user (admin/user), 6 category, 12 products

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
  ((SELECT id FROM c WHERE slug = 'laptop'), 'Laptop Creator OLED', 'laptop-creator-oled', 'Laptop danh cho designer.', 32990000, 4, '/uploads/laptop2.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'Man hinh 27 inch 2K', 'man-hinh-27-2k', 'Tan so quet 180Hz.', 6990000, 20, '/uploads/monitor1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'Man hinh 32 inch 4K', 'man-hinh-32-4k', 'Phuc vu do hoa 4K.', 11990000, 12, '/uploads/monitor2.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Chuot Wireless Pro', 'chuot-wireless-pro', 'Trong luong nhe, 4K polling.', 2490000, 30, '/uploads/mouse1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Chuot Esports', 'chuot-esports', 'Do tre thap cho game FPS.', 1590000, 40, '/uploads/mouse2.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Ban phim Co 75%', 'ban-phim-75', 'Switch linear, hot swap.', 2190000, 25, '/uploads/keyboard1.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Ban phim HE 60%', 'ban-phim-he-60', 'Rapid trigger cho FPS.', 3990000, 16, '/uploads/keyboard2.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Tai nghe Gaming', 'tai-nghe-gaming', 'Am thanh lap the, mic ro.', 1990000, 22, '/uploads/headphone1.jpg', 'active')
ON CONFLICT (slug) DO NOTHING;
