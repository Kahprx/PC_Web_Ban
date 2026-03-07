

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    stock INT NOT NULL,
    image VARCHAR(255),
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category FOREIGN KEY (category_id)
        REFERENCES categories(id)
);

-- ORDERS
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES users(id)
);

-- ORDER ITEMS
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    CONSTRAINT fk_order FOREIGN KEY (order_id)
        REFERENCES orders(id),
    CONSTRAINT fk_product FOREIGN KEY (product_id)
        REFERENCES products(id)
);
CREATE TABLE cart_items(
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
product_id INT,
quantity INT
);

CREATE TABLE reviews(
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
product_id INT,
rating INT,
comment TEXT
);

CREATE TABLE wishlist(
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
product_id INT
);

CREATE TABLE comments(
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
product_id INT,
content TEXT
);

CREATE TABLE payments(
id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
method VARCHAR(50),
status VARCHAR(50)
);