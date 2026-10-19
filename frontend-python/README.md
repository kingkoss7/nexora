# NEXORA Python UI (NiceGUI)

This folder contains the Python-based storefront requested for the project. The existing `frontend/` HTML/CSS/JavaScript version is retained as a backup and is not overwritten. The FastAPI + PostgreSQL backend and Alembic migrations are unchanged.

## Start it on Windows

1. Start PostgreSQL and configure `backend/.env` as described in the root README.
2. In terminal 1, start the existing API from the `backend` folder:

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

3. In terminal 2, from the repository root:

```powershell
python -m venv .venv-nicegui
.\.venv-nicegui\Scripts\python.exe -m pip install -r frontend-python/requirements.txt
$env:NEXORA_API_URL = "http://127.0.0.1:8000"
.\.venv-nicegui\Scripts\python.exe frontend-python/main.py
```

4. Open http://127.0.0.1:3000.

The NiceGUI process makes server-side HTTP requests to FastAPI, so browser CORS is not needed for this UI. The API still needs its database configured and migrations applied. To seed the API's demo products, set `SEED_DEMO_DATA=true` in `backend/.env` before starting FastAPI.

## Included UI workflows

- Royal Purple dark theme, responsive product cards and search/category/price sorting.
- Register and sign in using the existing API token endpoint.
- Database-backed cart, quantity changes and checkout with delivery details.
- Cash-on-delivery orders and customer order history.
- Admin product creation and valid order-status transitions for an admin account.

This is a first migration pass. The original HTML/CSS/JS frontend is preserved for reference. Verify workflows against your own configured PostgreSQL database before the project demonstration. Online card payment and wishlist are not provided by the current backend API.
