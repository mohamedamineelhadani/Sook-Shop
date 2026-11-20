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
│       ├── models/           Category, Product, User, Cart, Order
│       ├── routes/           feature routes (added step by step)
│       ├── middleware/       async wrapper, 404, error handler
│       └── utils/            AppError
├── frontend/          Customer storefront — Vite + React (port 5173)
│   └── src/
│       ├── components/       shared UI (icons, placeholders)
│       ├── layouts/          StoreLayout (header, nav, drawer, footer)
│       ├── api/              API clients (cart, wishlist, orders)
│       ├── context/          Auth, Cart & Wishlist providers
│       ├── pages/            Home, Shop, Product, Cart, Checkout, Orders, Wishlist, …
│       ├── lib/api.js        Axios client for the backend
│       └── styles/store.css  converted template design system
├── admin/             Admin panel — Vite + React (port 5174)
│   └── src/
│       ├── layouts/          AdminLayout (sidebar + topbar)
│       ├── pages/            Dashboard, Products, Categories, Insights, Orders, Users
│       ├── api/              API clients (catalog, auth, insights, orders)
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
- [ ] **Step 6 — Search, filters & reviews**: API-side search/filter → storefront shop
  controls → admin oversight.
- [ ] **Step 7 — Polish**: seed data, dashboard charts, responsive fixes, final testing.

## Payment note

There is no card/payment gateway. The backend fixes `paymentMethod` to `cod` on every
order; admins move orders through pending → confirmed → shipped → delivered, and payment
status is marked `paid` when cash is collected on delivery.
