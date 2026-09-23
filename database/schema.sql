-- =========================================================
-- KrishiMart Database Schema
-- Digital Marketplace connecting Farmers directly with Consumers/Buyers
-- Run this file once in MySQL to create the database and tables.
-- =========================================================

CREATE DATABASE IF NOT EXISTS krishimart;
USE krishimart;

-- ---------------------------------------------------------
-- 1. USERS table
-- One table stores all 3 kinds of people who use the app:
-- 'farmer'   -> sells produce
-- 'consumer' -> buys small quantity for home use
-- 'buyer'    -> bulk buyer (hotel, shop, mandi trader etc.)
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('farmer', 'consumer', 'buyer', 'admin') NOT NULL,
    phone       VARCHAR(15),
    address     VARCHAR(255),
    state       VARCHAR(100),
    city        VARCHAR(100),
    latitude    DECIMAL(10,6) DEFAULT NULL,   -- used for simple route/distance calculation
    longitude   DECIMAL(10,6) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 2. PRODUCTS table
-- Every crop/product listed by a farmer
-- ---------------------------------------------------------
CREATE TABLE products (
    product_id   INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id    INT NOT NULL,
    name         VARCHAR(100) NOT NULL,
    category     VARCHAR(50),
    price        DECIMAL(10,2) NOT NULL,      -- price per unit
    unit         VARCHAR(20) DEFAULT 'kg',
    quantity     DECIMAL(10,2) NOT NULL,      -- available stock
    description  VARCHAR(255),
    image_url    VARCHAR(255) DEFAULT 'https://via.placeholder.com/300x200?text=Farm+Produce',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 3. ORDERS table
-- One row = one order placed by a consumer/buyer
-- ---------------------------------------------------------
CREATE TABLE orders (
    order_id     INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id     INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status       ENUM('placed', 'confirmed', 'out_for_delivery', 'delivered') DEFAULT 'placed',
    order_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 4. ORDER_ITEMS table
-- One order can contain many products (line items)
-- ---------------------------------------------------------
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    product_id    INT NOT NULL,
    farmer_id     INT NOT NULL,
    quantity      DECIMAL(10,2) NOT NULL,
    price         DECIMAL(10,2) NOT NULL,     -- price at time of order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- Sample data so the app is not empty on first run
-- (password for all sample users is: 123456)
-- ---------------------------------------------------------
INSERT INTO users (name, email, password, role, phone, city, latitude, longitude) VALUES
('Ramesh Kumar', 'ramesh@krishimart.com', '123456', 'farmer', '9800000001', 'Nadia', 23.47, 88.55),
('Sita Devi', 'sita@krishimart.com', '123456', 'farmer', '9800000002', 'Bardhaman', 23.25, 87.85),
('Anjali Roy', 'anjali@krishimart.com', '123456', 'consumer', '9800000003', 'Kolkata', 22.57, 88.36),
('Green Hotel Pvt Ltd', 'buyer@krishimart.com', '123456', 'buyer', '9800000004', 'Kolkata', 22.58, 88.40);

INSERT INTO products (farmer_id, name, category, price, unit, quantity, description) VALUES
(1, 'Tomato', 'Vegetable', 18.00, 'kg', 200, 'Fresh farm tomatoes, harvested this week'),
(1, 'Potato', 'Vegetable', 15.00, 'kg', 500, 'Good quality potatoes'),
(2, 'Rice (Basmati)', 'Grain', 55.00, 'kg', 1000, 'Locally grown basmati rice'),
(2, 'Mustard Oil', 'Oil', 140.00, 'litre', 100, 'Cold pressed mustard oil');
