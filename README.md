# NEXORA Database Commerce Project

A local database-focused commerce mini-project. The frontend uses browser-native
HTML, CSS and JavaScript with no frontend framework, dependencies, package manager
or build step. The API remains FastAPI with SQLAlchemy and Pydantic, backed by
PostgreSQL and Alembic.

## Requirements

- Python 3.12+
- PostgreSQL 16+

## Backend setup

From the repository root, create the backend environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set `DATABASE_URL` and a random `SECRET_KEY` of at least 32 bytes in
`backend\.env`. Install the API dependencies, apply migrations, create an admin,
and start FastAPI:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m app.bootstrap_admin --email admin@example.com
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Configure `CORS_ORIGINS` to allow the
origin serving the frontend (default examples include localhost and 127.0.0.1
on port 3000).

## Frontend setup

In a second terminal, serve the static files with Python:

```powershell
cd frontend
python -m http.server 3000 --bind 127.0.0.1
```

Open `http://127.0.0.1:3000`. The API base URL is `http://localhost:8000`, set
once at the beginning of `frontend\app.js`. To use a different API URL, change
that constant and include the frontend origin in backend `CORS_ORIGINS`.

## Testing

Run the backend tests:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest
```

The browser frontend has no build or package installation. Verify its routes and
API-backed workflows while FastAPI and PostgreSQL are running.

## Core workflows

- Browse, search, filter and sort products from the database.
- Register and sign in using the existing bearer-token authentication.
- Manage a database-backed cart and place cash-on-delivery orders with delivery
  details.
- Review order history, delivery progress and payment status.
- Admin users can create, edit and delete products and advance valid order
  statuses.

The API calculates order totals and validates inventory. Online card payments
are not enabled.

## Database

Backend models and Alembic history remain in `backend/app/` and `backend/alembic/`.
Do not run migrations against a database unless you intend to apply them.
Revision `0008_remove_wishlists` exists in the current project; applying it drops
the optional wishlist tables and their data.

The current application models are users, products, carts, cart items, addresses,
orders, order items and payments.
