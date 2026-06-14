import pytest
from fakeredis.aioredis import FakeRedis

from app.leaderboard.service import (
    GLOBAL_LEADERBOARD_KEY,
    add_score,
    current_week_key,
    get_global_leaderboard,
    get_player_rank,
)
from app.players.schemas import PlayerCreate
from app.players.service import create_player


@pytest.mark.asyncio
async def test_add_score_updates_global_and_weekly_leaderboards() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="Tester", avatar="bolt"))

    rank = await add_score(redis, player.id, 100)

    assert rank.globalRank == 1
    assert rank.globalScore == 100
    assert await redis.zscore(GLOBAL_LEADERBOARD_KEY, player.id) == 100
    assert await redis.zscore(current_week_key(), player.id) == 100
    assert await redis.ttl(current_week_key()) > 0
    await redis.aclose()


@pytest.mark.asyncio
async def test_add_score_includes_zero_point_players() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="Zero", avatar="bolt"))

    rank = await add_score(redis, player.id, 0)

    assert rank.globalRank == 1
    assert rank.globalScore == 0
    assert await redis.zscore(GLOBAL_LEADERBOARD_KEY, player.id) == 0
    assert await redis.zscore(current_week_key(), player.id) == 0
    assert await redis.ttl(current_week_key()) > 0
    await redis.aclose()


@pytest.mark.asyncio
async def test_zero_point_score_does_not_overwrite_existing_score() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="Scored", avatar="star"))

    await add_score(redis, player.id, 100)
    rank = await add_score(redis, player.id, 0)

    assert rank.globalRank == 1
    assert rank.globalScore == 100
    assert await redis.zscore(GLOBAL_LEADERBOARD_KEY, player.id) == 100
    assert await redis.zscore(current_week_key(), player.id) == 100
    await redis.aclose()


@pytest.mark.asyncio
async def test_leaderboard_returns_players_in_score_order() -> None:
    redis = FakeRedis(decode_responses=True)
    first = await create_player(redis, PlayerCreate(nick="First", avatar="star"))
    second = await create_player(redis, PlayerCreate(nick="Second", avatar="rocket"))

    await add_score(redis, first.id, 100)
    await add_score(redis, second.id, 200)

    leaderboard = await get_global_leaderboard(redis, limit=10)

    assert [entry.playerId for entry in leaderboard.entries] == [second.id, first.id]
    assert [entry.rank for entry in leaderboard.entries] == [1, 2]
    await redis.aclose()


@pytest.mark.asyncio
async def test_player_without_score_has_no_rank() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="NoScore", avatar="diamond"))

    rank = await get_player_rank(redis, player.id)

    assert rank.globalRank is None
    assert rank.globalScore == 0
    await redis.aclose()
