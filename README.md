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
│       ├── pages/            Home, Shop, Product, Cart, Contact, …
│       ├── lib/api.js        Axios client for the backend
│       └── styles/store.css  converted template design system
├── admin/             Admin panel — Vite + React (port 5174)
│   └── src/
│       ├── layouts/          AdminLayout (sidebar + topbar)
│       ├── pages/            Dashboard, Products, Categories, Orders, Users
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
- [ ] **Step 4 — Cart & Wishlist**: cart API + React cart context → storefront cart and
  wishlist → admin read-only insight.
- [ ] **Step 5 — Orders (COD checkout)**: order API with shipping details and COD status →
  storefront checkout/confirmation → admin order management.
- [ ] **Step 6 — Search, filters & reviews**: API-side search/filter → storefront shop
  controls → admin oversight.
- [ ] **Step 7 — Polish**: seed data, dashboard charts, responsive fixes, final testing.

## Payment note

There is no card/payment gateway. The backend fixes `paymentMethod` to `cod` on every
order; admins move orders through pending → confirmed → shipped → delivered, and payment
status is marked `paid` when cash is collected on delivery.
