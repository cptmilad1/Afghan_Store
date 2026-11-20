# Afghan Connect – Main ERD

```mermaid
erDiagram
    ROLES ||--o{ USERS : assigns
    USERS ||--o{ USER_ADDRESSES : has
    USERS ||--o| SELLER_PROFILES : extends
    USERS ||--o| COURIER_PROFILES : extends
    CATEGORIES ||--o{ CATEGORIES : parent_of
    SELLER_PROFILES ||--o{ PRODUCTS : lists
    SELLER_PROFILES ||--o{ SERVICES : offers
    CATEGORIES ||--o{ PRODUCTS : classifies
    CATEGORIES ||--o{ SERVICES : classifies
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    SERVICES ||--o{ SERVICE_IMAGES : has
    USERS ||--o{ CARTS : owns
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS o|--o{ CART_ITEMS : selected_as
    SERVICES o|--o{ CART_ITEMS : selected_as
    USERS ||--o{ ORDERS : places
    USER_ADDRESSES o|--o{ ORDERS : delivery_address
    COUPONS o|--o{ ORDERS : applied
    ORDERS ||--o{ SELLER_ORDERS : splits_into
    SELLER_PROFILES ||--o{ SELLER_ORDERS : fulfills
    SELLER_ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS o|--o{ ORDER_ITEMS : snapshot_source
    SERVICES o|--o{ ORDER_ITEMS : snapshot_source
    SELLER_ORDERS ||--o| DELIVERIES : delivery
    COURIER_PROFILES o|--o{ DELIVERIES : assigned
    ORDERS ||--o{ PAYMENT_TRANSACTIONS : payments
    ORDERS ||--o{ ORDER_STATUS_HISTORY : history
    CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : includes
    USERS ||--o{ CONVERSATION_PARTICIPANTS : participates
    CONVERSATIONS ||--o{ MESSAGES : contains
    USERS ||--o{ MESSAGES : sends
    MESSAGES ||--o{ MESSAGE_ATTACHMENTS : attaches
    MESSAGES ||--o{ MESSAGE_READS : read_receipts
    USERS ||--o{ NOTIFICATIONS : receives
    ORDER_ITEMS ||--o| REVIEWS : reviewed
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ WISHLIST_ITEMS : saves
    PRODUCTS o|--o{ WISHLIST_ITEMS : saved_product
    SERVICES o|--o{ WISHLIST_ITEMS : saved_service
    USERS ||--o{ PRODUCT_COMPARISONS : creates
    PRODUCT_COMPARISONS ||--o{ PRODUCT_COMPARISON_ITEMS : contains
    PRODUCTS ||--o{ PRODUCT_COMPARISON_ITEMS : compared
    COUPONS ||--o{ COUPON_USAGES : redeemed
    USERS ||--o{ COUPON_USAGES : redeems
```

## How the important flow works

1. A customer has a cart. Each cart line references one product or one service.
2. At checkout, the backend recalculates prices and creates one parent `orders` record.
3. The backend groups cart lines by seller and creates one `seller_orders` record per seller.
4. Each seller order receives its own `order_items` and delivery record.
5. A courier can be assigned to each seller order's delivery.
6. Status changes are written to `order_status_history`.
7. Chat messages are stored in PostgreSQL and broadcast through Socket.IO.
