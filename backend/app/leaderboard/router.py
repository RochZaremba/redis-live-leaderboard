from typing import Annotated

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.leaderboard.schemas import LeaderboardResponse
from app.leaderboard.service import get_global_leaderboard, get_weekly_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

LimitQuery = Annotated[int, Query(ge=1, le=100)]
RedisDep = Annotated[Redis, Depends(get_redis)]


@router.get("/global", response_model=LeaderboardResponse)
async def get_global(
    redis: RedisDep,
    limit: LimitQuery = 10,
) -> LeaderboardResponse:
    return await get_global_leaderboard(redis, limit)


@router.get("/weekly", response_model=LeaderboardResponse)
async def get_weekly(
    redis: RedisDep,
    limit: LimitQuery = 10,
) -> LeaderboardResponse:
    return await get_weekly_leaderboard(redis, limit)
