from uuid import uuid4

from redis.asyncio import Redis

from app.common.errors import NotFoundError
from app.players.schemas import PlayerCreate, PlayerProfile


def player_key(player_id: str) -> str:
    return f"player:{player_id}"


def game_history_key(player_id: str, quiz_id: str = "default") -> str:
    return f"player:{player_id}:quiz:{quiz_id}:games"


def answered_questions_key(player_id: str, quiz_id: str = "default") -> str:
    return f"player:{player_id}:quiz:{quiz_id}:answered_questions"


def profile_from_hash(raw: dict[str, str]) -> PlayerProfile:
    if not raw:
        raise NotFoundError("Player not found")
    return PlayerProfile(
        id=raw["id"],
        nick=raw["nick"],
        avatar=raw.get("avatar", "rocket"),
        gamesPlayed=int(raw.get("gamesPlayed", 0)),
        correctAnswers=int(raw.get("correctAnswers", 0)),
        wrongAnswers=int(raw.get("wrongAnswers", 0)),
        totalScore=int(raw.get("totalScore", 0)),
    )


async def create_player(redis: Redis, payload: PlayerCreate) -> PlayerProfile:
    player_id = str(uuid4())
    mapping = {
        "id": player_id,
        "nick": payload.nick,
        "avatar": payload.avatar,
        "gamesPlayed": 0,
        "correctAnswers": 0,
        "wrongAnswers": 0,
        "totalScore": 0,
    }
    await redis.hset(player_key(player_id), mapping=mapping)
    return PlayerProfile(**mapping)


async def get_player(redis: Redis, player_id: str) -> PlayerProfile:
    return profile_from_hash(await redis.hgetall(player_key(player_id)))


async def get_answered_question_ids(
    redis: Redis,
    player_id: str,
    quiz_id: str = "default",
) -> list[str]:
    await get_player(redis, player_id)
    return sorted(await redis.smembers(answered_questions_key(player_id, quiz_id)))
