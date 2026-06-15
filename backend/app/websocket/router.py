import asyncio
import json
from contextlib import suppress

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import RedisError
from redis.exceptions import TimeoutError as RedisTimeoutError

from app.leaderboard.service import UPDATES_CHANNEL
from app.websocket.manager import ConnectionManager

router = APIRouter(tags=["websocket"])
manager = ConnectionManager()


@router.websocket("/ws/leaderboard")
async def leaderboard_websocket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "connection.ready"})
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def is_task_cancelling() -> bool:
    task = asyncio.current_task()
    return bool(task and task.cancelling())


async def forward_redis_updates(redis_url: str) -> None:
    while True:
        redis = Redis.from_url(redis_url, decode_responses=True)
        pubsub = redis.pubsub()
        try:
            await pubsub.subscribe(UPDATES_CHANNEL)
            while True:
                try:
                    message = await pubsub.get_message(
                        ignore_subscribe_messages=True,
                        timeout=1.0,
                    )
                except RedisTimeoutError as exc:
                    if is_task_cancelling():
                        raise asyncio.CancelledError from exc
                    continue

                if message is None:
                    await asyncio.sleep(0)
                    continue

                data = message.get("data")
                if not data:
                    continue
                with suppress(json.JSONDecodeError):
                    await manager.broadcast_json(json.loads(data))
        except asyncio.CancelledError:
            raise
        except (RedisConnectionError, RedisTimeoutError):
            await asyncio.sleep(1)
        finally:
            with suppress(RedisError, RuntimeError):
                await pubsub.unsubscribe(UPDATES_CHANNEL)
            with suppress(RedisError, RuntimeError):
                await pubsub.aclose()
            with suppress(RedisError, RuntimeError):
                await redis.aclose()
