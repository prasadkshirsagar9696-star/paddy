-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS petrol_pump_db;

-- Select the database to use
USE petrol_pump_db;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);

-- Create Fuel Stock table
CREATE TABLE IF NOT EXISTS fuel_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  stock_liters DECIMAL(10,2) NOT NULL
);

-- Create Employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(20)
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fuel_id INT NOT NULL,
  quantity_liters DECIMAL(10,2) NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  customer_name VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fuel_id) REFERENCES fuel_stock(id) ON DELETE CASCADE
);

-- Seed Admin
INSERT IGNORE INTO admins (username, password_hash)
VALUES (
  'admin',
  '$2b$10$3h4t2gkA5P3mUqE9m3KqEO9v2T0Q8q7zT2/pu2m9aY5yJ2a2QpVw2'
);

-- Seed Fuel Types
INSERT IGNORE INTO fuel_stock (id, type, price_per_liter, stock_liters) VALUES
  (1, 'Petrol', 102.50, 1000.0),
  (2, 'Diesel', 90.75, 1200.0),
  (3, 'Gas', 78.20, 800.0);
