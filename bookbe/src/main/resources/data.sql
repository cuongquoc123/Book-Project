-- Migration data cho tai khoan Super Admin
-- Username: supper, Password: 123 (Da ma hoa BCrypt)
INSERT INTO users (username, password, email, full_name, role, created_at, updated_at)
SELECT 'supper', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9t9sA.O7x41.Huy', 'supper@example.com', 'Super Admin', 'SUPER_ADMIN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'supper');
