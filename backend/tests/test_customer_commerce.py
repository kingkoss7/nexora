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
        assert client.post("/auth/register", json={"email": email, "password": "secret1"}).status_code == 201
        token = client.post("/auth/login", json={"email": email, "password": "secret1"}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        products = client.get("/products", params={"size": 100}).json()
        product_id = max(products, key=lambda item: item["stock"])["id"]

        assert client.get("/cart", headers=headers).json() == {"items": []}
        assert client.put("/cart", json={"items": [{"product_id": product_id, "quantity": 2}]}, headers=headers).status_code == 200
        assert client.get("/cart", headers=headers).json()["items"][0]["quantity"] == 2
        assert client.put("/cart", json={"items": []}, headers=headers).json() == {"items": []}

        assert client.put(f"/wishlist/{product_id}", headers=headers).status_code == 204
        assert client.get("/wishlist", headers=headers).json()["items"][0]["id"] == product_id
        assert client.delete(f"/wishlist/{product_id}", headers=headers).status_code == 204

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

        order = client.post(
            "/orders",
            json={"items": [{"product_id": product_id, "quantity": 1}], "address": address},
            headers=headers,
        )
        assert order.status_code == 201
        with SessionLocal() as db:
            snapshot = db.scalar(select(m.OrderAddress).where(m.OrderAddress.order_id == order.json()["id"]))
            assert snapshot is not None
            assert snapshot.address_line1 == "1 Test Street"

        assert client.delete(f"/addresses/{created_address.json()['id']}", headers=headers).status_code == 204
