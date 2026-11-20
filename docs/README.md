# Afghan Connect – Database

This folder contains the initial PostgreSQL database design for Afghan Connect.

## Files

- `schema.sql` – creates tables, foreign keys, constraints, indexes, and `updated_at` triggers.
- `seed.sql` – inserts the four roles and a sample multilingual category hierarchy.
- `ERD.md` – explains the main entity relationships.

## Requirements

- PostgreSQL 14 or newer recommended.
- pgAdmin or `psql`.
- No ORM is used. The backend will connect using the Node.js `pg` package and parameterized SQL.

## Create the database in pgAdmin

1. Open pgAdmin and connect to your PostgreSQL server.
2. Create a database named `afghan_connect`.
3. Select that database and open **Tools → Query Tool**.
4. Open and execute `schema.sql`.
5. After it completes successfully, open and execute `seed.sql`.
6. Refresh **Schemas → public → Tables** to see the created tables.

Run `schema.sql` only in a new/empty database. It is an initial schema, not a migration script. Do not repeatedly execute it on a database that already contains these tables.

## Important relationship design

### Users and roles
`users.role_id` references `roles.id`. A user has one role. Seller and courier profile tables are one-to-one extensions of a user account. The backend must verify that the linked user's role is `seller` or `courier` before creating those profiles.

### Separate shopping and services sections
The application has two distinct customer-facing sections:
- **Marketplace / Shopping:** physical products for buying and selling, such as electronics, clothing, home and kitchen items, food, beauty products, and sports goods.
- **Home & Professional Services:** customers request a service provider for tasks such as TV installation, satellite dish setup/repair, plumbing, electrical work, appliance repair, carpentry, house painting, home cleaning, and internet/network setup.

Both sections use the same hierarchical `categories` table, but `category_type` distinguishes `product`, `service`, and `both`. Product category queries must filter by `category_type IN ('product', 'both')`; service category queries must filter by `category_type IN ('service', 'both')`. This keeps category management normalized while ensuring the frontend displays separate shopping and services navigation.

`categories.parent_id` references `categories.id`, allowing parent/child nesting. Category names have separate Dari, English, and Pashto columns.

### Products and services
Products and services are separate tables. Each listing belongs to a seller profile and a category. Images are stored in separate child tables.

### Cart
Each customer can have one active cart. Each cart item must reference exactly one product OR one service. This rule is enforced by a database CHECK constraint.

### Multi-vendor checkout
A customer checkout is stored in `orders`. The backend splits its contents into one `seller_orders` row per seller. Each seller-specific order contains its own `order_items` and can have its own delivery assignment. This avoids mixing fulfillment responsibilities between sellers.

### Order history
`order_items` stores a snapshot of the item name, description, and price at purchase time. Product/service references use `ON DELETE RESTRICT`; listings should be deactivated rather than physically deleted so historical orders and reviews remain consistent.

### Delivery
Each `seller_orders` row can have one `deliveries` row. A delivery may be assigned to a courier profile. Delivery status changes should also be recorded in `order_status_history`.

### Chat
A conversation has multiple participants. Messages belong to a conversation and identify their sender. `message_reads` tracks read status per recipient. Socket.IO will deliver new-message events; PostgreSQL remains the persistent message store.

### Notifications
Notifications are stored per user. Socket.IO can push them in real time, while the database keeps their history and read/unread state.

### Reviews
A review references a completed order item and can target one product or one service. The backend must verify that the order belongs to the reviewing customer and is delivered/completed before accepting a review.

### Coupons and payments
Coupons and coupon usage are stored separately. Payment attempts are recorded in `payment_transactions`. For the first MVP, cash on delivery can be implemented without a live payment gateway.

## Critical backend rules

The database constraints protect important relationships, but the backend must still enforce business rules:

- Verify user roles for every protected operation.
- Verify a seller owns the product/service they edit.
- Verify cart items are active and available before checkout.
- Create the parent order, seller orders, order items, coupon usage, stock changes, and cart conversion inside a PostgreSQL transaction.
- Split a multi-seller cart into seller-specific orders.
- Do not trust prices or totals sent by the browser; recalculate them from the database.
- Validate coupon dates, limits, seller scope, and minimum amount.
- Verify conversation membership before a user reads or sends messages.
- Verify courier assignment and valid delivery-state transitions.
- Create status-history records whenever order or delivery status changes.
- Use parameterized SQL queries through `pg`; never concatenate user input into SQL.
- Validate uploaded files in the backend. Store file paths/URLs in the database, not file binary data.
- Keep secrets and database credentials in the backend `.env`, never in frontend code.

## Known MVP simplifications

- Product/service descriptions are currently stored in one language. The interface itself supports three languages. Translated listing content can be added later with JSONB or translation tables.
- Courier location is not live GPS tracking. The MVP stores assignment and delivery status updates.
- Payment gateway integration is not included initially; cash on delivery and transaction records are supported.
- Seller payout/commission accounting is not included in this first schema.
- The database cannot by itself guarantee every cross-table business rule (for example, checking a user's role in a separate table). Those checks belong in backend services and transactions.

## Suggested implementation order

1. Connect backend to PostgreSQL.
2. Implement authentication and role authorization.
3. Implement categories, seller profiles, products, and services.
4. Implement cart and transactional multi-vendor checkout.
5. Implement deliveries and status history.
6. Implement chat and notifications with Socket.IO.
7. Implement coupons, reviews, wishlist, comparisons, and analytics.
8. Connect all frontend forms, filters, tables, dashboards, and detail pages to real API endpoints.

## Existing database migration

If the database was created before the payment-consistency update, run `migrations/001_one_open_payment_per_order.sql` once (it also adds the `failed` parent-order status). Before running it, verify that each order has at most one payment transaction whose status is `pending` or `successful`; resolve duplicates first. Fresh installations already create this index through `schema.sql`.
