CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
  username TEXT NOT NULL,
  username_normalized TEXT GENERATED ALWAYS AS (lower(trim(username))) STORED,
  password_hash TEXT NOT NULL,
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_users_email_unique UNIQUE (email_normalized),
  CONSTRAINT app_users_username_unique UNIQUE (username_normalized)
);
CREATE INDEX IF NOT EXISTS app_users_email_idx ON app_users (email_normalized);
CREATE INDEX IF NOT EXISTS app_users_username_idx ON app_users (username_normalized);
