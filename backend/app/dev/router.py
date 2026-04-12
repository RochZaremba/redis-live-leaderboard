import json
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.leaderboard.service import (
    GLOBAL_LEADERBOARD_KEY,
    UPDATES_CHANNEL,
    current_week_key,
    ensure_weekly_ttl,
)
from app.players.service import player_key

router = APIRouter(prefix="/dev", tags=["dev"])
RedisDep = Annotated[Redis, Depends(get_redis)]

DEMO_PLAYERS = [
    {
        "id": "demo-roch",
        "nick": "Roch",
        "avatar": "rocket",
        "score": 500,
        "gamesPlayed": 6,
        "correctAnswers": 5,
        "wrongAnswers": 1,
    },
    {
        "id": "demo-hubert",
        "nick": "Hubert",
        "avatar": "bolt",
        "score": 400,
        "gamesPlayed": 5,
        "correctAnswers": 4,
        "wrongAnswers": 1,
    },
    {
        "id": "demo-maniek",
        "nick": "Maniek",
        "avatar": "star",
        "score": 300,
        "gamesPlayed": 5,
        "correctAnswers": 3,
        "wrongAnswers": 2,
    },
    {
        "id": "demo-ania",
        "nick": "Ania",
        "avatar": "diamond",
        "score": 200,
        "gamesPlayed": 4,
        "correctAnswers": 2,
        "wrongAnswers": 2,
    },
]


async def _delete_pattern(redis: Redis, pattern: str) -> int:
    keys = [key async for key in redis.scan_iter(match=pattern)]
    if not keys:
        return 0
    return int(await redis.delete(*keys))


@router.post("/reset")
async def reset(redis: RedisDep) -> dict:
    deleted = 0
    deleted += await _delete_pattern(redis, "player:*")
    deleted += await _delete_pattern(redis, "leaderboard:*")
    return {"status": "ok", "deletedKeys": deleted}


@router.post("/seed")
async def seed(redis: RedisDep) -> dict:
    await reset(redis)
    week_key = current_week_key()

    for player in DEMO_PLAYERS:
        await redis.hset(
            player_key(player["id"]),
            mapping={
                "id": player["id"],
                "nick": player["nick"],
                "avatar": player["avatar"],
                "gamesPlayed": player["gamesPlayed"],
                "correctAnswers": player["correctAnswers"],
                "wrongAnswers": player["wrongAnswers"],
                "totalScore": player["score"],
            },
        )
        await redis.zadd(GLOBAL_LEADERBOARD_KEY, {player["id"]: player["score"]})
        await redis.zadd(week_key, {player["id"]: player["score"]})

    await ensure_weekly_ttl(redis, week_key)
    await redis.publish(
        UPDATES_CHANNEL,
        json.dumps(
            {
                "type": "leaderboard.seeded",
                "players": len(DEMO_PLAYERS),
                "weekKey": week_key,
                "updatedAt": datetime.now(UTC).isoformat(),
            },
        ),
    )

    return {
        "status": "ok",
        "players": len(DEMO_PLAYERS),
        "globalKey": GLOBAL_LEADERBOARD_KEY,
        "weeklyKey": week_key,
    }
