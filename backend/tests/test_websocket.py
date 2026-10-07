import os
import uuid

from fastapi.testclient import TestClient

from app.main import app


def test_order_status_is_pushed_to_customer_socket():
    with TestClient(app) as client:
        email = f"{uuid.uuid4().hex}@example.com"
        assert client.post("/auth/register", json={"email": email, "password": "secret1"}).status_code == 201
        token = client.post("/auth/login", json={"email": email, "password": "secret1"}).json()["access_token"]
        admin_token = client.post(
            "/auth/login",
            json={
                "email": os.environ["TEST_ADMIN_EMAIL"],
                "password": os.environ["TEST_ADMIN_PASSWORD"],
            },
        ).json()["access_token"]
        product = client.get("/products", params={"size": 1}).json()[0]
        order = client.post(
            "/orders",
            json={"items": [{"product_id": product["id"], "quantity": 1}]},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert order.status_code == 201

        with client.websocket_connect(f"/ws/notifications?token={token}") as websocket:
            assert websocket.receive_json() == {"type": "connected"}
            response = client.patch(
                f"/orders/{order.json()['id']}/status",
                json={"status": "packed"},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert response.status_code == 200
            assert websocket.receive_json() == {
                "type": "order.status_changed",
                "order_id": order.json()["id"],
                "status": "packed",
            }
