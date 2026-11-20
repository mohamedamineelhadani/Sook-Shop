# Sookshop

A full-stack ecommerce store: **React storefront + React admin panel + Express/MongoDB API**.
Every order is **cash on delivery (COD)** — no online payment gateway.

## Structure

```
sookshop/
├── backend/           Express + Mongoose REST API (port 5000)
│   └── src/
│       ├── app.js            Express app, CORS, middleware, routes
│       ├── server.js         DB connection + server startup
│       ├── config/           env + MongoDB connection
│       ├── models/           Category, Product, User, Cart, Order, Review, ContactMessage, NewsletterSubscriber
│       ├── routes/           feature routes (added step by step)
│       ├── middleware/       async wrapper, 404, error handler
│       └── utils/            AppError
├── frontend/          Customer storefront — Vite + React (port 5173)
│   └── src/
│       ├── components/       shared UI (icons, product cards, reviews)
│       ├── layouts/          StoreLayout (header, nav, drawer, footer)
│       ├── api/              API clients (cart, wishlist, orders, reviews, contact, newsletter)
│       ├── context/          Auth, Cart & Wishlist providers
│       ├── pages/            Home, Shop, Product, Cart, Checkout, Orders, Contact, info pages, …
│       ├── lib/api.js        Axios client for the backend
│       └── styles/store.css  converted template design system
├── admin/             Admin panel — Vite + React (port 5174)
│   └── src/
│       ├── layouts/          AdminLayout (sidebar + topbar)
│       ├── pages/            Dashboard, Products, Categories, Insights, Orders, Reviews, Users, Messages, Newsletter
│       ├── api/              API clients (catalog, auth, dashboard, insights, orders, reviews, contact, newsletter)
│       ├── lib/api.js        Axios client for the backend
│       └── styles/admin.css  admin design system
└── template to start/ Original Sprylo HTML/CSS/JS template (design reference)
```

## Run locally

1. **Start MongoDB locally** (`mongod` running on `127.0.0.1:27017`).
2. **Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   npm run dev
   ```
   Check: <http://localhost:5000/api/health>
3. **Storefront**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   npm run dev -- --port 5173
   ```
4. **Admin**:
   ```bash
   cd admin
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   npm run dev -- --port 5174
   ```

The `VITE_API_URL` in both React apps defaults to `http://localhost:5000/api`, so `.env`
files are optional for local development. CORS is configured for ports 5173 and 5174.

### Authentication

- `POST /api/auth/register` — customer sign-up
- `POST /api/auth/login` — returns a JWT and sets the httpOnly `sookshop_token` cookie
- `POST /api/auth/logout` — clears the cookie
- `GET /api/auth/me` — current user (requires login)

The token is also returned in the response body so API clients can send it as
`Authorization: Bearer <token>`. Customers can register; only admins can create, edit or
delete products and categories. Create/reset the first admin with:

```bash
cd backend && npm run seed:admin
```

### Cart & wishlist (Step 4)

All cart and wishlist endpoints require login. Guests can still add items locally; when they
sign in, their guest cart and wishlist are synced to the account once (quantities merge and
invalid/out-of-stock products are dropped).

**Cart** — items are keyed by `productId::color::size`.

- `GET /api/cart` — current cart with `items`, `count`, `subtotal`
- `POST /api/cart/items` — body: `{ productId, quantity?, color?, size? }`
- `PATCH /api/cart/items` — same identifier plus the new `quantity`
- `DELETE /api/cart/items` — body: `{ productId, color?, size? }`
- `POST /api/cart/sync` — body: `{ items: [{ productId, quantity, color?, size? }] }`
- `DELETE /api/cart` — clear the cart

**Wishlist**

- `GET /api/wishlist` — saved products
- `POST /api/wishlist/:productId` / `DELETE /api/wishlist/:productId` — save/remove
- `POST /api/wishlist/sync` — body: `{ productIds: [] }`

**Admin insight** (admin role only): `GET /api/admin/insights` returns cart/wishlist stats,
the 20 most recently updated carts, customer wishlists, and a popularity ranking. The admin
panel shows this on the **Insights** page and on the dashboard cards.

### Orders & checkout (Step 5)

Orders are cash on delivery only. Prices and shipping are recalculated on the server from the
database, never from the browser. Shipping is **$10**, free on subtotals of **$200+**. Placing
an order validates stock, decrements it, empties the cart and stores a snapshot of each item.

**Customer** (login required):

- `GET /api/orders/shipping` — public shipping rule used by checkout
- `POST /api/orders` — body: `{ shippingAddress, notes?, saveAddress? }`
- `GET /api/orders` — your order history (paged with `page` / `limit`)
- `GET /api/orders/:id` — order details (owner or admin only)

**Admin** (admin role only):

- `GET /api/admin/orders` — all orders, filter with `status` and `q`, paged
- `GET /api/admin/order-stats` — totals by status, revenue and cash collected
- `PATCH /api/admin/orders/:id/status` — body: `{ status }`; marking `delivered` sets
  `paymentStatus` to `paid`

The storefront has `/checkout` and `/orders/:id` pages; the admin **Orders** page lists every
COD order and lets staff update its status.

### Search, filters & reviews (Step 6)

Search is handled by the API, so it also matches slugs, SKUs, descriptions and category names —
not just product titles.

**Public endpoints**

- `GET /api/products?q=…` — expanded search across name, slug, brand, SKU, description and
  category; combine with `category`, `brand`, `min`, `max`, `inStock=true`, `onSale=true`,
  `featured=true`, `minRating`, `sort` and `page`/`limit`
- `GET /api/products/suggest?q=…` — up to 6 header suggestions (minimum 2 characters)
- `GET /api/reviews?product=<id-or-slug>` — visible reviews with `summary` (average, count,
  1–5 star distribution), `pagination`, and the signed-in user's own review as `mine`;
  optional `rating`, `sort=newest|highest|lowest` and `page`/`limit`

**Reviews (login required)**

- `POST /api/reviews` — body: `{ productId, rating, title?, body }`. One review per product:
  posting again updates your existing review.
- `PUT /api/reviews/:id` / `DELETE /api/reviews/:id` — edit/remove your own review (admins may
  also remove any review). Ratings are recalculated on the product after every write.
- `verifiedPurchase` is set automatically from a delivered COD order containing the product.

**Admin** (admin role only)

- `GET /api/admin/reviews` — all reviews, filter with `q`, `rating` and
  `visibility=visible|hidden`
- `GET /api/admin/review-stats` — totals, hidden count and average rating
- `PATCH /api/admin/reviews/:id/visibility` — body: `{ isVisible }`. Hidden reviews disappear
  from the storefront and no longer affect the product rating.

The storefront shop now has rating/featured filters and removable filter chips, the header has
live search suggestions, and product pages show the rating breakdown, review list and a write/
edit form. The admin **Reviews** page provides search, filters, hide/show controls and deletion.

### Polish & dashboard (Step 7)

The admin dashboard loads everything in one request:

- `GET /api/admin/dashboard` (admin role only) — active product/category/customer counts, COD
  order and revenue totals, cash collected, review stats, a 7-day orders/revenue chart, status
  breakdown, recent orders, low-stock products and top sellers.

To populate a believable demo store without touching real orders, run:

```bash
cd backend && npm run seed:demo
```

This adds three demo customers, six visible reviews and seven `DEMO-###` COD orders covering all
statuses. Re-running it replaces only the demo orders. Demo login:
`maya.demo@sookshop.test` / `Demo@123`.

Responsive updates: the storefront header keeps search available on mobile (it moves to its own
row below the logo/icons), and admin toolbars, dashboard panels and tables wrap or scroll cleanly
on small screens.

### Contact, footer pages & newsletter (Step 8)

The storefront now has a real contact flow and every remaining footer link opens a real page.
No emails are sent by this demo — submissions are only saved in MongoDB and shown in the admin
panel.

**Public endpoints**

- `POST /api/contact` — body: `{ name, email, subject?, message }`; saves a support message
- `POST /api/newsletter/subscribe` — body: `{ email, source? }`; saves an email, reactivates an
  existing inactive subscriber, and returns `alreadySubscribed: true` when it was already active
- `POST /api/newsletter/unsubscribe` — body: `{ email }`; marks a subscriber inactive (always
  returns the same response so it cannot be used to check who subscribed)

**Admin endpoints** (admin role only)

- `GET /api/admin/contact-messages` — inbox list with `page`/`limit`, `isRead` and `q` filters,
  plus total/unread/read stats
- `PATCH /api/admin/contact-messages/:id/read` — body: `{ isRead }`
- `DELETE /api/admin/contact-messages/:id`
- `GET /api/admin/newsletter` — subscriber list with `page`/`limit`, `isActive` and `q` filters,
  plus total/active/inactive stats
- `DELETE /api/admin/newsletter/:id`

**Storefront pages**

- `/contact` — validated form with order/COD help links and saved-message feedback
- `/about`, `/shipping-policy`, `/help-centre`, `/faqs`, `/terms`, `/privacy` — real content pages;
  `NotFoundPage` remains for unknown URLs
- The footer now uses explicit link objects: category links open filtered shop pages, help and
  company links open the pages above, and **Get 20% off** jumps to `#newsletter` on the home page
- The home newsletter form calls the subscribe API and shows saved/already-subscribed/error states

**Admin pages**

- **Messages** (`/messages`) — contact inbox with search, read/unread filters, mark read/unread and
  delete
- **Newsletter** (`/newsletter`) — captured emails with search, status filters and delete

The **20% discount copy is intentionally just store copy**: there is no coupon code and no email
delivery in this step. Emails and messages remain visible only to logged-in admins.

## Step-by-step roadmap

Every feature is built across all three apps in the same step.

- [x] **Step 1 — Scaffold**: backend API structure/models, React routing/layouts, shared
  config, Axios clients, template design system, COD-first copy.
- [x] **Step 2 — Categories & Products**: category/product CRUD + filters/search/pagination →
  storefront home/shop/product pages → admin products & categories screens. Run `npm run seed`
  in `backend/` to load 9 categories and 18 products from the template.
- [x] **Step 3 — Authentication**: register/login/logout/me with JWT cookies + roles →
  `protect`/`authorize('admin')` on all catalog write routes → storefront login/register/account
  with protected routes → admin login with protected panel. Seed the first admin with
  `npm run seed:admin` in `backend/` (default `admin@sookshop.com` / `Admin@123`).
- [x] **Step 4 — Cart & Wishlist**: cart/wishlist API with guest sync → storefront cart and
  wishlist with working heart buttons and counts → admin read-only insights page.
- [x] **Step 5 — Orders (COD checkout)**: server-priced order API with shipping details, stock
  updates and COD status → storefront checkout, confirmation and order history → admin order
  list with status management and live stats.
- [x] **Step 6 — Search, filters & reviews**: API-side search, suggestions and rating filters →
  storefront shop controls, header suggestions and real product reviews → admin review moderation
  with visibility controls and stats.
- [x] **Step 7 — Polish**: idempotent demo seed, one-request admin dashboard with charts and
  actionable lists, responsive storefront/admin layouts, and final lint/build/API verification.
- [x] **Step 8 — Contact & footer**: real contact form + admin inbox, newsletter email capture +
  admin list, all footer pages built and linked, Resources column removed. No emails are sent.

## Payment note

There is no card/payment gateway. The backend fixes `paymentMethod` to `cod` on every
order; admins move orders through pending → confirmed → shipped → delivered, and payment
status is marked `paid` when cash is collected on delivery.
