# Afghan Connect Backend – Setup and Frontend API Contract

This backend is written for the supplied PostgreSQL `schema.sql` and `seed.sql`. It does not create or alter database tables. Run `schema.sql` once on a new empty `afghan_connect` database, then run `seed.sql` in that same database.

## 1. Install and run

Requirements: Node.js 18+, PostgreSQL 14+.

```bash
npm install
```

Copy `.env.example` to `.env`, then set your actual PostgreSQL password and a random JWT secret of at least 32 characters. Never commit `.env`.

```bash
npm run dev
```

Base URL: `http://localhost:5000/api/v1`
Health: `GET /api/v1/health`

The archive includes `package.json`. If you already have a backend `package.json`, merge the listed dependencies rather than blindly overwriting your existing scripts/configuration. The new upload endpoint requires `multer`.

## 2. Authentication and response format

Register/login return `{ success, message, data: { token, user } }`. Send the token on protected endpoints:

`Authorization: Bearer YOUR_TOKEN`

Normal response: `{ success: true, message: "...", data: ... }`
Error response: `{ success: false, message: "...", details?: ... }`

PostgreSQL BIGINT IDs are returned as strings. Keep them as strings in React state and when sending them back; do not parse them with `Number()`.

Public registration creates a `customer` only. A seller must submit an application and wait for admin approval. A courier must submit a profile and be activated by an admin. A frontend must never send a role to public registration.

## 3. Endpoint contract

All paths below are appended to `/api/v1`.

### Auth and account

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register customer: `full_name`, `email` or `phone`, `password`, optional `preferred_language` (`prs`,`ps`,`en`) |
| POST | `/auth/login` | Public | Login: `identifier`, `password` |
| GET | `/users/me` | Auth | Current account |
| PATCH | `/users/me` | Auth | Update `full_name`, `preferred_language` |
| PATCH | `/users/me/password` | Auth | Change password with `old_password`, `new_password` (minimum 8 characters) |
| GET | `/users` | Admin | List users (max 100) |
| PATCH | `/users/:id/status` | Admin | Set `account_status`: active, pending, suspended, disabled |
| PATCH | `/users/:id/role` | Admin | Assign an authorized role; seller/courier profile requirements are checked |
| GET | `/roles` | Admin | Seeded roles |
| GET/POST/PATCH/DELETE | `/addresses` and `/addresses/:id` | Auth | Manage the current user's addresses |

### Seller and courier onboarding

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/seller-profiles/me` | Auth | Current seller application/profile |
| POST | `/seller-profiles/apply` | Auth | Apply with `store_name`, `store_slug`; optional description/logo/province/city |
| PATCH | `/seller-profiles/me` | Auth | Edit own store profile |
| GET | `/seller-profiles/applications` | Admin | Review applications |
| PATCH | `/seller-profiles/:id/decision` | Admin | `approval_status`: approved, rejected, suspended |
| GET | `/courier-profiles/me` | Auth | Own courier profile |
| POST | `/courier-profiles/apply` | Auth | Apply with optional vehicle and service-area fields |
| PATCH | `/courier-profiles/me` | Auth | Edit own courier details |
| GET | `/courier-profiles` | Admin | List couriers |
| PATCH | `/courier-profiles/:id/activate` | Admin | Activate courier role |
| PATCH | `/courier-profiles/:id/status` | Admin | available, busy, offline, suspended |

### Categories, products, services and images

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/categories` | Public | Active categories; optional `category_type`, `parent_id`, `slug`, `page`, `limit` |
| GET | `/categories/:id` | Public | Active category details |
| POST/PATCH/DELETE | `/categories` or `/categories/:id` | Admin | Create/update/deactivate category; DELETE is soft deactivation |
| GET | `/products` | Public | Active product catalogue; optional `category_id`, `seller_id`, `condition_status`, `search`, `min_price`, `max_price`, `page`, `limit` |
| GET | `/products/:id` | Public | Product details and image array |
| GET | `/products/seller/mine` | Approved seller | Own products, including drafts/pending |
| GET | `/products/admin/all` | Admin | All products including pending |
| POST | `/products` | Approved seller | Create product; fields: `category_id`, `name`, `slug`, `description`, `price`, optional `sku`, `compare_at_price`, `stock_quantity`, `condition_status` |
| PATCH/DELETE | `/products/:id` | Owner seller/Admin | Update or deactivate own product; seller edits return listing to pending |
| POST | `/products/:id/images` | Owner seller/Admin | Add image: `image_url`, optional `alt_text`, `is_primary`, `sort_order` |
| PATCH | `/products/:id/approve` | Admin | `listing_status`: active, rejected, inactive; optional `is_featured` |
| GET | `/services` | Public | Active service catalogue; optional `category_id`, `seller_id`, `pricing_type`, `search`, `city`, `page`, `limit` |
| GET | `/services/:id` | Public | Service details and images |
| GET | `/services/seller/mine` | Approved seller | Own services |
| GET | `/services/admin/all` | Admin | All services including pending |
| POST | `/services` | Approved seller | Create service: `category_id`, `name`, `slug`, `description`, `price`, optional `pricing_type` (fixed/hourly/quote), duration and availability notes |
| PATCH/DELETE | `/services/:id` | Owner seller/Admin | Update or deactivate service |
| POST | `/services/:id/images` | Owner seller/Admin | Add service image |
| PATCH | `/services/:id/approve` | Admin | Set listing_status active/rejected/inactive |
| POST | `/uploads/image` | Auth | Multipart form-data field `image`; JPG/PNG/WEBP/GIF up to 5 MB. Returns public `url` |

Images are stored in the backend `uploads/` directory for local development. For production, use object storage/CDN and set `PUBLIC_BASE_URL` accordingly.

### Cart, checkout, orders and payments

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/cart` | Customer | Current active cart with items and subtotal |
| POST | `/cart/items` | Customer | Add exactly one: `product_id` or `service_id`; optional `quantity` |
| PATCH | `/cart/items/:itemId` | Customer | Change `quantity` |
| DELETE | `/cart/items/:itemId` | Customer | Remove item |
| DELETE | `/cart` | Customer | Clear active cart |
| POST | `/orders/checkout` | Customer | Body: `address_id`, optional `payment_method` (`cash_on_delivery`,`bank_transfer`,`online`,`other`), optional `coupon_code`, `customer_note`, and `service_requested_at_by_id` object keyed by service ID |
| GET | `/orders/mine` | Auth | Customer's own orders; admin sees all |
| GET | `/orders/seller/mine` | Seller/Admin | Seller sub-orders and customer contact details |
| GET | `/orders/admin/all` | Admin | Recent orders |
| GET | `/orders/:id` | Customer involved in order, seller involved, Admin | Order, seller sub-orders and order-item snapshots |
| GET | `/orders/:id/history` | Authorized order participant/Admin | Status history |
| PATCH | `/orders/:id/cancel` | Owning customer | Cancel a still-pending order; product stock is restored |
| PATCH | `/orders/seller-orders/:id/status` | Owning seller/Admin | Update seller sub-order status |
| GET | `/payments/orders/:orderId` | Order owner/Admin | Payment transactions |
| POST | `/payments/orders/:orderId/transactions` | Customer | Create a pending payment transaction |
| PATCH | `/payments/:id/status` | Admin | Record verified successful/failed/refunded result |

Checkout calculates prices from PostgreSQL, checks stock and coupon limits, creates one parent order and one seller sub-order per seller, creates order-item snapshots and delivery rows, records a pending payment transaction, and converts the cart in one database transaction. Delivery fee is currently zero because no shipping-pricing rules/provider are defined in the supplied schema.

No real bank/online payment gateway is connected. The frontend must not mark a payment successful. Only a trusted verified provider webhook or authorized admin process may update a transaction to successful. Payment transaction status defaults to pending.

### Deliveries

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/deliveries/available` | Active courier | Unassigned deliveries |
| GET | `/deliveries/mine` | Courier/Seller/Admin | Assigned/related deliveries |
| PATCH | `/deliveries/:id/claim` | Courier | Claim an available delivery |
| PATCH | `/deliveries/:id/assign` | Admin | Assign `courier_id` |
| PATCH | `/deliveries/:id/status` | Assigned courier/Admin | accepted, picked_up, in_transit, delivered, failed |

### Coupons, wishlist, reviews and comparisons

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/coupons/validate/:code` | Auth | Check active coupon metadata; checkout revalidates all rules |
| GET/POST | `/coupons` | Admin/Seller | List/create coupons; seller coupons are automatically scoped to their seller profile |
| PATCH | `/coupons/:id` | Owning seller/Admin | Update coupon including `is_active` |
| GET | `/wishlist` | Customer | List saved products/services |
| POST | `/wishlist` | Customer | Save exactly one `product_id` or `service_id` |
| DELETE | `/wishlist/:id` | Customer | Remove saved item |
| GET | `/reviews/products/:productId` | Public | Published product reviews |
| GET | `/reviews/services/:serviceId` | Public | Published service reviews |
| POST | `/reviews` | Customer | Review delivered order item: `order_item_id`, `rating` 1..5, optional `review_text` |
| PATCH | `/reviews/:id/reply` | Seller owner | Seller reply to a review for their order item |
| GET | `/comparisons` | Customer | List product comparisons |
| POST | `/comparisons` | Customer | Create comparison with optional `comparison_name` |
| GET | `/comparisons/:id` | Owner | Comparison and products |
| POST | `/comparisons/:id/items` | Owner | Add `product_id` (maximum six products) |
| DELETE | `/comparisons/:id/items/:productId` | Owner | Remove product |
| DELETE | `/comparisons/:id` | Owner | Delete comparison |

### Chat and notifications

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/chat/conversations` | Auth | User's conversations |
| POST | `/chat/conversations` | Auth | Create direct/order/support conversation; direct needs `participant_ids`; order conversations derive the actual customer and seller participants |
| GET | `/chat/conversations/:id/messages` | Participant | Latest 100 messages |
| POST | `/chat/conversations/:id/messages` | Participant | Send `body`, optional `message_type`, optional attachments array |
| PATCH | `/chat/messages/:id` | Sender | Edit own message within 15 minutes |
| DELETE | `/chat/messages/:id` | Sender | Soft-delete own message |
| POST | `/chat/conversations/:id/read` | Participant | Mark conversation messages read |
| GET | `/notifications` | Auth | Current user's notifications |
| PATCH | `/notifications/:id/read` | Owner | Mark one notification read |
| PATCH | `/notifications/read-all` | Auth | Mark all notifications read |

Chat currently uses REST endpoints and database polling; a WebSocket/Socket.IO real-time transport is not included in this delivery. Attachments require an uploaded/stored file URL; image upload endpoint is provided for image files.

## 4. Important frontend integration rules

1. Store the returned `token` and attach it as `Authorization: Bearer ...` for protected requests.
2. Use returned IDs as strings; do not convert BIGINT IDs to JavaScript numbers.
3. Use the API's returned `data` field. For list endpoints, `data` may be an array or `{ items, pagination }` as documented by each endpoint.
4. Public product/service lists return only `listing_status='active'`. Sellers use `/seller/mine` to see their own pending/draft listings.
5. Seller and courier roles are assigned only after the admin approval/activation endpoints.
6. Do not send `seller_id`, `customer_id`, `user_id`, `role_id`, order totals, product prices, payment success states, or delivery ownership as trusted values. The backend derives ownership and recalculates checkout prices.
7. Checkout requires an address belonging to the logged-in customer. The frontend should create/select an address first.
8. The current delivery fee is 0 AFN; it is not yet a configurable shipping calculation.
9. API does not yet implement password reset/OTP/email verification, external payment gateway webhooks, shipping-provider integration, Socket.IO live chat, or production cloud file storage. These require provider/business rules not present in the supplied SQL schema.

## 5. Database compatibility

The code uses the supplied table and column names, including `seller_profiles.id` as `products.seller_id` / `services.seller_id`, `BIGINT` IDs, multilingual category columns, `order_items` snapshots, `seller_orders`, `payment_transactions`, `deliveries`, and the existing chat/review/notification tables. Fresh databases should be created from the updated `database/schema.sql`. Existing databases must apply `database/migrations/001_one_open_payment_per_order.sql` once.

## Order, stock, courier, and payment consistency rules

The order workflow uses transaction-safe state changes:

- Customer cancellation is allowed only while every seller sub-order is still `pending`.
- Seller sub-orders follow an explicit transition map. Terminal states (`delivered`, `cancelled`, `failed`) cannot be reopened.
- Product stock is restored only inside the transaction that changes a seller sub-order to `cancelled`; a second cancellation request is rejected, preventing duplicate stock restoration.
- Parent order status is recalculated from seller sub-order statuses and recorded in `order_status_history`.
- Couriers become `busy` when a delivery is claimed or assigned. A delivery can be assigned only after the seller marks the sub-order `ready` (or `out_for_delivery`).
- Delivery statuses follow the sequence `awaiting_assignment -> assigned/accepted -> picked_up -> in_transit -> delivered`; invalid jumps and reopening terminal delivery states are rejected.
- Courier availability returns to `available` after a delivery is `delivered` or `failed`, unless that courier has another active delivery.
- A new payment attempt is blocked while another payment is pending or successful. Payment status changes and order payment status updates run in one database transaction.
- Admin payment transitions are limited to `pending -> successful/failed` and `successful -> refunded`.

For an existing database, run `database/migrations/001_one_open_payment_per_order.sql` (adds the terminal parent-order status `failed` and the payment uniqueness index) once after checking that no order has more than one payment transaction in `pending` or `successful` state. Fresh databases receive the matching partial unique index directly from `database/schema.sql`.
