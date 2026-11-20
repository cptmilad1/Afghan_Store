-- Afghan Connect - PostgreSQL database schema
-- Run this file in pgAdmin Query Tool against a NEW, empty database.
-- PostgreSQL 14+ recommended.
-- Money is stored as NUMERIC and currency defaults to AFN.
-- Products/services are deactivated instead of hard-deleted so order history remains intact.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Common tables: roles, users, addresses, seller/courier profiles
-- ---------------------------------------------------------------------------

CREATE TABLE roles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT roles_name_check CHECK (role_name IN ('admin', 'seller', 'customer', 'courier'))
);

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30) UNIQUE,
    password_hash TEXT NOT NULL,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'prs',
    account_status VARCHAR(20) NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT users_language_check CHECK (preferred_language IN ('prs', 'en', 'ps')),
    CONSTRAINT users_status_check CHECK (account_status IN ('active', 'pending', 'suspended', 'disabled'))
);

CREATE TABLE user_addresses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    street_address TEXT NOT NULL,
    additional_directions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seller_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    store_name VARCHAR(160) NOT NULL,
    store_slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    province VARCHAR(100),
    city VARCHAR(100),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT seller_approval_check CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'))
);

CREATE TABLE courier_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    vehicle_type VARCHAR(50),
    vehicle_identifier VARCHAR(80),
    availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
    service_area TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT courier_availability_check CHECK (availability_status IN ('available', 'busy', 'offline', 'suspended'))
);

-- ---------------------------------------------------------------------------
-- 2. Catalog: hierarchical categories, products, services and images
-- ---------------------------------------------------------------------------

CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id BIGINT REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name_prs VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    name_ps VARCHAR(120) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    category_type VARCHAR(20) NOT NULL DEFAULT 'both',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT categories_type_check CHECK (category_type IN ('product', 'service', 'both')),
    CONSTRAINT categories_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES seller_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    sku VARCHAR(80),
    price NUMERIC(12,2) NOT NULL,
    compare_at_price NUMERIC(12,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    condition_status VARCHAR(20) NOT NULL DEFAULT 'new',
    listing_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_price_check CHECK (price >= 0),
    CONSTRAINT products_compare_price_check CHECK (compare_at_price IS NULL OR compare_at_price >= price),
    CONSTRAINT products_stock_check CHECK (stock_quantity >= 0),
    CONSTRAINT products_condition_check CHECK (condition_status IN ('new', 'used', 'refurbished')),
    CONSTRAINT products_status_check CHECK (listing_status IN ('draft', 'pending', 'active', 'rejected', 'inactive')),
    CONSTRAINT products_seller_sku_unique UNIQUE (seller_id, sku)
);

CREATE TABLE product_images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES seller_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    pricing_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
    estimated_duration_minutes INTEGER,
    availability_notes TEXT,
    listing_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT services_price_check CHECK (price >= 0),
    CONSTRAINT services_pricing_check CHECK (pricing_type IN ('fixed', 'hourly', 'quote')),
    CONSTRAINT services_duration_check CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
    CONSTRAINT services_status_check CHECK (listing_status IN ('draft', 'pending', 'active', 'rejected', 'inactive'))
);

CREATE TABLE service_images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id) ON UPDATE CASCADE ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Cart, coupons and checkout
-- ---------------------------------------------------------------------------

CREATE TABLE carts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    cart_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT carts_status_check CHECK (cart_status IN ('active', 'converted', 'abandoned'))
);

CREATE UNIQUE INDEX one_active_cart_per_customer
    ON carts(customer_id) WHERE cart_status = 'active';

CREATE TABLE cart_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    service_id BIGINT REFERENCES services(id) ON UPDATE CASCADE ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cart_item_exactly_one_target CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
    ),
    CONSTRAINT cart_item_quantity_check CHECK (quantity > 0)
);

CREATE UNIQUE INDEX cart_product_unique ON cart_items(cart_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX cart_service_unique ON cart_items(cart_id, service_id) WHERE service_id IS NOT NULL;

CREATE TABLE coupons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id BIGINT REFERENCES seller_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(12,2) NOT NULL,
    minimum_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    maximum_discount_amount NUMERIC(12,2),
    usage_limit INTEGER,
    per_customer_limit INTEGER NOT NULL DEFAULT 1,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coupons_type_check CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT coupons_value_check CHECK (
        (discount_type = 'percentage' AND discount_value > 0 AND discount_value <= 100) OR
        (discount_type = 'fixed' AND discount_value > 0)
    ),
    CONSTRAINT coupons_minimum_check CHECK (minimum_order_amount >= 0),
    CONSTRAINT coupons_limits_check CHECK (
        (usage_limit IS NULL OR usage_limit > 0) AND per_customer_limit > 0
    ),
    CONSTRAINT coupons_dates_check CHECK (expires_at > starts_at)
);

-- One parent checkout can contain seller-specific sub-orders.
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    address_id BIGINT REFERENCES user_addresses(id) ON UPDATE CASCADE ON DELETE SET NULL,
    coupon_id BIGINT REFERENCES coupons(id) ON UPDATE CASCADE ON DELETE SET NULL,
    recipient_name_snapshot VARCHAR(150) NOT NULL,
    recipient_phone_snapshot VARCHAR(30) NOT NULL,
    delivery_address_snapshot TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'AFN',
    order_status VARCHAR(25) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    customer_note TEXT,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_amounts_check CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND delivery_fee >= 0 AND total_amount >= 0
    ),
    CONSTRAINT orders_status_check CHECK (
        order_status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'partially_cancelled', 'failed')
    ),
    CONSTRAINT orders_payment_status_check CHECK (
        payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded')
    )
);

CREATE TABLE coupon_usages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    discount_amount NUMERIC(12,2) NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coupon_usage_amount_check CHECK (discount_amount >= 0)
);

CREATE TABLE seller_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    seller_id BIGINT NOT NULL REFERENCES seller_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    seller_order_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal NUMERIC(12,2) NOT NULL,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    seller_order_status VARCHAR(25) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT seller_orders_amount_check CHECK (subtotal >= 0 AND delivery_fee >= 0),
    CONSTRAINT seller_orders_status_check CHECK (
        seller_order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'failed')
    ),
    CONSTRAINT one_seller_suborder_per_checkout UNIQUE (order_id, seller_id)
);

CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_order_id BIGINT NOT NULL REFERENCES seller_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    product_id BIGINT REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    service_id BIGINT REFERENCES services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    item_type VARCHAR(20) NOT NULL,
    item_name_snapshot VARCHAR(200) NOT NULL,
    item_description_snapshot TEXT,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    line_total NUMERIC(12,2) NOT NULL,
    service_requested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT order_item_target_check CHECK (
        (item_type = 'product' AND product_id IS NOT NULL AND service_id IS NULL) OR
        (item_type = 'service' AND service_id IS NOT NULL AND product_id IS NULL)
    ),
    CONSTRAINT order_item_amount_check CHECK (
        unit_price >= 0 AND quantity > 0 AND line_total >= 0
    )
);

-- ---------------------------------------------------------------------------
-- 4. Payments, deliveries and order tracking
-- ---------------------------------------------------------------------------

CREATE TABLE payment_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    payment_method VARCHAR(30) NOT NULL,
    transaction_reference VARCHAR(120) UNIQUE,
    amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'AFN',
    transaction_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider_response JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_method_check CHECK (payment_method IN ('cash_on_delivery', 'bank_transfer', 'online', 'other')),
    CONSTRAINT payment_amount_check CHECK (amount >= 0),
    CONSTRAINT payment_status_check CHECK (transaction_status IN ('pending', 'successful', 'failed', 'refunded'))
);

-- At most one pending or successful payment may exist for an order.
CREATE UNIQUE INDEX one_open_payment_per_order_idx
    ON payment_transactions(order_id)
    WHERE transaction_status IN ('pending', 'successful');

CREATE TABLE deliveries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_order_id BIGINT NOT NULL UNIQUE REFERENCES seller_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    courier_id BIGINT REFERENCES courier_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    delivery_status VARCHAR(25) NOT NULL DEFAULT 'awaiting_assignment',
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_note TEXT,
    proof_of_delivery_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT deliveries_fee_check CHECK (delivery_fee >= 0),
    CONSTRAINT deliveries_status_check CHECK (
        delivery_status IN ('awaiting_assignment', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')
    )
);

CREATE TABLE order_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    seller_order_id BIGINT REFERENCES seller_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    changed_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. Chat and real-time messaging
-- ---------------------------------------------------------------------------

CREATE TABLE conversations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct',
    order_id BIGINT REFERENCES orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
    title VARCHAR(160),
    created_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT conversations_type_check CHECK (conversation_type IN ('direct', 'order', 'support'))
);

CREATE TABLE conversation_participants (
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON UPDATE CASCADE ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    body TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT messages_type_check CHECK (message_type IN ('text', 'image', 'file', 'system')),
    CONSTRAINT messages_body_check CHECK (body IS NOT NULL OR message_type IN ('image', 'file'))
);

CREATE TABLE message_attachments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON UPDATE CASCADE ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120),
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT message_attachment_size_check CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE TABLE message_reads (
    message_id BIGINT NOT NULL REFERENCES messages(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 6. Notifications, reviews, wishlist and product comparison
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    notification_type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    body TEXT,
    related_entity_type VARCHAR(30),
    related_entity_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_item_id BIGINT NOT NULL UNIQUE REFERENCES order_items(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    product_id BIGINT REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    service_id BIGINT REFERENCES services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    rating SMALLINT NOT NULL,
    review_text TEXT,
    seller_reply TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reviews_target_check CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
    ),
    CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE wishlist_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    service_id BIGINT REFERENCES services(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wishlist_target_check CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX wishlist_product_unique ON wishlist_items(customer_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX wishlist_service_unique ON wishlist_items(customer_id, service_id) WHERE service_id IS NOT NULL;

CREATE TABLE product_comparisons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    comparison_name VARCHAR(120) NOT NULL DEFAULT 'My comparison',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_comparison_items (
    comparison_id BIGINT NOT NULL REFERENCES product_comparisons(id) ON UPDATE CASCADE ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comparison_id, product_id)
);

-- ---------------------------------------------------------------------------
-- 7. Helpful indexes for common relationships and search/filter operations
-- ---------------------------------------------------------------------------

CREATE INDEX users_role_idx ON users(role_id);
CREATE INDEX addresses_user_idx ON user_addresses(user_id);
CREATE INDEX products_seller_idx ON products(seller_id);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_status_idx ON products(listing_status);
CREATE INDEX products_price_idx ON products(price);
CREATE INDEX product_images_product_idx ON product_images(product_id);
CREATE INDEX services_seller_idx ON services(seller_id);
CREATE INDEX services_category_idx ON services(category_id);
CREATE INDEX services_status_idx ON services(listing_status);
CREATE INDEX carts_customer_idx ON carts(customer_id);
CREATE INDEX cart_items_cart_idx ON cart_items(cart_id);
CREATE INDEX orders_customer_idx ON orders(customer_id);
CREATE INDEX orders_status_idx ON orders(order_status);
CREATE INDEX orders_placed_at_idx ON orders(placed_at DESC);
CREATE INDEX seller_orders_seller_idx ON seller_orders(seller_id);
CREATE INDEX seller_orders_status_idx ON seller_orders(seller_order_status);
CREATE INDEX order_items_seller_order_idx ON order_items(seller_order_id);
CREATE INDEX deliveries_courier_idx ON deliveries(courier_id);
CREATE INDEX deliveries_status_idx ON deliveries(delivery_status);
CREATE INDEX order_history_order_idx ON order_status_history(order_id, changed_at DESC);
CREATE INDEX conversations_order_idx ON conversations(order_id);
CREATE INDEX participants_user_idx ON conversation_participants(user_id);
CREATE INDEX messages_conversation_idx ON messages(conversation_id, sent_at DESC);
CREATE INDEX notifications_user_unread_idx ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX reviews_product_idx ON reviews(product_id);
CREATE INDEX reviews_service_idx ON reviews(service_id);
CREATE INDEX coupons_active_dates_idx ON coupons(is_active, starts_at, expires_at);

-- ---------------------------------------------------------------------------
-- 8. Automatically maintain updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER seller_profiles_set_updated_at BEFORE UPDATE ON seller_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER courier_profiles_set_updated_at BEFORE UPDATE ON courier_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER carts_set_updated_at BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER seller_orders_set_updated_at BEFORE UPDATE ON seller_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER deliveries_set_updated_at BEFORE UPDATE ON deliveries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER conversations_set_updated_at BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
