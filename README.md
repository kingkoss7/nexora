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

- Royal Purple premium dark theme with responsive product cards.
- Product browsing, search, category filtering and price sorting.
- Registration and login using existing bearer-token authentication.
- Database-backed cart, quantity updates and checkout.
- Delivery address form and cash-on-delivery checkout.
- Customer order history and payment status.
- Admin product creation and valid order-status updates.

The backend still validates inventory and calculates order totals. Online card payments and wishlist routes are not provided by the current API. The Python UI is a first migration pass; test it against your configured database before presenting the project.

## Tests

Run existing backend tests from the `backend/` directory:

```powershell
.\venv\Scripts\python.exe -m pytest
```

The original static frontend is preserved in `frontend/` if you need to compare or roll back. No database schema or migration files were changed by this UI addition.
