import pytest
from fakeredis.aioredis import FakeRedis

from app.dev.router import seed
from app.leaderboard.service import add_score, get_global_leaderboard
from app.players.schemas import PlayerCreate
from app.players.service import create_player, get_player


@pytest.mark.asyncio
async def test_seed_adds_demo_scores_without_removing_existing_player() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="Existing", avatar="bolt"))
    await add_score(redis, player.id, 100)

    await seed(redis)

    saved_player = await get_player(redis, player.id)
    leaderboard = await get_global_leaderboard(redis, limit=10)

    assert saved_player.id == player.id
    assert saved_player.nick == "Existing"
    assert any(
        entry.playerId == player.id and entry.score == 100
        for entry in leaderboard.entries
    )
    assert any(
        entry.playerId == "demo-roch" and entry.score == 500
        for entry in leaderboard.entries
    )
    await redis.aclose()
