CREATE TABLE IF NOT EXISTS products (
    sku VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
    image VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_keys (
    id VARCHAR(64) PRIMARY KEY,
    product_sku VARCHAR(64) NOT NULL REFERENCES products(sku),
    key_code VARCHAR(255) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    order_id VARCHAR(64),
    assigned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keys_sku_unused ON product_keys (product_sku) WHERE is_used = FALSE;

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64) NOT NULL REFERENCES products(sku),
    status VARCHAR(32) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    original_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
    promo_code VARCHAR(64),
    key_code VARCHAR(255),
    provider_used VARCHAR(8),
    error_message TEXT,
    delivery_attempts INT NOT NULL DEFAULT 0,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
    event_id VARCHAR(128) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promocodes (
    code VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'RUB',
    max_uses INT NOT NULL,
    used_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS provider_requests (
    request_id VARCHAR(128) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    provider VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL,
    code VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
