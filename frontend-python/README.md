# NEXORA Python UI (NiceGUI)

The Python storefront requested for the project lives in this folder. The earlier HTML/CSS/JavaScript frontend remains in frontend/ for reference. The existing FastAPI + SQLAlchemy + PostgreSQL backend and Alembic schema are retained.

## Start on Windows

1. Start PostgreSQL and configure backend/.env using backend/.env.example. Set a strong SECRET_KEY of at least 32 bytes and the correct PostgreSQL DATABASE_URL.
2. In terminal 1, from the repository root, run:

    Copy-Item backend\.env.example backend\.env
    cd backend
    python -m venv venv
    .\venv\Scripts\python.exe -m pip install -r requirements.txt
    .\venv\Scripts\python.exe -m alembic upgrade head
    .\venv\Scripts\python.exe -m app.bootstrap_admin --email your-admin@example.com
    .\venv\Scripts\python.exe -m uvicorn app.main:app --reload

   When asked, enter and confirm a strong admin password. If you need sample products, set SEED_DEMO_DATA=true in backend/.env before starting the API.

3. In terminal 2, from the repository root, run:

    python -m venv .venv-nicegui
    .\.venv-nicegui\Scripts\python.exe -m pip install -r frontend-python\requirements.txt
    $env:NEXORA_API_URL = "http://127.0.0.1:8000"
    .\.venv-nicegui\Scripts\python.exe frontend-python\main.py

4. Open http://127.0.0.1:3000.

The NiceGUI process sends server-side requests to FastAPI. PostgreSQL remains the persistent database; the frontend does not connect to PostgreSQL directly.

## Workflows included

- Product browsing, product detail, search, category filtering and price sorting.
- Customer registration/login using FastAPI bearer tokens.
- Database-backed cart, quantity changes and stock validation.
- Checkout with delivery details and cash on delivery.
- Order history and payment status.
- Account summary, saved addresses, default-address selection and deletion.
- Admin product creation, editing and deletion, plus order-status updates.
- Backend guards against deleting products referenced by carts/orders and locks product rows during checkout.

## Before the final demo

- Confirm PostgreSQL is running and Alembic migrations completed successfully.
- Confirm the FastAPI docs open at http://127.0.0.1:8000/docs.
- Confirm sample products appear in the storefront.
- Test one customer order from login through checkout and order history.
- Test admin product editing and order status transitions.
- Run backend tests with the configured PostgreSQL URL: from backend/, run .\venv\Scripts\python.exe -m pytest.
- Use test accounts and sample data only.

## Current limitations

The backend currently supports cash-on-delivery payment only. Wishlist and online card-payment endpoints are not present in the current API. Test the application with your own configured database before presenting; CI checks do not replace a full manual browser demo.
