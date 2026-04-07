
-- 1
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 3
CREATE TABLE user_roles (
    user_id INT REFERENCES users(id),
    role_id INT REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- 4
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

-- 5
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id),
    permission_id INT REFERENCES permissions(id),
    PRIMARY KEY(role_id, permission_id)
);

-- 6
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    full_name VARCHAR(255),
    phone VARCHAR(20)
);

-- 7
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    address TEXT
);

-- 8
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    token TEXT
);

-- 9
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    token TEXT
);

-- 10
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

-- 11
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id),
    name VARCHAR(255)
);

-- 12
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

-- 13
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price NUMERIC,
    category_id INT REFERENCES categories(id),
    brand_id INT REFERENCES brands(id)
);

-- 14
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    url TEXT
);

-- 15
CREATE TABLE product_specs (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    spec_key VARCHAR(100),
    spec_value TEXT
);

-- 16
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    name VARCHAR(255)
);

-- 17
CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    quantity INT
);

-- 18
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);

-- 19
CREATE TABLE product_supplier (
    product_id INT REFERENCES products(id),
    supplier_id INT REFERENCES suppliers(id),
    PRIMARY KEY(product_id, supplier_id)
);

-- 20
CREATE TABLE pc_builds (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    name VARCHAR(255)
);

-- 21
CREATE TABLE pc_build_items (
    id SERIAL PRIMARY KEY,
    build_id INT REFERENCES pc_builds(id),
    product_id INT REFERENCES products(id)
);

-- 22
CREATE TABLE compatibility_rules (
    id SERIAL PRIMARY KEY,
    product_a INT REFERENCES products(id),
    product_b INT REFERENCES products(id),
    is_compatible BOOLEAN
);

-- 23
CREATE TABLE compatibility_logs (
    id SERIAL PRIMARY KEY,
    build_id INT REFERENCES pc_builds(id),
    message TEXT
);

-- 24
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id)
);

-- 25
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id),
    product_id INT REFERENCES products(id),
    quantity INT
);

-- 26
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total NUMERIC,
    status_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 27
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    quantity INT,
    price NUMERIC
);

-- 28
CREATE TABLE order_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

-- 29
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    amount NUMERIC,
    status VARCHAR(50)
);

-- 30
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

-- 31
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    payment_id INT REFERENCES payments(id),
    transaction_code VARCHAR(255)
);

-- 32
CREATE TABLE shipping_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

-- 33
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    shipping_method_id INT REFERENCES shipping_methods(id),
    status VARCHAR(50)
);

-- 34
CREATE TABLE order_logs (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    message TEXT
);

-- 35
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    comment TEXT
);

-- 36
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    rating INT
);

-- 37
CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id)
);

-- 38
CREATE TABLE wishlist_items (
    id SERIAL PRIMARY KEY,
    wishlist_id INT REFERENCES wishlists(id),
    product_id INT REFERENCES products(id)
);

-- 39
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    message TEXT
);

-- 40
CREATE TABLE statistics (
    id SERIAL PRIMARY KEY,
    total_orders INT,
    total_revenue NUMERIC
);

-- =========================
-- SEED DATA
-- =========================

-- USERS
INSERT INTO users (id, email, password) VALUES
(1, 'admin@gmail.com', '123456'),
(2, 'user@gmail.com', '123456');

-- ROLES
INSERT INTO roles (id, name) VALUES
(1, 'admin'),
(2, 'user');

-- USER ROLES
INSERT INTO user_roles VALUES
(1,1),(2,2);

-- PERMISSIONS
INSERT INTO permissions (id, name) VALUES
(1,'manage_products'),
(2,'manage_orders');

-- ROLE PERMISSIONS
INSERT INTO role_permissions VALUES
(1,1),(1,2);

-- PROFILE
INSERT INTO user_profiles (user_id, full_name, phone) VALUES
(1,'Admin','0123456789'),
(2,'User','0987654321');

-- ADDRESS
INSERT INTO addresses (user_id, address) VALUES
(1,'HCM'),
(2,'Hanoi');

-- CATEGORY
INSERT INTO categories (id,name) VALUES
(1,'CPU'),(2,'GPU'),(3,'RAM'),(4,'Gaming Gear');

-- BRAND
INSERT INTO brands (id,name) VALUES
(1,'Intel'),(2,'AMD'),(3,'NVIDIA'),(4,'Logitech'),(5,'Razer'),(6,'Akko');

-- PRODUCTS
INSERT INTO products (id,name,price,category_id,brand_id) VALUES
(1,'Intel i5',5000000,1,1),
(2,'Ryzen 5',4500000,1,2),
(3,'RTX 3060',8000000,2,3),
(4,'Razer Viper V3 Pro',2790000,4,5),
(5,'Logitech G Pro X Superlight 2',3390000,4,4),
(6,'Akko MOD 007 HE',3290000,4,6);

-- PRODUCT IMAGE
INSERT INTO product_images (product_id,url) VALUES
(1,'/uploads/i5.png'),
(2,'/uploads/ryzen.png'),
(4,'/uploads/chuot-khong-day-razer-viper-v3-pro-se.jpg'),
(5,'/uploads/chu-t-khong-day-sieu-nh-logitech-g-pro-x-superlight-2c-wireless-1194149405.webp'),
(6,'/uploads/download-5-a5e4dd2f-f077-448c-9eca-ecbf1cfb6dc1.webp');

-- SPECS
INSERT INTO product_specs (product_id,spec_key,spec_value) VALUES
(1,'cores','6'),
(2,'cores','6'),
(4,'type','mouse'),
(5,'type','mouse-wireless'),
(6,'type','keyboard-he');

-- STOCK
INSERT INTO stock (product_id,quantity) VALUES
(1,10),(2,15),(3,5),(4,25),(5,22),(6,18);

-- SUPPLIER
INSERT INTO suppliers (id,name) VALUES
(1,'Supplier A');

INSERT INTO product_supplier VALUES
(1,1),(2,1),(4,1),(5,1),(6,1);

-- CART
INSERT INTO carts (id,user_id) VALUES
(1,2);

INSERT INTO cart_items (cart_id,product_id,quantity) VALUES
(1,1,1);

-- ORDER STATUS
INSERT INTO order_status (id,name) VALUES
(1,'Pending'),
(2,'Completed');

-- ORDER
INSERT INTO orders (id,user_id,total,status_id) VALUES
(1,2,5000000,1);

-- ORDER ITEMS
INSERT INTO order_items (order_id,product_id,quantity,price) VALUES
(1,1,1,5000000);

-- PAYMENT
INSERT INTO payment_methods (id,name) VALUES
(1,'COD');

INSERT INTO payments (order_id,amount,status) VALUES
(1,5000000,'paid');

-- SHIPPING
INSERT INTO shipping_methods (id,name) VALUES
(1,'Standard');

INSERT INTO shipments (order_id,shipping_method_id,status) VALUES
(1,1,'shipping');

-- BUILD PC
INSERT INTO pc_builds (id,user_id,name) VALUES
(1,2,'Gaming PC');

INSERT INTO pc_build_items (build_id,product_id) VALUES
(1,1),(1,3);

-- COMPATIBILITY
INSERT INTO compatibility_rules (product_a,product_b,is_compatible) VALUES
(1,3,true);

INSERT INTO compatibility_logs (build_id,message) VALUES
(1,'Compatible');

-- REVIEW
INSERT INTO reviews (user_id,product_id,comment) VALUES
(2,1,'Good');

INSERT INTO ratings (user_id,product_id,rating) VALUES
(2,1,5);

-- WISHLIST
INSERT INTO wishlists (id,user_id) VALUES
(1,2);

INSERT INTO wishlist_items (wishlist_id,product_id) VALUES
(1,3);

-- NOTIFICATION
INSERT INTO notifications (user_id,message) VALUES
(2,'Order created');

-- STATISTICS
INSERT INTO statistics (total_orders,total_revenue) VALUES
(1,5000000);
