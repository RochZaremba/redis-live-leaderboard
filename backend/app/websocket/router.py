import asyncio
import json
from contextlib import suppress

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.leaderboard.service import UPDATES_CHANNEL
from app.websocket.manager import ConnectionManager

router = APIRouter(tags=["websocket"])
manager = ConnectionManager()


@router.websocket("/ws/leaderboard")
async def leaderboard_websocket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    await websocket.send_json({"type": "connection.ready"})
    try:
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def forward_redis_updates(redis: Redis) -> None:
    pubsub = redis.pubsub()
    await pubsub.subscribe(UPDATES_CHANNEL)
    try:
        async for message in pubsub.listen():
            if message.get("type") != "message":
                await asyncio.sleep(0)
                continue
            data = message.get("data")
            if not data:
                continue
            with suppress(json.JSONDecodeError):
                await manager.broadcast_json(json.loads(data))
    finally:
        await pubsub.unsubscribe(UPDATES_CHANNEL)
        await pubsub.aclose()

