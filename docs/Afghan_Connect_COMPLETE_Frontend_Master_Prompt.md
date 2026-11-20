# MASTER PROMPT --- ساخت کامل Frontend پروژه Afghan Connect

**این تنها پرامپت اصلی پروژه است.** تمام بخش‌های این سند را یک‌جا به
ChatGPT متصل به VS Code بده. برای ساخت بخش‌های مختلف Frontend به پرامپت
جداگانه نیاز نیست. وظیفه تو این است که تمام Frontend را در Workspace
واقعاً پیاده‌سازی کنی، به Backend و Database موجود متصل کنی، تست کنی و تا
حد امکان به نسخه کامل و قابل اجرا برسانی.

------------------------------------------------------------------------

# A. مأموریت و قوانین غیرقابل‌چشم‌پوشی

تو یک Senior Frontend Engineer، UI/UX Designer و معمار نرم‌افزار هستی.
پروژه **Afghan Connect** یک Marketplace چندمنظوره برای افغانستان است؛
جایی که کاربران محصولات نو و دست‌دوم خود را برای فروش می‌گذارند و
ارائه‌دهندگان، خدمات محلی و تخصصی خود را معرفی می‌کنند.

هدف ساخت یک محصول واقعی، کامل، حرفه‌ای، قابل توسعه و Responsive است؛ نه
یک Template ساده، نه فقط صفحه Home و نه مجموعه‌ای از کارت‌های نمایشی.

## قوانین اصلی

1.  Backend و Database از قبل وجود دارند. ابتدا آن‌ها را بخوان و دقیقاً
    مطابق قرارداد واقعی‌شان Frontend بساز.
2.  Backend یا Database را از نو نساز و بدون ضرورت تغییر نده.
3.  فقط در صورت کشف مانع واقعی و ضروری، تغییر Backend را پیشنهاد بده؛
    پیش از انجام تغییر، دلیل و فایل‌های تحت تأثیر را گزارش کن.
4.  **هیچ Endpoint، فیلد، جدول، نقش، وضعیت یا قابلیتی را حدس نزن.** کد
    Route و Schema مرجع نهایی است.
5.  Mock Data را برای پنهان‌کردن API خراب یا نمایش قابلیت غیرواقعی
    استفاده نکن. فقط داده Seed واقعی را نمایش بده.
6.  همه دکمه‌ها، لینک‌ها، فرم‌ها، فیلترها، منوها و کنترل‌ها باید کار واقعی
    داشته باشند. کنترل تزئینی و بی‌عمل نساز.
7.  اگر Backend قابلیتی را پشتیبانی نمی‌کند، آن را به‌عنوان قابلیت فعال
    نمایش نده؛ یا آن بخش را پنهان کن یا وضعیت «فعلاً در دسترس نیست» را
    واضح نشان بده.
8.  پروژه فعلاً فقط Local Development است و هنوز Deploy نمی‌شود.
9.  ذخیره‌سازی محلی تصاویر فعلاً قابل قبول است.
10. چت فعلاً با REST API و Polling است؛ WebSocket لازم نیست.
11. درگاه بانکی واقعی فعلاً لازم نیست. جریان پرداخت باید با API و وضعیت
    واقعی Backend هماهنگ باشد؛ پرداخت را هرگز در Frontend خودکار
    Successful اعلام نکن.
12. موارد ۸ تا ۱۱ تصمیم‌های فعلی پروژه‌اند و نباید به‌عنوان نقص گزارش شوند.
13. قبل از Overwrite کردن هر فایل، محتوای فعلی آن را بخوان.
14. فایل‌های محرمانه `.env` را بازنویسی، چاپ، Commit یا به کد Frontend
    منتقل نکن.
15. کار را واقعاً در فایل‌های Workspace انجام بده؛ فقط نمونه کد یا توضیح
    تحویل نده.

------------------------------------------------------------------------

# B. بررسی اجباری پروژه قبل از کدنویسی

Workspace را بررسی کن و این فایل‌ها/پوشه‌ها را بخوان:

-   `backend/BACKEND_SETUP_AND_API.md`
-   `backend/package.json`
-   تمام فایل‌های Route و Controller و Middleware و Service در
    `backend/src/`
-   `backend/src/main.js` و فایل راه‌اندازی اصلی
-   `database/schema.sql`
-   `database/seed.sql`
-   `database/README.md`
-   تمام Migrationهای موجود
-   فایل‌های موجود در `frontend/`، اگر وجود دارند

از این بررسی یک API Contract واقعی استخراج کن:

-   Base URL و Prefix
-   Endpoint، HTTP Method و Query Params
-   Body مورد انتظار هر درخواست
-   ساختار پاسخ موفق و خطا
-   روش Authentication و محل Token
-   Roleها، Permissionها و وضعیت تأیید حساب‌ها
-   مدل Product، Category، Service، User، Seller، Cart، Order، Payment،
    Delivery، Review، Chat و Notification
-   محدودیت‌های واقعی Backend
-   روش Upload تصویر و ساختار URL تصاویر

اگر فایل مستندات با کد Route اختلاف داشت، کد اجرایی Route را ملاک قرار
بده و اختلاف را گزارش کن.

**پیش از شروع پیاده‌سازی، خلاصه بررسی را بنویس؛ سپس بدون منتظرماندن برای
تأییدهای کوچک، کار را ادامه بده.** فقط اگر مانع جدی، اطلاعات ضروری
ناموجود یا تصمیمی با اثر تخریبی وجود داشت، سؤال بپرس.

------------------------------------------------------------------------

# C. تکنولوژی‌های مجاز و اجباری

-   React
-   JavaScript فقط؛ TypeScript ممنوع
-   Vite
-   Tailwind CSS

ممنوع: - TypeScript و فایل‌های `.ts` و `.tsx` - Ant Design - Material
UI - Bootstrap - shadcn/ui - UI Frameworkهای آماده مشابه

قواعد: - از `fetch` استاندارد استفاده کن، مگر اینکه Axios از قبل نصب و
استفاده از آن منطقی باشد. - وابستگی جدید را فقط در صورت نیاز واقعی اضافه
کن. - نسخه Tailwind موجود را بررسی و مطابق همان نسخه پیکربندی کن. -
`package.json` موجود را بی‌دلیل جایگزین نکن. - برای آیکون‌ها از SVGهای سبک
یا آیکون‌های موجود پروژه استفاده کن؛ کتابخانه جدید را بی‌دلیل اضافه نکن. -
از React Hooks و Context برای Stateهای مناسب استفاده کن. - اگر Router
موجود است از همان استفاده کن؛ اگر وجود ندارد، در صورت نیاز واقعی
`react-router-dom` نصب کن. - کد باید JavaScript استاندارد و خوانا باشد.

------------------------------------------------------------------------

# D. ساختار کامل پوشه‌ها

ساختار Feature-based و قابل نگهداری بساز. ساختار نهایی می‌تواند با توجه
به پروژه کمی تغییر کند، ولی منطق جداسازی باید حفظ شود.

``` text
frontend/
├── public/
│   ├── favicon/
│   └── images/
├── src/
│   ├── assets/
│   ├── app/
│   │   ├── providers/
│   │   └── config/
│   ├── features/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── services/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── addresses/
│   │   ├── wishlist/
│   │   ├── comparisons/
│   │   ├── reviews/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── seller/
│   │   ├── courier/
│   │   ├── admin/
│   │   ├── profile/
│   │   └── settings/
│   ├── shared/
│   │   ├── components/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── feedback/
│   │   ├── dialogs/
│   │   └── navigation/
│   ├── layout/
│   ├── router/
│   ├── services/
│   │   ├── api/
│   │   └── endpoints/
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   ├── locales/
│   │   ├── prs/
│   │   ├── ps/
│   │   └── en/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

هر Feature در پوشه خودش فایل‌های `pages`, `components`, `hooks`,
`services` و `utils` مرتبط را داشته باشد. فایل‌های بزرگ و شلوغ نساز.
کامپوننت مشترک را در `shared/` قرار بده. منطق API را داخل UI پراکنده
نکن.

------------------------------------------------------------------------

# E. هویت بصری و طراحی UI/UX

## سبک طراحی

یک Marketplace مدرن و قابل اعتماد طراحی کن: - تم اصلی: Minimal Light -
تم دوم: Dark Mode - استفاده محدود و حساب‌شده از Glassmorphism فقط برای
جزئیات کوچک - فضای سفید کافی، تایپوگرافی خوانا، سلسله‌مراتب بصری روشن -
کارت‌های مرتب با مرزبندی ظریف - رنگ تأکیدی محدود و یکپارچه - آیکون‌های
هم‌سبک - انیمیشن کوتاه و ظریف - پرهیز از Gradientهای زیاد، سایه‌های سنگین،
رنگ‌های متعدد و شلوغی

## Design System

یک Design System مرکزی بساز: - رنگ‌های Background، Surface، Text، Muted،
Border، Primary، Success، Warning و Danger برای هر دو تم - اندازه‌های
Typography - Spacing و Radius - Button variants: primary, secondary,
outline, ghost, danger - Input، Select، Textarea، Checkbox، Radio،
Switch - Card، Badge، Avatar، Dropdown، Tooltip - Modal، Drawer، Tabs،
Breadcrumb - Table، Pagination - Skeleton، Spinner، Empty State، Error
State - Toast و Confirm Dialog

تمام اجزا باید Light/Dark و RTL/LTR را پشتیبانی کنند.

## Responsive

Mobile-first: - موبایل: منوی موبایل، فیلتر Drawer، کارت‌های تک‌ستونه یا
دو‌ستونه متناسب - تبلت: Grid منعطف - Desktop: Sidebar، Grid مناسب و
داشبورد چندستونه - هیچ صفحه‌ای نباید Horizontal Overflow ناخواسته داشته
باشد.

------------------------------------------------------------------------

# F. سه زبان کامل و جهت نوشتار

سه زبان الزامی: - دری: `prs` --- زبان پیش‌فرض اولیه - پشتو: `ps` -
انگلیسی: `en`

قوانین: - تمام متن‌ها، فرم‌ها، پیام‌های خطا، Empty State، دکمه‌ها، وضعیت‌ها،
Tooltipها، منوها و اعلان‌ها ترجمه شوند. - دری و پشتو RTL؛ انگلیسی LTR. -
`lang` و `dir` ریشه برنامه با تغییر زبان به‌روزرسانی شود. - Layout،
Sidebar، Breadcrumb، Dropdown، Icon placement، Form و Table در RTL درست
نمایش داده شوند. - ترجمه‌ها در فایل‌های مستقل نگهداری شوند. - زبان
انتخاب‌شده بعد از Refresh حفظ شود. - اگر Backend فیلد زبان کاربر را
پشتیبانی می‌کند، با API هماهنگ شود. - ترجمه دری و پشتو طبیعی و کامل باشد؛
متن انگلیسی باقی‌مانده در رابط کاربری نگذار، جز نام برند و اصطلاحات فنی
لازم. - تاریخ، قیمت و اعداد را با Locale مناسب نمایش بده، اما مقدار
ذخیره‌شده را تغییر نده.

------------------------------------------------------------------------

# G. نقشه کامل صفحات و قابلیت‌ها

## ۱. صفحات عمومی و Layout

### Header

-   لوگو و نام Afghan Connect
-   Home
-   Products
-   Services
-   Categories
-   About Us
-   Search
-   Language Switcher
-   Theme Switcher
-   Login/Register یا Account Menu
-   Cart
-   Notifications، در صورت ورود و پشتیبانی Backend
-   منوی موبایل

### Footer

-   معرفی کوتاه Afghan Connect
-   لینک صفحات اصلی
-   لینک دسته‌بندی‌ها در صورت وجود
-   About
-   Contact
-   انتخاب زبان/تم در صورت نیاز
-   شماره تماس قابل تنظیم
-   Copyright

### صفحات عمومی

-   Home
-   Products
-   Product Details
-   Categories
-   Services
-   Service Details
-   Seller/Provider Public Profile
-   About Us
-   Contact Us
-   Login
-   Register
-   404 Not Found
-   Unauthorized / Access Denied
-   صفحه خطای عمومی

## ۲. صفحه Home

صفحه Home باید کامل و جذاب باشد: - Hero با عنوان و توضیح روشن - Search
Bar بزرگ با انتخاب نوع جست‌وجو: Products یا Services، اگر API امکان آن را
فراهم می‌کند - Category Shortcuts - Popular Categories بر اساس داده
واقعی - New Products - Featured Products فقط در صورت پشتیبانی Backend -
Used Products - New Products - Popular Services - Service Providers با
Rating واقعی - بخش «چطور کار می‌کند؟» - دعوت به ثبت محصول یا معرفی خدمت -
بخش اعتماد و مزایای استفاده از پلتفرم - Footer

هیچ تعداد فروش، تعداد کاربر، امتیاز یا آمار خیالی نمایش نده.

## ۳. دسته‌بندی‌ها

-   دریافت دسته‌بندی از API
-   نمایش دسته‌بندی محصول و خدمت طبق ساختار واقعی دیتابیس
-   Parent/Child categories در صورت وجود
-   آیکون یا تصویر دسته‌بندی در صورت وجود داده
-   Search Categories
-   Category Details یا صفحه محصولات/خدمات دسته
-   نمایش تعداد آیتم‌ها فقط اگر API مقدار معتبر می‌دهد
-   دسته خالی Empty State داشته باشد

## ۴. Marketplace محصولات

### Product Listing

-   Grid/List View
-   Search
-   Category Filter
-   Subcategory Filter در صورت وجود
-   Min/Max Price
-   New/Used condition
-   City/Location
-   Seller
-   Availability/Status فقط مطابق API
-   Sort مطابق گزینه‌های پشتیبانی‌شده
-   Pagination مطابق API
-   Clear All Filters
-   حفظ فیلترها در URL Query String
-   Skeleton، Error و Empty State

### Product Card

-   تصویر
-   نام
-   قیمت و واحد پول واقعی
-   وضعیت نو یا دست‌دوم
-   شهر در صورت وجود
-   نام فروشنده در صورت مجازبودن
-   Favorite
-   Compare در صورت پشتیبانی
-   لینک جزئیات
-   Badgeهای واقعی و نه ساختگی

### Product Details

-   Gallery تصاویر
-   نام و قیمت
-   وضعیت کالا
-   توضیحات
-   دسته‌بندی
-   مشخصات موجود در API
-   موجودی فقط اگر API دارد
-   فروشنده و پروفایل عمومی
-   شماره تماس فقط اگر API اجازه می‌دهد
-   شهر و اطلاعات محل در صورت وجود
-   Add to Cart فقط در صورت پشتیبانی
-   Wishlist
-   Compare
-   Reviews و Rating
-   Related Products از API یا داده واقعی بارگذاری‌شده
-   Report Product فقط اگر Backend Endpoint دارد
-   Loading، Error، Not Found

### ثبت و مدیریت محصول

-   Create Product
-   Edit Product
-   Delete/Deactivate فقط طبق API
-   Upload چند تصویر اگر API پشتیبانی می‌کند
-   Preview تصاویر
-   اعتبارسنجی نوع و اندازه فایل بر اساس محدودیت Backend
-   Title، Description، Category، Price، Condition، City و سایر فیلدهای
    واقعی API
-   وضعیت انتشار/تأیید
-   فقط مالک مجاز بتواند محصول خودش را تغییر دهد؛ Backend مرجع امنیت
    است.

## ۵. خدمات محلی

### Services Listing

-   جست‌وجو
-   دسته‌بندی
-   شهر
-   قیمت/نوع قیمت، اگر API پشتیبانی کند
-   Sort و Pagination واقعی
-   کارت‌های ارائه‌دهنده

### Service Card

-   عنوان خدمت
-   تصویر در صورت وجود
-   توضیح کوتاه
-   نام ارائه‌دهنده
-   شهر
-   قیمت/نوع قیمت
-   امتیاز واقعی
-   لینک جزئیات

### Service Details

-   عنوان و توضیح کامل
-   تصاویر
-   دسته‌بندی
-   ارائه‌دهنده و پروفایل
-   شماره تماس فقط اگر API مجاز می‌داند
-   شهر و اطلاعات قابل نمایش
-   Rating و Reviews
-   ثبت سفارش/افزودن به Cart فقط اگر Backend واقعاً پشتیبانی می‌کند
-   خدمات مشابه از داده واقعی

### مدیریت خدمت

-   ایجاد خدمت
-   ویرایش خدمت خود
-   غیرفعال/حذف مطابق API
-   تصاویر
-   قیمت و توضیح
-   دسته‌بندی واقعی
-   وضعیت تأیید
-   محدودیت مالکیت

## ۶. جست‌وجوی هوشمند و فیلترها

-   Debounced Search
-   Search Suggestion
-   جست‌وجو با Enter
-   پیشنهاد با Keyboard و Mouse
-   انتخاب محدوده نوع محتوا: Product / Service، اگر Backend پشتیبانی کند
-   Clear Search
-   Filter Chips
-   Clear All
-   Filter Drawer در موبایل
-   Sort و Pagination
-   حفظ Query در URL
-   اگر Suggestion Endpoint وجود ندارد، از داده واقعی موجود استفاده کن؛
    Endpoint جدید جعل نکن.

## ۷. کاربران و Authentication

قرارداد Backend را ملاک قرار بده: - ثبت‌نام عمومی فقط Customer ایجاد
می‌کند، اگر همین رفتار در Backend وجود دارد. - کاربر نباید Role دلخواه را
از فرم Register ارسال کند. - ورود با فیلدهای واقعی Backend. - Token و
User از پاسخ واقعی ذخیره شوند. - Authorization Bearer برای APIهای
محافظت‌شده. - BIGINT IDهای دریافتی به‌صورت String حفظ شوند. - Role و
Permission از User/API واقعی دریافت شوند. - Seller باید درخواست Seller
Profile بدهد و منتظر تأیید Admin بماند، اگر Backend همین مدل را دارد. -
Courier نیز مطابق روند تأیید واقعی Backend. - Admin Dashboard فقط برای
Admin مجاز. - کاربر فقط داده‌های مجاز خودش را مدیریت کند. - UI Access
Control جایگزین Security Backend نیست.

صفحات: - Register - Login - Logout - Forgot Password فقط اگر API واقعی
دارد - Profile - Edit Profile - Change Password - Seller Application -
Courier Application - Account Status

## ۸. Customer Dashboard

-   Overview
-   My Orders
-   Order Details
-   Order Status Timeline
-   My Addresses
-   Cart
-   Wishlist
-   Comparisons
-   Reviews
-   Notifications
-   Messages/Chat
-   Profile
-   Settings
-   Language
-   Theme
-   Logout

آمار فقط از API واقعی یا محاسبه معتبر روی داده‌های واقعی باشد.

## ۹. Seller Dashboard

فقط برای Seller تأییدشده: - Overview - Products Management - Add
Product - Edit Product - Product Status - Services Management - Add
Service - Edit Service - Seller Orders - Order Details - Order Status
Actions - Store/Profile Settings - Reviews - Coupons فقط اگر Endpoint
واقعی دارد - Sales/Revenue فقط اگر داده واقعی Backend موجود است -
Notifications - Chat - Settings

فروشنده فقط محصولات، خدمات و سفارش‌های مربوط به خودش را ببیند و تغییر
دهد.

## ۱۰. Admin Dashboard

-   Overview
-   Analytics بر اساس داده واقعی
-   Users Management
-   User Details
-   Seller Applications
-   Approve/Reject/Suspend Seller طبق API
-   Courier Management
-   Category Management
-   Products Management
-   Product Approval/Moderation
-   Services Management
-   Service Approval/Moderation
-   Orders Management
-   Order Details
-   Payment Transactions
-   Coupons
-   Reviews Moderation
-   Notifications/Reports فقط اگر API موجود دارد
-   Admin Profile/Settings

جداول Admin باید: - Search - Filters - Sort - Pagination - Responsive -
Loading/Empty/Error - Confirm Dialog برای عملیات حساس - پیام نتیجه
عملیات داشته باشند.

هیچ عملیات مدیریتی را صرفاً در Frontend شبیه‌سازی نکن؛ باید API واقعی
داشته باشد.

## ۱۱. Courier Dashboard

-   Courier Application/Status
-   Available Orders فقط اگر API دارد
-   Assigned Deliveries
-   Delivery Details
-   Claim/Accept فقط اگر Endpoint دارد
-   Update Delivery Status فقط مطابق Transitionهای Backend
-   Available/Busy/Offline فقط اگر API دارد
-   Delivery History
-   Profile/Settings

## ۱۲. Cart و Checkout

-   Cart واقعی از API
-   Add/Remove Item
-   Update Quantity
-   Clear Cart اگر API دارد
-   Product/Service Item فقط مطابق Backend
-   نمایش subtotal، discount، delivery fee و total بر اساس پاسخ معتبر
    سرور
-   انتخاب آدرس از داده واقعی
-   Checkout با فیلدهای واقعی API
-   جلوگیری از Double Submit
-   نمایش خطاهای موجودی، قیمت و Validation از سرور
-   بعد از سفارش، صفحه Confirmation و Order Details
-   در Refresh وضعیت از API بازیابی شود

## ۱۳. Orders

-   My Orders
-   Seller Orders
-   Admin Orders
-   Courier Deliveries
-   Order Details
-   Order Items
-   Seller Suborders
-   Status Timeline
-   Cancel فقط اگر Backend مجاز بداند
-   Status Labels از مقادیر واقعی Backend
-   نمایش تاریخ و قیمت درست
-   جلوگیری از نمایش سفارش متعلق به شخص دیگر
-   Status Transition را Frontend حدس نزند؛ سرور مرجع است.

## ۱۴. Payments

-   Payment Methods فقط از داده/API واقعی
-   Payment Transaction Details
-   Pending / Successful / Failed / Refunded فقط مطابق وضعیت‌های واقعی
-   پرداخت واقعی بانکی پیاده‌سازی نکن.
-   موفقیت پرداخت را از پاسخ معتبر Backend بخوان.
-   Admin Payment Actions فقط با مجوز و Endpoint واقعی.
-   از ارسال چندباره درخواست پرداخت جلوگیری کن.
-   اطلاعات حساس بانکی یا کارت را ذخیره نکن.

## ۱۵. Reviews و Ratings

-   نمایش امتیاز میانگین فقط اگر Backend محاسبه یا داده معتبر دارد
-   نمایش Review List
-   ثبت Review فقط در صورت مجازبودن و وجود Endpoint
-   امتیاز ۱ تا ۵ در صورت پشتیبانی
-   Edit/Delete فقط مطابق مالکیت و API
-   Seller Reply فقط اگر Endpoint دارد
-   Review خالی و Loading و Error State
-   جلوگیری از ثبت تکراری در UI؛ Backend مرجع نهایی است.

## ۱۶. Wishlist و Comparisons

-   Add/Remove Wishlist
-   Wishlist Page
-   Add/Remove Compare
-   Compare Page/Table
-   مقایسه ویژگی‌هایی که واقعاً در Product API وجود دارند
-   Empty State
-   محدودیت تعداد مقایسه اگر Backend تعیین کرده باشد
-   بدون جعل ویژگی محصول

## ۱۷. Chat

-   Conversations List
-   Conversation Details
-   Message History
-   Send Message
-   Read Status فقط اگر API دارد
-   Polling با فاصله معقول و قابل تنظیم
-   توقف Polling هنگام Unmount یا خروج از صفحه
-   مرتب‌سازی پیام‌ها بر اساس Timestamp واقعی
-   ارسال با Enter و خط جدید با Shift+Enter
-   Empty/Loading/Error
-   WebSocket اضافه نکن.

## ۱۸. Notifications

-   Notifications List
-   Unread Count فقط از داده واقعی
-   Mark as Read فقط اگر Endpoint دارد
-   Mark All Read فقط اگر Endpoint دارد
-   لینک به صفحه مرتبط در صورت وجود Reference
-   Empty State
-   Polling فقط در صورت نیاز و با فاصله معقول

## ۱۹. Settings

-   Profile Settings
-   Language
-   Theme
-   Password فقط اگر API دارد
-   Notification Preferences فقط اگر API دارد
-   Account Preferences فقط اگر Backend پشتیبانی می‌کند
-   Logout
-   تغییر تنظیمات محلی مانند تم و زبان باید پایدار باشد.

## ۲۰. About Us و Contact Us

صفحه درباره ما باید توضیح دهد:

Afghan Connect یک Marketplace چندمنظوره برای افغانستان است که افراد را
به هم وصل می‌کند تا محصولات نو و دست‌دوم خود را خریدوفروش کنند و خدمات
محلی و تخصصی را پیدا یا معرفی کنند. هدف آن آسان‌ترکردن دسترسی به کالاها و
خدمات، ایجاد ارتباط مستقیم و پشتیبانی از زبان‌های دری، پشتو و انگلیسی
است.

صفحه Contact فعلاً فقط یک شماره تماس داشته باشد: - شماره واقعی هنوز داده
نشده است. - شماره جعلی نساز. - مقدار مرکزی `CONTACT_PHONE` یا تنظیم
مشابه بساز تا بعداً به‌سادگی تغییر کند. - اگر مقدار خالی است، متن ترجمه‌شده
«شماره تماس به‌زودی اضافه می‌شود» نمایش بده. - فرم تماس، ایمیل، آدرس یا
شبکه اجتماعی اضافه نکن مگر بعداً درخواست شود.

## ۲۱. Search UX و Data Tables

در تمام فرم‌ها و جدول‌های قابل جست‌وجو: - Search Input با Debounce -
پیشنهاد مرتبط در صورت امکان - انتخاب نتیجه از Dropdown - Keyboard
Navigation - Filter by Status/Category/Date فقط در صورت وجود فیلد و
API - Sort - Pagination - Clear Filters - Loading - Empty State - Error
State - Responsive table/card view - فیلترها در URL حفظ شوند، جایی که
مناسب است.

## ۲۲. فرم‌ها و اعتبارسنجی

-   Label واضح
-   Required Indicator
-   Helper Text
-   Inline Validation
-   Server Validation Errors کنار فیلد مربوط
-   Disable هنگام Submit
-   جلوگیری از Double Submit
-   Confirm Dialog برای Delete/Cancel
-   Toast برای نتیجه واقعی
-   نمایش خطای شبکه و API
-   حفظ داده فرم هنگام خطای موقت، تا حد امکان
-   File Upload با Preview و محدودیت واقعی Backend

------------------------------------------------------------------------

# H. API Architecture

یک API Client مرکزی بساز: - Base URL از `VITE_API_BASE_URL`. - مقدار
پیش‌فرض Local فقط بعد از بررسی Backend انتخاب شود؛ اگر Backend روی پورت
5000 و Prefix `/api/v1` است، همان را تنظیم کن. - فایل `.env.example`
بساز، بدون Secret واقعی. - Bearer Token را به درخواست محافظت‌شده اضافه
کن. - JSON و FormData را درست مدیریت کن. - برای FormData دستی
`Content-Type` تنظیم نکن. - پاسخ و خطا را مطابق قرارداد واقعی Parse
کن. - 401: مدیریت نشست و هدایت مناسب به Login. - 403: پیام دسترسی
غیرمجاز. - 404: صفحه/پیام Not Found. - 422 یا خطای Validation: نمایش
کنار فیلد. - 500 و Network Error: پیام مناسب و امکان Retry. -
Cancel/Abort درخواست‌های غیرضروری هنگام تغییر صفحه. - API callها را در
Serviceهای Feature نگه دار. - از درخواست‌های تکراری غیرضروری جلوگیری
کن. - هیچ Token یا اطلاعات حساس را در Console چاپ نکن.

------------------------------------------------------------------------

# I. مدیریت State

State را منطقی تفکیک کن: - Auth State - Theme State - Language State -
Cart State، مطابق API - Notification Count - UI State مثل Modal و
Drawer - Server Data

از Context برای Stateهای سراسری سبک استفاده کن. اگر پروژه از قبل Zustand
یا کتابخانه State دارد و مناسب است، همان را بررسی کن؛ کتابخانه جدید را
بی‌دلیل نصب نکن.

قوانین: - اطلاعات سرور را با داده جعلی جایگزین نکن. - بعد از
Create/Update/Delete، داده واقعی را Refresh یا با پاسخ سرور به‌روزرسانی
کن. - State حساس را بدون دلیل در Local Storage ذخیره نکن. - Token را
مطابق امنیت و معماری فعلی پروژه مدیریت کن؛ اگر Backend الگوی مشخصی دارد،
آن را رعایت کن.

------------------------------------------------------------------------

# J. تصاویر و فایل‌ها

-   Upload از Endpoint واقعی Backend.
-   `FormData` با نام فیلد دقیق API.
-   Preview قبل از Upload.
-   اعتبارسنجی نوع و حجم فایل مطابق Backend.
-   نمایش خطاهای Upload.
-   تصاویر از URL واقعی Backend نمایش داده شوند.
-   برای تصویر ناموجود Placeholder طراحی کن.
-   در کارت‌ها `object-fit` مناسب و نسبت تصویر یکپارچه داشته باش.
-   URL تصویر را کورکورانه تغییر نده.
-   از تصاویر خارجی تصادفی یا داده ساختگی به‌عنوان محتوای واقعی استفاده
    نکن.

------------------------------------------------------------------------

# K. امنیت، دسترسی و حریم خصوصی

-   Role را از فرم عمومی Register نپذیر.
-   کاربر عادی نباید بتواند با دستکاری UI به Admin/Seller/Courier تبدیل
    شود.
-   Route Guard فقط برای تجربه کاربری است؛ Backend باید مجوز را کنترل
    کند.
-   اطلاعات خصوصی کاربر، مشتری، فروشنده یا سفارش را فقط در صورت مجازبودن
    نمایش بده.
-   شماره تماس فقط اگر API آن را مجاز و برگردانده باشد.
-   Token و Secret در Log چاپ نشود.
-   هیچ Secret در کد Frontend یا متغیر `VITE_` قرار نگیرد.
-   ورودی‌ها را برای نمایش امن Escape کن و از تزریق HTML ناامن پرهیز کن.
-   عملیات حساس Confirm Dialog داشته باشند.

------------------------------------------------------------------------

# L. عملکرد، Accessibility و کیفیت

-   Lazy Load برای صفحات سنگین و تصاویر
-   Pagination به جای بارگذاری بی‌حد همه داده‌ها
-   Debounce Search
-   جلوگیری از Re-renderهای غیرضروری
-   کد قابل خواندن و قابل نگهداری
-   Componentهای کوچک و مسئولیت مشخص
-   Label برای تمام Inputها
-   Keyboard Navigation
-   Focus Visible
-   Alt برای تصاویر
-   کنتراست مناسب در هر دو تم
-   احترام به `prefers-reduced-motion`
-   صفحه در موبایل و Desktop درست کار کند
-   Console بدون خطای جدی
-   هیچ لینک شکسته یا دکمه بی‌عمل وجود نداشته باشد.

------------------------------------------------------------------------

# M. مراحل اجرای کامل --- همه در همین پرامپت

این مراحل بخشی از همین مأموریت‌اند؛ برای هر مرحله پرامپت جدید لازم نیست.

## مرحله ۱ --- Audit

Backend، Database و Frontend را بخوان. API Contract و محدودیت‌ها را
استخراج کن. نقشه صفحات و نقش‌ها را مشخص کن.

## مرحله ۲ --- Setup

Vite، React، JavaScript، Tailwind، ساختار پوشه‌ها، Environment، Router،
API Client و Providerها را تنظیم کن.

## مرحله ۳ --- Foundation

Design System، Header، Footer، Sidebar، Buttons، Inputs، Cards، Tables،
Modal، Toast، Loading، Empty، Error، Theme، Localization و RTL/LTR را
کامل کن.

## مرحله ۴ --- Public Marketplace

Home، Products، Product Details، Categories، Services، Service Details،
Public Seller Profile، About و Contact را بساز و به API وصل کن.

## مرحله ۵ --- Authentication

Register، Login، Session، Protected Routes، Profile و Applicationهای
Seller/Courier را بساز.

## مرحله ۶ --- Customer

Customer Dashboard، Cart، Checkout، Orders، Addresses، Wishlist،
Comparisons، Reviews، Chat، Notifications و Settings را بساز.

## مرحله ۷ --- Seller

Seller Dashboard، Product CRUD، Service CRUD، Orders، Store Profile،
Reviews و امکانات واقعی مجاز را بساز.

## مرحله ۸ --- Courier

Courier Dashboard، Assigned Deliveries، Delivery Details، Status Updates
و History را بساز.

## مرحله ۹ --- Admin

Admin Dashboard، Users، Seller Applications، Couriers، Categories،
Products، Services، Orders، Payments، Coupons و Reviews را مطابق API
بساز.

## مرحله ۱۰ --- Integration

تمام APIها، فرم‌ها، Uploadها، فیلترها، جست‌وجو، Pagination، Role Guards و
Error Handling را یکپارچه کن.

## مرحله ۱۱ --- QA

Build، تست صفحات، زبان‌ها، تم‌ها، Responsive، API، Authentication، Role
Access و جریان‌های اصلی را بررسی و خطاها را اصلاح کن.

------------------------------------------------------------------------

# N. سناریوهای پذیرش و تست نهایی

حداقل این سناریوها را آزمایش کن:

1.  کاربر بتواند Register و Login کند.
2.  کاربر پس از Refresh نشست را مطابق روش Backend بازیابی کند.
3.  کاربر بتواند محصولات واقعی را ببیند و جست‌وجو کند.
4.  فیلتر Category و Price در صورت پشتیبانی درست کار کند.
5.  صفحه جزئیات Product اطلاعات همان Product را نشان دهد، نه اولین محصول
    لیست.
6.  کاربر نتواند محصول متعلق به دیگری را ویرایش کند.
7.  Seller Application طبق API ارسال و وضعیت آن نمایش داده شود.
8.  Seller تأییدشده فقط محصولات و خدمات خودش را مدیریت کند.
9.  Service Listing و Service Details از API واقعی استفاده کنند.
10. Cart و Checkout با داده سرور کار کنند.
11. Order Details وضعیت واقعی را نشان دهد.
12. وضعیت پرداخت فقط از Backend خوانده شود.
13. Courier فقط Deliveryهای مجاز را ببیند.
14. Status تحویل فقط مطابق Backend تغییر کند.
15. Admin صفحات مدیریتی مجاز را ببیند.
16. کاربر عادی نتواند Admin Dashboard را باز کند.
17. Chat با REST + Polling کار کند و Polling پس از خروج از صفحه متوقف
    شود.
18. Notificationها از API واقعی خوانده شوند.
19. دری و پشتو RTL و انگلیسی LTR باشد.
20. Theme Light/Dark پس از Refresh حفظ شود.
21. Search و Filter در موبایل قابل استفاده باشد.
22. صفحات 404 و Error درست کار کنند.
23. About و Contact توضیح پروژه و فقط شماره تماس قابل تنظیم را نمایش
    دهد.
24. تمام دکمه‌های اصلی عمل واقعی داشته باشند.
25. `npm run build` بدون خطا اجرا شود.

اگر Backend یا PostgreSQL در دسترس نیست، تست‌های وابسته را صادقانه
«انجام‌نشده» گزارش کن؛ موفقیت Build را با موفقیت Integration اشتباه نگیر.

------------------------------------------------------------------------

# O. تحویل نهایی

در پایان: - تمام فایل‌های Frontend را در `frontend/` ایجاد کن. - فهرست
صفحات و قابلیت‌های تکمیل‌شده را بده. - فهرست APIهای متصل‌شده را ارائه کن. -
فهرست قابلیت‌هایی که Backend پشتیبانی نمی‌کند را جداگانه بنویس. - دستور
اجرای Backend و Frontend را مشخص کن. - نتیجه `npm run build` را گزارش
کن. - تست‌های موفق و ناموفق/انجام‌نشده را تفکیک کن. - مشکلات باقی‌مانده را
دقیق و بدون پنهان‌کاری گزارش کن. - هیچ‌وقت ادعا نکن چیزی تست شده، مگر
واقعاً اجرا شده باشد.

------------------------------------------------------------------------

# دستور شروع

اکنون همین Workspace را بررسی کن. ابتدا فایل‌های Backend و Database را
بخوان و API Contract واقعی را استخراج کن. سپس کل Frontend را مطابق تمام
بخش‌های این سند در پوشه `frontend/` بساز و به Backend متصل کن.

**این یک مأموریت کامل و یکپارچه است. منتظر پرامپت بعدی برای ساخت Home،
Dashboard، Products یا سایر صفحات نمان. همه بخش‌های لازم را طبق همین سند
پیاده‌سازی کن.**

کار را مرحله‌به‌مرحله انجام بده، اما تا جایی که ابزار و زمان اجازه می‌دهد،
تمام مراحل را در همین مأموریت پیش ببر. اگر به محدودیت زمان یا ابزار
رسیدی، دقیقاً از همان‌جا ادامه‌پذیر نگه دار و وضعیت واقعی را گزارش کن.
