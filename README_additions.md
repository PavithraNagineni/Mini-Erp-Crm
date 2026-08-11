## Features implemented

- [x] **Auth & Roles** — JWT login, 4 roles (Admin, Sales, Warehouse, Accounts), route-level enforcement
- [x] **Customer CRM** — add / edit / search / detail view / follow-up notes / status tracking (Lead, Active, Inactive)
- [x] **Product & Inventory** — add / edit products, stock movement log (IN/OUT), low-stock alerts
- [x] **Sales Challan** — multi-product challan, auto-generated challan number, Draft/Confirmed/Cancelled flow, atomic stock deduction with insufficient-stock protection, product snapshot data
- [x] **Pagination & search/filter** across Customers, Products, Challans
- [x] **Deployment** — live on Render (backend) + Vercel (frontend)

---

## Role permissions matrix

| Action                          | Admin | Sales | Warehouse | Accounts |
|----------------------------------|:---:|:---:|:---:|:---:|
| View Customers / Products / Challans | ✅ | ✅ | ✅ | ✅ |
| Create / Edit Customer          | ✅ | ✅ | ❌ | ❌ |
| Add follow-up note              | ✅ | ✅ | ❌ | ❌ |
| Create / Edit Product           | ✅ | ❌ | ✅ | ❌ |
| Record stock movement (IN/OUT)  | ✅ | ❌ | ✅ | ❌ |
| Create / Edit Draft Challan     | ✅ | ✅ | ❌ | ❌ |
| Confirm Challan                 | ✅ | ✅ | ❌ | ❌ |
| Cancel Challan                  | ✅ | ✅ | ❌ | ✅ |

Enforced server-side via `authorize(...roles)` middleware on every route — the frontend only hides
buttons for UX, it is never the actual gatekeeper.

---

## Run locally with Docker (optional)

A `docker-compose.yml` is included for spinning up Postgres locally without installing it natively:

```bash
docker compose up -d          # starts Postgres on localhost:5432
cd backend
npx prisma migrate dev --name init
npm run seed
npm run dev
```

---

## Example: challan confirmation (success vs. insufficient stock)

**`POST /challans/:id/confirm`** — success:

```json
// 200 OK
{
  "id": "…",
  "challanNumber": "CH-2026-000001",
  "status": "CONFIRMED",
  "totalQuantity": 5,
  "items": [ { "productId": "…", "quantity": 5, "productNameSnapshot": "Kaju Katli" } ]
}
```

**`POST /challans/:id/confirm`** — insufficient stock (nothing is deducted, challan stays `DRAFT`):

```json
// 400 Bad Request
{
  "message": "Insufficient stock for one or more products",
  "insufficient": [
    { "productId": "…", "name": "PVC Pipe 2 inch", "available": 20, "requested": 50 }
  ]
}
```

---

## Screenshots

| Login | Dashboard |
|---|---|
| ![Login](./docs/screenshots/login.png) | ![Dashboard](./docs/screenshots/dashboard.png) |

| Customers | Products |
|---|---|
| ![Customers](./docs/screenshots/customers.png) | ![Products](./docs/screenshots/products.png) |

**Sales Challans**

![Challans](./docs/screenshots/challans.png)
