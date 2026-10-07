import os
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

os.environ.setdefault("SECRET_KEY", "test-only-secret-key-not-for-deployment-32-bytes")
os.environ["TEST_ADMIN_EMAIL"] = "admin@shop.com"
os.environ["TEST_ADMIN_PASSWORD"] = "test-only-admin-password"
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL must point to PostgreSQL to run the backend tests.")

base_url = make_url(database_url)
if base_url.get_backend_name() != "postgresql":
    raise RuntimeError("Backend tests require PostgreSQL; SQLite is not supported.")

test_schema = f"pytest_{uuid4().hex}"
maintenance_engine = create_engine(base_url)
with maintenance_engine.begin() as connection:
    connection.exec_driver_sql(f'CREATE SCHEMA "{test_schema}"')

os.environ["DATABASE_URL"] = str(
    base_url.update_query_dict({"options": f"-csearch_path={test_schema}"})
)

from app import models
from app.auth import hash_pw
from app.database import Base, SessionLocal, engine

Base.metadata.create_all(engine)
with SessionLocal() as db:
    db.add(models.User(
        email=os.environ["TEST_ADMIN_EMAIL"],
        password_hash=hash_pw(os.environ["TEST_ADMIN_PASSWORD"]),
        role="admin",
    ))
    db.add_all([
        models.Product(name=name, category=category, price=price, stock=stock, description=f"Test product: {name}.")
        for name, category, price, stock in [
            ("Laptop Pro 14", "electronics", 1299, 15),
            ("Wireless Headphones", "electronics", 199, 40),
            ("Mechanical Keyboard", "electronics", 89, 60),
            ("Running Shoes", "fashion", 120, 30),
            ("Denim Jacket", "fashion", 75, 25),
            ("Coffee Maker", "home", 59, 20),
            ("Desk Lamp", "home", 35, 50),
            ("Backpack", "fashion", 49, 35),
        ]
    ])
    db.commit()


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    with maintenance_engine.begin() as connection:
        connection.exec_driver_sql(f'DROP SCHEMA "{test_schema}" CASCADE')
    maintenance_engine.dispose()
