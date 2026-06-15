from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast_json(self, payload: dict) -> None:
        stale: list[WebSocket] = []
        for connection in list(self.active_connections):
            if connection.client_state != WebSocketState.CONNECTED:
                stale.append(connection)
                continue
            try:
                await connection.send_json(payload)
            except (RuntimeError, WebSocketDisconnect):
                stale.append(connection)

        for connection in stale:
            self.disconnect(connection)
