import pytest
from fakeredis.aioredis import FakeRedis

from app.common.errors import ConflictError
from app.game.questions import get_question, is_answer_correct, normalize_answer
from app.game.schemas import AnswerRequest
from app.game.service import POINTS_FOR_CORRECT_ANSWER, answer_question, score_answer
from app.leaderboard.service import GLOBAL_LEADERBOARD_KEY
from app.players.schemas import PlayerCreate
from app.players.service import create_player, get_player


def test_answer_normalization_ignores_case_and_extra_spaces() -> None:
    assert normalize_answer("  Sorted   Set ") == "sorted set"


def test_correct_answer_validation() -> None:
    question = get_question("q-redis-sorted-set")
    assert is_answer_correct(question, "sorted set") is True
    assert is_answer_correct(question, "hash") is False


def test_score_answer() -> None:
    assert score_answer(True) == POINTS_FOR_CORRECT_ANSWER
    assert score_answer(False) == 0


@pytest.mark.asyncio
async def test_player_cannot_change_wrong_answer_to_score_points() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="Tester", avatar="bolt"))

    first_result = await answer_question(
        redis,
        AnswerRequest(
            playerId=player.id,
            questionId="q-redis-sorted-set",
            answer="Hash",
        ),
    )

    assert first_result.correct is False
    assert first_result.pointsAwarded == 0

    with pytest.raises(ConflictError):
        await answer_question(
            redis,
            AnswerRequest(
                playerId=player.id,
                questionId="q-redis-sorted-set",
                answer="Sorted Set",
            ),
        )

    profile = await get_player(redis, player.id)
    assert profile.gamesPlayed == 1
    assert profile.correctAnswers == 0
    assert profile.wrongAnswers == 1
    assert profile.totalScore == 0
    assert await redis.zscore(GLOBAL_LEADERBOARD_KEY, player.id) == 0
    assert first_result.rank.globalRank == 1
    assert first_result.rank.globalScore == 0
    await redis.aclose()
