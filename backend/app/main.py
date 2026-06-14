import asyncio
from contextlib import asynccontextmanager, suppress
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis

from app.common.errors import install_exception_handlers
from app.core.config import get_settings
from app.core.redis_client import close_redis, get_redis, init_redis
from app.dev.router import router as dev_router
from app.game.router import router as game_router
from app.leaderboard.router import router as leaderboard_router
from app.players.router import router as players_router
from app.quizzes.router import router as quizzes_router
from app.websocket.router import forward_redis_updates
from app.websocket.router import router as websocket_router

settings = get_settings()
RedisDep = Annotated[Redis, Depends(get_redis)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = await init_redis(settings)
    app.state.pubsub_task = asyncio.create_task(forward_redis_updates(redis))
    yield
    app.state.pubsub_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.pubsub_task
    await close_redis()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
install_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{settings.api_prefix}/health")
async def health(redis: RedisDep) -> dict[str, str]:
    await redis.ping()
    return {"status": "ok", "redis": "ok"}


app.include_router(players_router, prefix=settings.api_prefix)
app.include_router(quizzes_router, prefix=settings.api_prefix)
app.include_router(game_router, prefix=settings.api_prefix)
app.include_router(leaderboard_router, prefix=settings.api_prefix)
app.include_router(dev_router, prefix=settings.api_prefix)
app.include_router(websocket_router)
