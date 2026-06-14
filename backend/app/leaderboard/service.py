import json
from datetime import UTC, date, datetime

from redis.asyncio import Redis

from app.common.errors import NotFoundError
from app.core.config import get_settings
from app.leaderboard.schemas import LeaderboardEntry, LeaderboardResponse
from app.players.schemas import PlayerRankResponse
from app.players.service import get_player, player_key, profile_from_hash
from app.quizzes.service import DEFAULT_QUIZ_ID, get_quiz_summary

UPDATES_CHANNEL = "leaderboard:updates"
GLOBAL_LEADERBOARD_KEY = f"leaderboard:{DEFAULT_QUIZ_ID}:global"


def global_leaderboard_key(quiz_id: str = DEFAULT_QUIZ_ID) -> str:
    return f"leaderboard:{quiz_id}:global"


def current_week_key(
    today: date | None = None,
    quiz_id: str = DEFAULT_QUIZ_ID,
) -> str:
    today = today or date.today()
    iso_year, iso_week, _ = today.isocalendar()
    return f"leaderboard:{quiz_id}:weekly:{iso_year}-{iso_week:02d}"


async def ensure_weekly_ttl(redis: Redis, key: str) -> None:
    ttl = await redis.ttl(key)
    if ttl in (-1, -2):
        await redis.expire(key, get_settings().weekly_leaderboard_ttl_seconds)


async def add_score(
    redis: Redis,
    player_id: str,
    points: int,
    quiz_id: str = DEFAULT_QUIZ_ID,
) -> PlayerRankResponse:
    await get_player(redis, player_id)
    await get_quiz_summary(redis, quiz_id)
    week_key = current_week_key(quiz_id=quiz_id)

    if points > 0:
        pipe = redis.pipeline()
        pipe.zincrby(global_leaderboard_key(quiz_id), points, player_id)
        pipe.zincrby(week_key, points, player_id)
        await pipe.execute()
        await ensure_weekly_ttl(redis, week_key)

    rank = await get_player_rank(redis, player_id, quiz_id=quiz_id)

    if points > 0:
        profile = await get_player(redis, player_id)
        event = {
            "type": "leaderboard.score.updated",
            "quizId": quiz_id,
            "player": {
                "id": profile.id,
                "nick": profile.nick,
                "avatar": profile.avatar,
            },
            "pointsDelta": points,
            "globalScore": rank.globalScore,
            "globalRank": rank.globalRank,
            "weeklyScore": rank.weeklyScore,
            "weeklyRank": rank.weeklyRank,
            "weekKey": rank.weekKey,
            "updatedAt": datetime.now(UTC).isoformat(),
        }
        await redis.publish(UPDATES_CHANNEL, json.dumps(event))

    return rank


async def get_player_rank(
    redis: Redis,
    player_id: str,
    quiz_id: str = DEFAULT_QUIZ_ID,
) -> PlayerRankResponse:
    await get_player(redis, player_id)
    await get_quiz_summary(redis, quiz_id)
    week_key = current_week_key(quiz_id=quiz_id)

    global_rank = await redis.zrevrank(global_leaderboard_key(quiz_id), player_id)
    weekly_rank = await redis.zrevrank(week_key, player_id)
    global_score = await redis.zscore(global_leaderboard_key(quiz_id), player_id)
    weekly_score = await redis.zscore(week_key, player_id)

    return PlayerRankResponse(
        quizId=quiz_id,
        playerId=player_id,
        globalRank=global_rank + 1 if global_rank is not None else None,
        globalScore=int(global_score or 0),
        weeklyRank=weekly_rank + 1 if weekly_rank is not None else None,
        weeklyScore=int(weekly_score or 0),
        weekKey=week_key,
    )


async def get_leaderboard(
    redis: Redis,
    key: str,
    scope: str,
    limit: int,
    quiz_id: str,
) -> LeaderboardResponse:
    rows = await redis.zrevrange(key, 0, limit - 1, withscores=True)
    entries: list[LeaderboardEntry] = []

    for index, (player_id, score) in enumerate(rows, start=1):
        raw = await redis.hgetall(player_key(player_id))
        if not raw:
            continue
        profile = profile_from_hash(raw)
        entries.append(
            LeaderboardEntry(
                playerId=profile.id,
                nick=profile.nick,
                avatar=profile.avatar,
                score=int(score),
                rank=index,
            ),
        )

    return LeaderboardResponse(
        quizId=quiz_id,
        scope=scope,
        weekKey=key if scope == "weekly" else None,
        entries=entries,
    )


async def get_global_leaderboard(
    redis: Redis,
    limit: int,
    quiz_id: str = DEFAULT_QUIZ_ID,
) -> LeaderboardResponse:
    await get_quiz_summary(redis, quiz_id)
    return await get_leaderboard(
        redis,
        global_leaderboard_key(quiz_id),
        "global",
        limit,
        quiz_id,
    )


async def get_weekly_leaderboard(
    redis: Redis,
    limit: int,
    quiz_id: str = DEFAULT_QUIZ_ID,
) -> LeaderboardResponse:
    await get_quiz_summary(redis, quiz_id)
    week_key = current_week_key(quiz_id=quiz_id)
    return await get_leaderboard(redis, week_key, "weekly", limit, quiz_id)


async def require_player_exists(redis: Redis, player_id: str) -> None:
    if not await redis.exists(player_key(player_id)):
        raise NotFoundError("Player not found")
