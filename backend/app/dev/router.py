import json
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.leaderboard.service import (
    UPDATES_CHANNEL,
    current_week_key,
    ensure_weekly_ttl,
    global_leaderboard_key,
)
from app.players.service import player_key
from app.quizzes.service import DEFAULT_QUIZ_ID

router = APIRouter(prefix="/dev", tags=["dev"])
RedisDep = Annotated[Redis, Depends(get_redis)]

DEMO_PLAYERS = [
    {
        "id": "demo-aleksandra",
        "nick": "Aleksandra",
        "avatar": "rocket",
        "score": 950,
        "gamesPlayed": 10,
        "correctAnswers": 9,
        "wrongAnswers": 1,
    },
    {
        "id": "demo-bartosz",
        "nick": "Bartosz",
        "avatar": "bolt",
        "score": 820,
        "gamesPlayed": 9,
        "correctAnswers": 8,
        "wrongAnswers": 1,
    },
    {
        "id": "demo-celina",
        "nick": "Celina",
        "avatar": "star",
        "score": 700,
        "gamesPlayed": 8,
        "correctAnswers": 7,
        "wrongAnswers": 1,
    },
    {
        "id": "demo-damian",
        "nick": "Damian",
        "avatar": "diamond",
        "score": 610,
        "gamesPlayed": 8,
        "correctAnswers": 6,
        "wrongAnswers": 2,
    },
    {
        "id": "demo-ewelina",
        "nick": "Ewelina",
        "avatar": "bolt",
        "score": 500,
        "gamesPlayed": 7,
        "correctAnswers": 5,
        "wrongAnswers": 2,
    },
    {
        "id": "demo-filip",
        "nick": "Filip",
        "avatar": "rocket",
        "score": 390,
        "gamesPlayed": 6,
        "correctAnswers": 4,
        "wrongAnswers": 2,
    },
    {
        "id": "demo-gabriela",
        "nick": "Gabriela",
        "avatar": "diamond",
        "score": 280,
        "gamesPlayed": 5,
        "correctAnswers": 3,
        "wrongAnswers": 2,
    },
    {
        "id": "demo-hubert",
        "nick": "Hubert",
        "avatar": "star",
        "score": 170,
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
    deleted += await _delete_pattern(redis, "quiz:*")
    deleted += int(await redis.delete("quizzes:index"))
    await redis.publish(
        UPDATES_CHANNEL,
        json.dumps(
            {
                "type": "leaderboard.reset",
                "quizId": DEFAULT_QUIZ_ID,
                "updatedAt": datetime.now(UTC).isoformat(),
            }
        ),
    )
    return {"status": "ok", "deletedKeys": deleted}


@router.post("/seed")
async def seed(redis: RedisDep) -> dict:
    week_key = current_week_key(quiz_id=DEFAULT_QUIZ_ID)
    global_key = global_leaderboard_key(DEFAULT_QUIZ_ID)

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
        await redis.zadd(global_key, {player["id"]: player["score"]})
        await redis.zadd(week_key, {player["id"]: player["score"]})

    await ensure_weekly_ttl(redis, week_key)
    await redis.publish(
        UPDATES_CHANNEL,
        json.dumps(
            {
                "type": "leaderboard.seeded",
                "quizId": DEFAULT_QUIZ_ID,
                "players": len(DEMO_PLAYERS),
                "weekKey": week_key,
                "updatedAt": datetime.now(UTC).isoformat(),
            },
        ),
    )

    return {
        "status": "ok",
        "players": len(DEMO_PLAYERS),
        "globalKey": global_key,
        "weeklyKey": week_key,
    }
