-- backend/sql/seed.sql
INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Admin KAH', 'admin@kahstore.vn', '$2b$10$OBGvd3o5bwfMRsu3I/CzkOH0T2aQ5Jbtu1Ck26xUH5.MCG/7PKCFa', 'admin'),
  ('User Demo', 'user@kahstore.vn', '$2b$10$DZZm4LGdNm4IffWaaJQ80uP9XNpd/bnZwd.yjUJl3qF1WyB9d77z.', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, slug)
VALUES
  ('PC Gaming', 'pc-gaming'),
  ('Laptop', 'laptop'),
  ('M�n h�nh', 'man-hinh'),
  ('Chu?t', 'chuot'),
  ('B�n ph�m', 'ban-phim'),
  ('Tai nghe', 'tai-nghe')
ON CONFLICT (slug) DO NOTHING;

WITH c AS (
  SELECT id, slug FROM categories
)
INSERT INTO products (category_id, name, slug, description, price, stock_qty, image_url, status)
VALUES
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC �? ho? i7 14700K RTX 5070 White', 'pc-do-hoa-i7-14700k-5070-white', 'PC d? ho?, render v� edit 4K.', 46990000, 8, '/uploads/250-26979-pc-dohoa-core-i7-14700k-ram-32g-ddr5-rtx-5070-ultra-white.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming 25251340', 'pc-gaming-25251340', 'C�n game eSports, thi?t k? g?n.', 28990000, 15, '/uploads/250-27426-pc-gaming-25251340.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming Ryzen 7 9800X3D RTX 5080', 'pc-gaming-9800x3d-rtx-5080', 'Hi?u nang AAA/streaming 2K.', 52990000, 9, '/uploads/250-27462-b----pc-gaming-ryzen-7-9800x3d-ram-32g-vga-rtx-5080.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming Ryzen 5 5500 RX 7600', 'pc-gaming-5500-rx7600', 'Build entry cho h?c t?p & game.', 16990000, 20, '/uploads/250-27563-pc-gaming-amd-ryzen-5-5500-ram-16gb-rx-7600-8gb.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Frame Build 27244', 'pc-frame-27244', 'Khung build s?n, d? n�ng c?p.', 19990000, 12, '/uploads/250-27587-27587-27244-khung-pc.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming 25251349', 'pc-gaming-25251349', 'Combo choi game & stream mu?t.', 30990000, 14, '/uploads/250-27845-pc-gaming-25251349.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming i7 14700K RTX 4070 Super', 'pc-gaming-i7-14700k-4070s', 'T?i uu 2K 144Hz, stream.', 37990000, 11, '/uploads/250-28132-pc-gaming-intel-core-i7-14700k-ram-64gb-rtx-4070-super-12gb-10.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming i7 14700K RTX 5070 Ti', 'pc-gaming-i7-14700k-5070ti-18', 'Hi?u nang c�n m?i t?a AAA.', 41990000, 9, '/uploads/250-28290-bo-pc-intel-core-i7-14700k-ram-32gb-ddr5-vga-rtx-5070-ti-16gb-18.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC �? ho? Ryzen 9 9950X RTX 5070 Ti', 'pc-do-hoa-9950x-5070ti', 'Render 3D, Blender, AI.', 56990000, 6, '/uploads/250-28408-bo-pc-do-hoa-ryzen-9-9950x-ram-32gb-rtx-5070-ti-16gb (1).jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming Ryzen 7 7800X3D RTX 5060', 'pc-gaming-7800x3d-5060', 'T?i uu P/P cho 2K 144Hz.', 32490000, 13, '/uploads/250-28409-bo-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5060-8gb.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'pc-gaming'), 'PC Gaming Ryzen 7 7800X3D RTX 5070', 'pc-gaming-7800x3d-5070-12gb', 'Build c�n d? ho? + game.', 34990000, 10, '/uploads/250-28601-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb-01.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'ASUS ROG Strix OLED XG27UCDMG', 'man-hinh-asus-rog-xg27ucdmg', 'OLED 27 inch 4K 240Hz.', 16942000, 15, '/uploads/ASUS-ROG-Strix-OLED-XG27UCDMG-Now-Available-980x551.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'ASUS ProArt PA248QV', 'man-hinh-asus-pa248qv', 'M�n h�nh chu?n m�u cho design.', 7990000, 18, '/uploads/asus_pa248qv-p_gearvn_c08f0cb35843439781bcafc88e906969_bfdb177dcca04fb3bec044e1dd5aa76a_master.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'ASUS PG27AQWP W', 'man-hinh-asus-pg27aqwp', 'M�n h�nh QD-OLED cao c?p.', 18990000, 10, '/uploads/asus_pg27aqwp-w_gearvn_ffffe2baa33b4f9092cbe4b7c94a4399_master.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'ASUS VG27AQ5A', 'man-hinh-asus-vg27aq5a', '2K 180Hz gi� t?t.', 7990000, 20, '/uploads/asus_vg27aq5a_gearvn_8a48559a1dad420e9e07e804da103d4a_master.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'man-hinh'), 'ASUS XG32UQ', 'man-hinh-asus-xg32uq', '4K 160Hz cho gaming & d? ho?.', 21990000, 8, '/uploads/asus_xg32uq_gearvn_45c4567f4263401abed634921db41811_master.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Razer Viper V3 Pro SE', 'razer-viper-v3-pro-se', 'Chu?t kh�ng d�y cho esport.', 2700000, 40, '/uploads/chuot-khong-day-razer-viper-v3-pro-se.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Zowie U2 DW 4K', 'zowie-u2dw-4k', 'Chu?t nh? 60g, 4K polling.', 2190000, 25, '/uploads/benq-zowie-u2-dw-chu-t-khong-day-60g-4k-polling-rate-1180434581.webp', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Logitech G Pro X Superlight 2', 'logitech-gprox-superlight-2', 'Chu?t si�u nh? kh�ng d�y.', 3390000, 30, '/uploads/chu-t-khong-day-sieu-nh-logitech-g-pro-x-superlight-2c-wireless-1194149405.webp', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'Finalmouse ULX Frostlord', 'finalmouse-ulx-frostlord', 'Chu?t ULX h?p kim, si�u nh?.', 5390000, 12, '/uploads/finalmouse-ultralightx-frostlord-chu-t-finalmouse-ulx-phien-b-n-cu-i-cung-1211356924.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'chuot'), 'HXM Custom 27257', 'mouse-27257', 'Chu?t custom gaming.', 1890000, 18, '/uploads/27257d40-4d12-48e3-ba03-786c4df2c3fb.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Melgeek Made84 Pro 8K', 'melgeek-made84-pro-8k', 'B�n ph�m HE 8K rapid trigger.', 4990000, 20, '/uploads/d-t-tr-c-ban-phim-he-melgeek-made84-pro-8k-h-tr-rapid-trigger-1167857152.webp', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Keychron Custom CCCC', 'keychron-cccc-custom', 'Custom kit full CNC.', 3290000, 16, '/uploads/ccccccccccccc__1__97b4e46fda714fbf9ad2fe319557aa3d_master.png', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Akko MOD 006 DIY', 'akko-mod-006-diy', 'Kit nh�m, gasket mount.', 2790000, 22, '/uploads/download-1-6726b2a8-ec8c-4924-9d03-0ebd752a2da9.webp', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Akko MOD 007 Matcha', 'akko-mod-007-matcha', 'Phi�n b?n Matcha d?c quy?n.', 2890000, 19, '/uploads/download-5-a5e4dd2f-f077-448c-9eca-ecbf1cfb6dc1.webp', 'active'),
  ((SELECT id FROM c WHERE slug = 'ban-phim'), 'Wooting 60HE+ Red', 'wooting-60he-red', 'Hall-effect compact 60%.', 6990000, 10, '/uploads/1-e965f3de-d631-40e8-871a-f7a3cd2d8c40.webp', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Truthear HEXA', 'truthear-hexa', 'IEM 4 driver, tuning balanced.', 1900000, 25, '/uploads/5193_tai_nghe_truethear_hexa_xuan_vu_min.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Moondrop Blessing 3 (Front)', 'moondrop-blessing-3-front', 'IEM hybrid 2DD+4BA.', 7790000, 14, '/uploads/5276_tai_nghe_moondrop_blessing_3_xuan_vu_audio_1_min.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Moondrop Blessing 3 (Back)', 'moondrop-blessing-3-back', 'Phi�n b?n m�u xanh.', 7790000, 14, '/uploads/5276_tai_nghe_moondrop_blessing_3_xuan_vu_audio_5_min.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Kiwi Ears Quartet', 'kiwi-ears-quartet', 'IEM 2DD+2BA, bass d�y.', 4150000, 18, '/uploads/5542_tai_nghe_kiwi_ears_quartet_xuan_vu_audio_min.jpg', 'active'),
  ((SELECT id FROM c WHERE slug = 'tai-nghe'), 'Thieaudio Monarch MKII', 'thieaudio-monarch-mk2', 'Flagship 1DD+6BA+2EST.', 13990000, 6, '/uploads/5603_tai_nghe_thieaudio_monarch_mkii_xuan_vu_audio_chinh_hang_4.jpg', 'active')
ON CONFLICT (slug) DO NOTHING;
