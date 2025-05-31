-- Create database if not exists
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blog;

-- Create initial admin user (password: admin123)
-- This will be inserted after tables are created by Alembic
-- Password hash for 'admin123' using bcrypt
-- INSERT INTO users (username, email, password_hash) VALUES 
-- ('admin', 'admin@example.com', '$2b$12$YourHashHere');