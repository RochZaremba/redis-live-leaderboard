import pytest
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.websocket.manager import ConnectionManager


class FakeWebSocket:
    client_state = WebSocketState.CONNECTED

    def __init__(self, *, disconnect_on_send: bool = False) -> None:
        self.disconnect_on_send = disconnect_on_send
        self.sent_payloads: list[dict] = []

    async def send_json(self, payload: dict) -> None:
        if self.disconnect_on_send:
            raise WebSocketDisconnect(code=1006)

        self.sent_payloads.append(payload)


@pytest.mark.asyncio
async def test_broadcast_removes_stale_connections() -> None:
    manager = ConnectionManager()
    stale_connection = FakeWebSocket(disconnect_on_send=True)
    live_connection = FakeWebSocket()
    payload = {"type": "leaderboard.score.updated"}
    manager.active_connections = {stale_connection, live_connection}

    await manager.broadcast_json(payload)

    assert live_connection.sent_payloads == [payload]
    assert live_connection in manager.active_connections
    assert stale_connection not in manager.active_connections
