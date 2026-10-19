import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app import models as m
from app.database import Base, SessionLocal, engine
from app.main import app

Base.metadata.create_all(engine)


def test_persistent_customer_commerce():
    with TestClient(app) as client:
        email = f"{uuid.uuid4().hex}@example.com"
        assert client.post("/auth/register", json={"name": "Customer", "email": email, "password": "secret1"}).status_code == 201
        token = client.post("/auth/login", json={"email": email, "password": "secret1"}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        products = client.get("/products", params={"size": 100}).json()
        product_id = max(products, key=lambda item: item["stock"])["pid"]
        product = next(item for item in products if item["pid"] == product_id)
        assert client.get("/cart", headers=headers).json() == {"items": []}
        assert client.put("/cart", json={"items": [{"product_pid": product_id, "quantity": 2}]}, headers=headers).status_code == 200
        assert client.get("/cart", headers=headers).json()["items"][0]["quantity"] == 2
        assert client.put("/cart", json={"items": []}, headers=headers).json() == {"items": []}

        address = {
            "label": "Test",
            "recipient_name": "Test Customer",
            "phone": "5550100",
            "address_line1": "1 Test Street",
            "city": "Test City",
            "postal_code": "12345",
            "country": "us",
            "is_default": True,
        }
        created_address = client.post("/addresses", json=address, headers=headers)
        assert created_address.status_code == 201
        assert created_address.json()["country"] == "US"
        assert "address_id" in created_address.json()

        order = client.post(
            "/orders",
            json={"items": [{"product_pid": product_id, "quantity": 1}], "address": address},
            headers=headers,
        )
        assert order.status_code == 201
        expected_total = round(product["price"] + (7.95 if product["price"] < 100 else 0), 2)
        assert order.json()["total"] == expected_total
        assert order.json()["items"][0]["price"] == product["price"]
        with SessionLocal() as db:
            saved_order = db.scalar(select(m.Order).where(m.Order.oid == order.json()["oid"]))
            assert saved_order is not None
            assert saved_order.delivery_address_line1 == "1 Test Street"
            assert saved_order.payment is not None
            assert saved_order.payment.method == "cash_on_delivery"
            assert saved_order.payment.status == "pending"

        assert client.delete(f"/addresses/{created_address.json()['address_id']}", headers=headers).status_code == 204

def test_admin_delete_of_cart_referenced_product_returns_conflict():
    with TestClient(app) as client:
        email = f"{uuid.uuid4().hex}@example.com"
        assert client.post(
            "/auth/register",
            json={"name": "Cart Customer", "email": email, "password": "secret1"},
        ).status_code == 201
        customer_token = client.post(
            "/auth/login", json={"email": email, "password": "secret1"}
        ).json()["access_token"]
        customer_headers = {"Authorization": f"Bearer {customer_token}"}
        product = client.get("/products", params={"size": 100}).json()[0]
        assert client.put(
            "/cart",
            json={"items": [{"product_pid": product["pid"], "quantity": 1}]},
            headers=customer_headers,
        ).status_code == 200

        admin_token = client.post(
            "/auth/login",
            json={"email": "admin@shop.com", "password": "test-only-admin-password"},
        ).json()["access_token"]
        response = client.delete(
            f"/products/{product['pid']}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 409
        assert "referenced by a cart or order" in response.json()["detail"]
        assert client.get("/products/" + str(product["pid"])).status_code == 200

