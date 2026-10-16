# NEXORA E-Commerce

A lightweight local e-commerce app built with a database-first structure.

## Stack
- Frontend (new simplified version): Vue 3, JavaScript, Vite, Tailwind CSS 4
- Legacy frontend (retained during migration): Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT authentication
- Database: PostgreSQL with Alembic migrations
- Tests: Pytest

The Vue frontend is a compact storefront prototype connected to the existing API. The original Next.js frontend remains unchanged until required account, checkout, wishlist, order-history, and admin flows are migrated and tested.

## Local setup
Use Python 3.12+ and PostgreSQL 16+.

1. Create the backend environment file:

```powershell
cd backend
Copy-Item .env.example .env
```

2. Update the database connection and secret in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres@localhost:5432/NEXORA_db
SECRET_KEY=replace_with_a_long_random_secret
SEED_DEMO_DATA=false
```

3. Install backend dependencies and run migrations:

```powershell
python -m venv venv
.\\venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\venv\\Scripts\\python.exe -m alembic upgrade head
```

4. Create the admin user:

```powershell
.\\venv\\Scripts\\python.exe -m app.bootstrap_admin --email admin@example.com
```

5. Start the API:

```powershell
.\\venv\\Scripts\\python.exe -m uvicorn app.main:app --reload
```

6. Start the Vue storefront in another terminal:

```powershell
cd frontend-vue
Copy-Item .env.example .env
npm install
npm run dev
```

The Vue development server uses port 3000 to match the existing FastAPI CORS defaults:
- API: http://localhost:8000
- Vue frontend: http://localhost:3000

To run the retained Next.js frontend instead, use `cd frontend`, then `npm install` and `npm run dev`.

## Vue frontend scope
- Loads products from the existing `GET /products` API.
- Product search and category filters.
- Responsive product cards with stock and price display.
- Session-only shopping bag with quantity controls.
- Loading, API-error, empty, and out-of-stock states.
- No animations.

The simplified Vue frontend does not yet include authentication, persistent cart synchronization, checkout, wishlist, order history, or admin tools. The backend and database were not changed.

## Database tables
The current schema has exactly 10 application tables, defined in `backend/app/models.py` and managed by Alembic:
- users
- products
- carts
- cart_items
- wishlists
- wishlist_items
- addresses
- orders
- order_items
- payments

Primary keys are named for their tables: `users.uid`, `products.pid`, `carts.cid`,
`cart_items.cart_item_id`, `wishlists.wid`, `wishlist_items.wishlist_item_id`,
`addresses.address_id`, `orders.oid`, `order_items.order_item_id`, and
`payments.payment_id`. Foreign-key columns name the referenced key, for example
`orders.user_uid`, `cart_items.cart_cid` / `cart_items.product_pid`, and
`payments.order_oid`. Alembic revision `0007_descriptive_key_names` renames the
existing columns and constraints without discarding table data.

Delivery details are copied onto each order so order history stays accurate if a saved address changes. Checkout records cash-on-delivery as pending; it is marked paid when the admin marks the order delivered. Order statuses follow `placed → packed → shipped → delivered`; an order may be cancelled while placed or packed.

This project is intentionally kept simple and local-first. There is no Docker or remote deployment setup. Login rate limiting is held in the running API process and resets when the API restarts.

## Testing
```powershell
cd backend
.\\venv\\Scripts\\python.exe -m pytest
```
