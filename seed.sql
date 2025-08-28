CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  api_key TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO users (email, password, api_key, is_active) VALUES
('user_a@domain.com', 'password_a', 'api_key_a', true),
('user_b@domain.com', 'password_b', 'api_key_b', false)
ON CONFLICT (email) DO NOTHING;