import os

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

Base.metadata.create_all(engine)

def test_fixed_demo_admin_password_is_not_accepted():
    with TestClient(app) as c:
        response = c.post("/auth/login", json={"email": "admin@shop.com", "password": "admin123"})
        assert response.status_code == 401


def test_flow():
    with TestClient(app) as c:
        r = c.post("/auth/register", json={"email": "a@b.com", "password": "secret1"})
        assert r.status_code in (201, 409)
        tok = c.post("/auth/login", json={"email": "a@b.com", "password": "secret1"}).json()["access_token"]
        h = {"Authorization": f"Bearer {tok}"}
        available_products = c.get("/products", params={"size": 100}).json()
        pid = max(available_products, key=lambda item: item["stock"])["id"]
        assert c.post("/orders", json={"items": [{"product_id": pid, "quantity": 2}]}, headers=h).status_code == 201
        assert c.post("/orders", json={"items": [{"product_id": pid, "quantity": 9999}]}, headers=h).status_code == 409
        assert c.get("/admin/stats", headers=h).status_code == 403
        adm = c.post("/auth/login", json={
            "email": os.environ["TEST_ADMIN_EMAIL"],
            "password": os.environ["TEST_ADMIN_PASSWORD"],
        }).json()["access_token"]
        assert c.get("/admin/stats", headers={"Authorization": f"Bearer {adm}"}).json()["orders"] >= 1
