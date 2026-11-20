-- Afghan Connect seed data
-- Run after schema.sql in the same database.
-- This seed file creates roles and a multilingual category tree only.
-- Real login users should be created with valid password hashes by the backend.

BEGIN;

INSERT INTO roles (role_name, description) VALUES
('admin', 'Platform administrator'),
('seller', 'Marketplace seller or service provider'),
('customer', 'Marketplace customer'),
('courier', 'Delivery courier')
ON CONFLICT (role_name) DO NOTHING;

-- Main categories
INSERT INTO categories (name_prs, name_en, name_ps, slug, category_type, sort_order)
VALUES
('الکترونیک', 'Electronics', 'برېښنايي وسایل', 'electronics', 'product', 1),
('خانه و آشپزخانه', 'Home and Kitchen', 'کور او پخلنځی', 'home-kitchen', 'product', 2),
('پوشاک', 'Clothing', 'جامې', 'clothing', 'product', 3),
('خوراکی و مواد غذایی', 'Food and Groceries', 'خواړه او خوراکي توکي', 'food-groceries', 'product', 4),
('زیبایی و مراقبت شخصی', 'Beauty and Personal Care', 'ښکلا او شخصي پاملرنه', 'beauty-personal-care', 'both', 5),
('ورزش', 'Sports', 'ورزش', 'sports', 'product', 6),
('خدمات', 'Services', 'خدمات', 'services', 'service', 7)
ON CONFLICT (slug) DO NOTHING;

-- Product subcategories (shopping / buying and selling)
INSERT INTO categories (parent_id, name_prs, name_en, name_ps, slug, category_type, sort_order)
SELECT c.id, v.name_prs, v.name_en, v.name_ps, v.slug, v.category_type, v.sort_order
FROM (VALUES
    ('electronics', 'موبایل و لوازم جانبی', 'Mobile Phones and Accessories', 'موبایلونه او لوازم', 'mobile-accessories', 'product', 1),
    ('electronics', 'لپ‌تاپ', 'Laptops', 'لېپټاپونه', 'laptops', 'product', 2),
    ('electronics', 'کمپیوتر', 'Computers', 'کمپیوټرونه', 'computers', 'product', 3),
    ('home-kitchen', 'لوازم آشپزخانه', 'Kitchen Appliances', 'د پخلنځي وسایل', 'kitchen-appliances', 'product', 1),
    ('clothing', 'لباس مردانه', 'Men Clothing', 'د نارینه‌وو جامې', 'men-clothing', 'product', 1),
    ('clothing', 'لباس زنانه', 'Women Clothing', 'د ښځو جامې', 'women-clothing', 'product', 2)
) AS v(parent_slug, name_prs, name_en, name_ps, slug, category_type, sort_order)
JOIN categories c ON c.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Service subcategories (home services and professional services)
INSERT INTO categories (parent_id, name_prs, name_en, name_ps, slug, category_type, sort_order)
SELECT c.id, v.name_prs, v.name_en, v.name_ps, v.slug, v.category_type, v.sort_order
FROM (VALUES
    ('services', 'نصب تلویزیون', 'TV Installation', 'د تلویزیون نصب', 'tv-installation', 'service', 1),
    ('services', 'نصب و تنظیم دیش ماهواره', 'Satellite Dish Installation and Setup', 'د سپوږمکۍ ډش نصب او تنظیم', 'satellite-dish-service', 'service', 2),
    ('services', 'لوله‌کشی و نلدوانی', 'Plumbing', 'نلدواني', 'plumbing', 'service', 3),
    ('services', 'برق‌کاری ساختمان', 'Home Electrical Services', 'د کور برېښنايي خدمات', 'home-electrical', 'service', 4),
    ('services', 'ترمیم وسایل خانه', 'Home Appliance Repair', 'د کورنیو وسایلو ترمیم', 'appliance-repair', 'service', 5),
    ('services', 'نجاری و کارهای چوبی', 'Carpentry and Woodwork', 'نجاري او د لرګیو کارونه', 'carpentry', 'service', 6),
    ('services', 'رنگ‌مالی و نقاشی ساختمان', 'House Painting', 'د کور رنګمالي', 'house-painting', 'service', 7),
    ('services', 'نظافت و پاک‌کاری خانه', 'Home Cleaning', 'د کور پاک‌کاري', 'home-cleaning', 'service', 8),
    ('services', 'نصب و راه‌اندازی اینترنت و شبکه', 'Internet and Network Setup', 'د انټرنېټ او شبکې نصب', 'internet-network-setup', 'service', 9),
    ('services', 'خدمات کمپیوتر', 'Computer Services', 'د کمپیوټر خدمات', 'computer-services', 'service', 10),
    ('services', 'تعمیرات عمومی خانه', 'General Home Repairs', 'د کور عمومي ترمیمات', 'general-home-repairs', 'service', 11)
) AS v(parent_slug, name_prs, name_en, name_ps, slug, category_type, sort_order)
JOIN categories c ON c.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

COMMIT;
