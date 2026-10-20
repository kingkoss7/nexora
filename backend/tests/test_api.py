import os

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

Base.metadata.create_all(engine)


def test_commerce_tables_use_descriptive_primary_and_foreign_keys():
    primary_keys = {
        "users": "uid",
        "products": "pid",
        "carts": "cid",
        "cart_items": "cart_item_id",
        "addresses": "address_id",
        "orders": "oid",
        "order_items": "order_item_id",
        "payments": "payment_id",
    }
    for table_name, column_name in primary_keys.items():
        table = Base.metadata.tables[table_name]
        assert [column.name for column in table.primary_key.columns] == [column_name]

    foreign_keys = {
        "carts": {"user_uid": ("users", "uid")},
        "cart_items": {"cart_cid": ("carts", "cid"), "product_pid": ("products", "pid")},
        "addresses": {"user_uid": ("users", "uid")},
        "orders": {"user_uid": ("users", "uid")},
        "order_items": {"order_oid": ("orders", "oid"), "product_pid": ("products", "pid")},
        "payments": {"order_oid": ("orders", "oid")},
    }
    for table_name, expected in foreign_keys.items():
        table = Base.metadata.tables[table_name]
        actual = {
            column.name: (next(iter(column.foreign_keys)).column.table.name, next(iter(column.foreign_keys)).column.name)
            for column in table.columns
            if column.foreign_keys
        }
        assert actual == expected


def test_fixed_demo_admin_password_is_not_accepted():
    with TestClient(app) as c:
        response = c.post("/auth/login", json={"email": "admin@shop.com", "password": "admin123"})
        assert response.status_code == 401


def test_login_accepts_correct_password_and_rejects_wrong_password():
    with TestClient(app) as c:
        payload = {"name": "Login Check", "email": "login-check@example.com", "password": "correct-pass-123"}
        assert c.post("/auth/register", json=payload).status_code == 201

        wrong = c.post("/auth/login", json={"email": payload["email"], "password": "wrong-pass-123"})
        assert wrong.status_code == 401

        correct = c.post("/auth/login", json={"email": payload["email"], "password": payload["password"]})
        assert correct.status_code == 200
        token = correct.json()["access_token"]
        assert token
        assert c.get("/cart", headers={"Authorization": f"Bearer {token}"}).status_code == 200
        assert c.get("/cart").status_code == 401


def test_flow():
    with TestClient(app) as c:
        payload = {"name": " Test Customer ", "email": "a@b.com", "password": "secret1"}
        r = c.post("/auth/register", json=payload)
        assert r.status_code == 201
        assert r.json()["message"] == "Account created successfully"
        assert c.post("/auth/register", json=payload).status_code == 409
        assert c.post("/auth/register", json={"email": "missing-name@example.com", "password": "secret1"}).status_code == 422
        tok = c.post("/auth/login", json={"email": "a@b.com", "password": "secret1"}).json()["access_token"]
        h = {"Authorization": f"Bearer {tok}"}
        available_products = c.get("/products", params={"size": 100}).json()
        pid = max(available_products, key=lambda item: item["stock"])["pid"]
        product = c.get(f"/products/{pid}").json()
        assert product["pid"] == pid
        address = {
            "recipient_name": "Test Customer",
            "phone": "5550100",
            "address_line1": "1 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "country": "US",
        }
        placed = c.post(
            "/orders",
            json={"items": [{"product_pid": pid, "quantity": 2}], "address": address},
            headers=h,
        )
        assert placed.status_code == 201
        assert placed.json()["status"] == "placed"
        assert placed.json()["total"] == round(product["price"] * 2, 2)
        assert placed.json()["items"][0]["price"] == product["price"]
        assert c.post(
            "/orders",
            json={"items": [{"product_pid": pid, "quantity": 9999}], "address": address},
            headers=h,
        ).status_code == 409
        adm = c.post("/auth/login", json={
            "email": os.environ["TEST_ADMIN_EMAIL"],
            "password": os.environ["TEST_ADMIN_PASSWORD"],
        }).json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {adm}"}
        order_id = placed.json()["oid"]
        assert c.patch(
            f"/orders/{order_id}/status",
            json={"status": "delivered"},
            headers=admin_headers,
        ).status_code == 409
        for status in ("packed", "shipped", "delivered"):
            response = c.patch(
                f"/orders/{order_id}/status",
                json={"status": status},
                headers=admin_headers,
            )
            assert response.status_code == 200

        order = c.get("/orders", headers=h).json()[0]
        assert order["status"] == "delivered"
        assert order["payment"]["status"] == "paid"

        stock_before = c.get(f"/products/{pid}").json()["stock"]
        cancelled = c.post(
            "/orders",
            json={"items": [{"product_pid": pid, "quantity": 1}], "address": address},
            headers=h,
        )
        assert cancelled.status_code == 201
        assert c.get(f"/products/{pid}").json()["stock"] == stock_before - 1
        cancelled_response = c.patch(
            f"/orders/{cancelled.json()['oid']}/status",
            json={"status": "cancelled"},
            headers=admin_headers,
        )
        assert cancelled_response.status_code == 200
        assert c.get(f"/products/{pid}").json()["stock"] == stock_before
