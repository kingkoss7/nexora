# NEXORA E-Commerce (Next.js + FastAPI + PostgreSQL)

## Stack
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Three.js, React Three Fiber, Drei, Lucide React and Recharts.
- Backend: Python 3.12+, FastAPI, Uvicorn, Pydantic, SQLAlchemy 2.x, Alembic and JWT authentication with bcrypt password hashes.
- Database: PostgreSQL 16+. Backend tests run in an isolated temporary PostgreSQL schema; the application does not use SQLite or MongoDB.
- Infrastructure: Redis for product-list caching and auth rate limiting; authenticated WebSockets deliver order updates.
- Testing: Pytest, HTTPX and Playwright.

## Run with Docker
Docker Compose starts PostgreSQL 16, Redis, the API and the storefront:

```powershell
Copy-Item .env.example .env
$env:POSTGRES_PASSWORD = python -c "import secrets; print(secrets.token_urlsafe(32))"
$env:SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(32))"
Set-Content .env "POSTGRES_PASSWORD=$env:POSTGRES_PASSWORD`nSECRET_KEY=$env:SECRET_KEY`nSEED_DEMO_DATA=false`nNEXT_PUBLIC_API=http://localhost:8000`nCORS_ORIGINS=http://localhost:3000"
docker compose up --build
```

The storefront is at http://localhost:3000 and the API docs are at
http://localhost:8000/docs. The PostgreSQL port is bound to loopback for local
pgAdmin access; do not expose it publicly in a deployment. Create the first
administrator with an interactive password prompt:

```powershell
docker compose exec backend python -m app.bootstrap_admin --email admin@example.com
```

The project `.env` file is ignored by Git. Never commit or reuse secrets.
Enable `SEED_DEMO_DATA=true` only for a development database.
For deployment, set `NEXT_PUBLIC_API` to the public HTTPS API URL and
`CORS_ORIGINS` to the exact public HTTPS storefront origin before building.

## Run locally without Docker
Use Python 3.12 or newer, PostgreSQL 16 or newer, and a local Redis server.
Create `backend/.env` from the example, then apply migrations:

```powershell
cd backend
Copy-Item .env.example .env
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic upgrade head
```

The default database URL expects a local PostgreSQL database named `NEXORA_db`.
Adjust `DATABASE_URL`, `REDIS_URL`, and `SECRET_KEY` in `backend/.env` for your
local setup. Generate a random secret with
`python -c "import secrets; print(secrets.token_urlsafe(32))"` and place it in
the `SECRET_KEY` entry in that file. The API refuses to start if the secret is
missing or shorter than 32 bytes.

Create or securely reset an administrator using a hidden password prompt:

```powershell
.\venv\Scripts\python.exe -m app.bootstrap_admin --email admin@example.com
```

When upgrading an older deployment, reset the password of the legacy
`admin@shop.com` account with this command before reopening admin access.

To load sample products in a development database, set `SEED_DEMO_DATA=true`
before starting the API. Demo accounts are never created automatically.

Run the API:
```powershell
.\venv\Scripts\uvicorn.exe app.main:app --reload
```

In another terminal, start the storefront:
```powershell
cd frontend
npm install
npm run dev
```

Set `$env:NEXT_PUBLIC_API = "http://localhost:8000"` if the API runs elsewhere.

## Redis and real-time order updates
When `REDIS_URL` is configured, product-list responses are cached for 60 seconds
and registration/login are limited to 10 requests per minute per client IP.
Cache failures are logged and product requests fall back to PostgreSQL; if Redis
is unavailable, authentication requests fail closed rather than bypassing the
rate limit. Without `REDIS_URL`, Redis-backed features are disabled for local
tests.

Authenticated clients can connect to `/ws/notifications?token=<JWT>`. The API
sends `order.created` and `order.status_changed` events to the owning customer.
The orders page listens for status updates and refreshes the order list.
Because browser WebSocket APIs cannot set an Authorization header, this
development endpoint accepts the short-lived JWT in the query string; use
WSS and ensure URL query strings are not logged when deploying it. Connections
are held in the API process, so run one API worker unless cross-worker Redis
Pub/Sub is added.

## Features
JWT auth (bcrypt), roles, product search/filter/sort, PostgreSQL-persisted
customer carts, wishlists and saved addresses, checkout with stock control and
an immutable delivery-address snapshot, order history, admin product/order
management + sales stats. The customer cart, wishlist, address and order-address
tables are provisioned through Alembic revisions; checkout address data is
stored as an order snapshot so later address edits do not change past orders.
Database schema changes are managed with Alembic migrations.

The Next.js App Router storefront also includes responsive product detail pages,
quick view, client-side saved favorites, checkout, and customer/admin dashboards.
The public home page has an interactive Three.js hero, and product detail pages
include rotatable category-specific 3D models with a product-photo alternative.
shadcn/ui-compatible Button, Input and Card primitives are available in
`frontend/components/ui`; add further shadcn components as needed. Online
payment processing is not enabled. Favorites and cart contents are stored in
browser local storage.

## Tests
Run backend tests:
```powershell
cd backend
.\venv\Scripts\python.exe -m pytest
```
Tests require the configured PostgreSQL database to be available. Each run uses
and removes a temporary schema, leaving application data untouched.

Install the Playwright browser once and run the storefront end-to-end smoke test:
```powershell
cd frontend
npx playwright install chromium
npm run test:e2e
```
