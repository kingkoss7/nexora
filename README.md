# NEXORA E-Commerce

A database-focused e-commerce mini-project using **Python NiceGUI** for the storefront and the existing **FastAPI + SQLAlchemy + PostgreSQL + Alembic** backend. The previous HTML/CSS/JavaScript frontend remains in `frontend/` as a backup; the new Python UI is in `frontend-python/`.

## Requirements

- Python 3.12+
- PostgreSQL 16+
- Existing backend environment configured in `backend/.env`

## 1. Configure and start the backend

From the repository root, create the environment file if you have not already:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set `DATABASE_URL` and a strong `SECRET_KEY` (at least 32 bytes) in `backend\.env`. Then start the API in terminal 1:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m app.bootstrap_admin --email admin@example.com
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Use your own admin email when running the bootstrap command. To add demo products, set `SEED_DEMO_DATA=true` in `backend/.env` before starting the API.

## 2. Start the Python NiceGUI frontend

Open terminal 2 at the repository root:

```powershell
python -m venv .venv-nicegui
.\.venv-nicegui\Scripts\python.exe -m pip install -r frontend-python/requirements.txt
$env:NEXORA_API_URL = "http://127.0.0.1:8000"
.\.venv-nicegui\Scripts\python.exe frontend-python/main.py
```

Open **http://127.0.0.1:3000** in your browser. NiceGUI talks to FastAPI server-side, so the browser UI does not need CORS configuration. If the API runs at another address, change `NEXORA_API_URL`.

More detailed setup notes: [frontend-python/README.md](frontend-python/README.md).

## Features in the Python UI

- Royal Purple responsive storefront, product detail pages, search, category filtering and price sorting.
- Registration and login using the existing bearer-token authentication.
- Database-backed cart with quantity changes and stock checks.
- Checkout with delivery details and cash-on-delivery payment.
- Customer order history, payment status, account summary and saved-address management.
- Admin product create/edit/delete controls and valid order-status transitions.
- Inventory is rechecked and locked during checkout to reduce overselling under concurrent orders.
- Product deletion returns a clear conflict if a cart or order still references that product.

The backend remains the source of truth for users, inventory, orders, totals and payment status. The current API supports cash on delivery only; wishlist routes and online card payments are not implemented. Run the automated checks and follow the final-demo checklist below before presenting.

## Final demo checklist

1. Start PostgreSQL, apply Alembic migrations and start FastAPI.
2. Bootstrap your administrator account using the command above.
3. Start NiceGUI in a second terminal and open http://127.0.0.1:3000.
4. Browse products, test search/filter/sorting and open a product detail page.
5. Register a customer, sign in, add items to the cart and change quantities.
6. Add a saved address, place a COD order and verify it appears in order history.
7. Sign in as admin, edit a product and move an order through allowed status transitions.
8. Confirm the stock count changes after checkout and that a referenced product cannot be deleted.
9. Run the backend tests from the backend folder with the configured PostgreSQL database.

Do not use real customer data or real payment details in the classroom demo. Use demo products and test accounts.

## Tests

Run existing backend tests from the `backend/` directory:

```powershell
.\venv\Scripts\python.exe -m pytest
```

The original static frontend is preserved in `frontend/` if you need to compare or roll back. No database schema or migration files were changed by this UI addition.
