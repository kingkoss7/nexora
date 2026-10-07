import logging

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

logger = logging.getLogger(__name__)


class OrderConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, set()).add(websocket)
        await websocket.send_json({"type": "connected"})

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if connections is None:
            return
        connections.discard(websocket)
        if not connections:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, event: dict[str, object]) -> None:
        for websocket in tuple(self._connections.get(user_id, ())):
            try:
                await websocket.send_json(event)
            except (RuntimeError, WebSocketDisconnect):
                logger.info("Removing a disconnected order notification socket")
                self.disconnect(user_id, websocket)


order_connections = OrderConnectionManager()
