# Mini ERP + CRM Operations Portal

A small internal ERP/CRM system for a wholesale/distribution company: customers, products/stock,
sales challans, and role-based access for Admin, Sales, Warehouse, and Accounts teams.

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT auth, Zod validation
- **Frontend:** React, TypeScript, Vite, React Router, Axios
- **Repo layout:** `backend/` (REST API) and `frontend/` (admin UI), each independently deployable

---

## 1. Architecture overview

The backend is a layered Express API: `routes -> middleware (auth/roles) -> controllers -> Prisma`.
All business rules that touch money/stock (challan confirmation) run inside a single Prisma
`$transaction`, so a partial failure never leaves stock or challan status inconsistent.

Authentication is stateless JWT: `POST /auth/login` returns a signed token containing the user's
`id`, `role`, and `email`; the frontend stores it in `localStorage` and attaches it as a
`Authorization: Bearer <token>` header via an Axios interceptor. A second interceptor auto-redirects
to `/login` on any `401` response. Role checks happen twice: route-level `authorize(...roles)`
middleware in the API (the real enforcement), and conditional rendering in the React UI (for UX only
— it hides buttons the user isn't allowed to click, but the API is the actual gatekeeper).

The frontend is a single-page app with a persistent sidebar layout, one route tree per module
(Customers / Products / Challans), and nested `ProtectedRoute` wrappers for both "must be logged in"
and "must have role X" checks.

**Challan confirm logic (the core business rule):** confirming a challan opens a Prisma transaction,
re-fetches each line item's product at its *current* stock level (not the stock level from when the
draft was created), and verifies every item has enough stock. If any item is short, the whole
transaction throws and rolls back — nothing is deducted and the challan stays `DRAFT`. Only if every
item passes does it decrement stock and write `StockMovement` (OUT) rows, in the same transaction as
setting the challan to `CONFIRMED`. This makes the negative-stock scenario structurally impossible,
not just checked-and-hoped-for.

---

## 2. Local setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local install, or a free hosted instance — see Deployment section)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string, and set JWT_SECRET

npx prisma migrate dev --name init   # creates tables
npm run seed                         # creates one login per role + sample data
npm run dev                          # starts API on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:4000

npm run dev    # starts UI on http://localhost:5173
```

Open `http://localhost:5173` and log in with any seeded account (see credentials below).

---

## 3. Test login credentials

All seeded accounts use the password: **`Password123!`**

| Role      | Email               |
|-----------|----------------------|
| Admin     | admin@erp.test       |
| Sales     | sales@erp.test       |
| Warehouse | warehouse@erp.test   |
| Accounts  | accounts@erp.test    |

The seed script (`backend/prisma/seed.ts`) also creates one sample customer and two sample products
so the app isn't empty on first login.

---

## 4. Environment variables

**Backend (`backend/.env`)**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `PORT` | API port (default 4000) |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |

**Frontend (`frontend/.env`)**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the deployed/local backend API |

Neither `.env` file is committed — only `.env.example`.

---

## 5. Deployment

Any free-tier combination works. Suggested:

- **Database:** [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free Postgres)
- **Backend:** [Render](https://render.com) or [Railway](https://railway.app) -> Deployment Link : https://mini-erp-crm-kb1s.onrender.com
- **Frontend:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com) -> Deployment Link : mini-erp-crm-ten-teal.vercel.app

### Steps

1. Create a free Postgres database on Neon/Supabase, copy the connection string.
2. Deploy `backend/` to Render/Railway:
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm run prisma:deploy && npm start` (runs pending migrations, then boots the server)
   - Set env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` (set to your deployed frontend URL)
3. Run the seed script once against the deployed DB (locally, pointing `DATABASE_URL` at the hosted DB): `npm run seed`
4. Deploy `frontend/` to Vercel/Netlify:
   - Build command: `npm run build`, output directory: `dist`
   - Set env var `VITE_API_URL` to your deployed backend URL
5. Update the backend's `CORS_ORIGIN` to match the final frontend URL and redeploy.

AWS deployment (EC2/ECS + RDS) is treated as a bonus per the assignment brief and was not required
for the primary submission; the app has no AWS-specific dependencies, so it can be lifted onto EC2 +
RDS by pointing `DATABASE_URL` at RDS and running the same build/start commands behind a process
manager (pm2) or in a container (see `docker-compose.yml`).

---

## 6. API documentation

See `postman_collection.json` — import it into Postman. It includes a `Login` request per role that
saves the returned token into a collection variable (`{{token}}`) which every other request uses
automatically via the collection's Authorization tab.

Base URL variable: `{{baseUrl}}` (defaults to `http://localhost:4000`, override for the deployed API).

Full route list:
POST /auth/login
GET /auth/me

GET /customers ?search=&status=&customerType=&page=&limit=
POST /customers
GET /customers/:id
PUT /customers/:id
POST /customers/:id/notes

GET /products ?search=&lowStock=true&page=&limit=
POST /products
GET /products/:id
PUT /products/:id
GET /products/:id/stock-movements ?page=&limit=
POST /products/:id/stock-movement

GET /challans ?status=&customerId=&page=&limit=
POST /challans
GET /challans/:id
PUT /challans/:id (DRAFT only)
POST /challans/:id/confirm
POST /challans/:id/cancel


---

## 7. Assumptions made

- **Role permissions:** Admin and Sales can create/edit Customers and Challans. Admin and Warehouse
  can create/edit Products and record stock movements. All authenticated roles can *view* everything
  (Accounts needs visibility into customers/products/challans for billing/reporting even though it
  doesn't create them). Cancelling a challan is allowed for Admin, Sales, and Accounts.
- **Cancelling a CONFIRMED challan restocks the products** it had deducted (treated as "goods not
  actually shipped"). This is a judgment call the brief didn't specify; a real system would likely
  make this configurable or require a separate "returned" flow.
- **Challan numbering** is `CH-<year>-<sequence>`, sequential per calendar year, generated inside the
  same transaction as challan creation to avoid race conditions.
- **Stock movement log** is written both for manual Warehouse adjustments (`POST
  /products/:id/stock-movement`) and automatically when a challan is confirmed/cancelled — so it's a
  complete audit trail, not just a manual log.
- **Minimum stock alert** is a simple `currentStock <= minStockAlert` comparison surfaced as
  `isLowStock` on the product and as a dashboard count; there's no notification/email system.
- **GST number and email are optional** on customers, per the brief listing GST as optional and not
  explicitly requiring email.

---

## 8. Known limitations / incomplete parts

- No automated test suite (unit/integration tests) was included given the 48-hour scope — manual
  verification was done via the Postman collection and the UI flows.
- No PDF export of challans/invoices (listed as a bonus item in the brief).
- No file upload for product images (S3 bonus item).
- No Docker Compose *deployment* pipeline (GitHub Actions) was set up, only a local
  `docker-compose.yml` for convenience running Postgres + backend locally.
- Search is a simple `contains`/case-insensitive match, not full-text search.
- The frontend does not paginate the customer/product dropdown lookups used inside the Challan form
  (fetches up to 100/200 records) — fine for this scale, would need a searchable async select for a
  much larger catalog.
