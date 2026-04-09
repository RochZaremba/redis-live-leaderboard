from redis.asyncio import Redis

from app.core.config import Settings, get_settings

_redis: Redis | None = None


async def init_redis(settings: Settings | None = None) -> Redis:
    global _redis
    settings = settings or get_settings()
    _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    await _redis.ping()
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis client is not initialized")
    return _redis

