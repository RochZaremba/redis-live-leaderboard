import json
from datetime import UTC, datetime

from redis.asyncio import Redis

from app.common.errors import ConflictError
from app.game.questions import QUESTIONS, get_question, is_answer_correct
from app.game.schemas import AnswerRequest, AnswerResult, QuestionOut
from app.leaderboard.service import add_score, get_player_rank
from app.players.service import (
    answered_questions_key,
    game_history_key,
    get_player,
    player_key,
)

POINTS_FOR_CORRECT_ANSWER = 100
GAME_HISTORY_LIMIT = 10
GAME_HISTORY_TTL_SECONDS = 30 * 24 * 60 * 60


def list_questions() -> list[QuestionOut]:
    return [
        QuestionOut(id=question.id, text=question.text, options=question.options)
        for question in QUESTIONS
    ]


def score_answer(correct: bool) -> int:
    return POINTS_FOR_CORRECT_ANSWER if correct else 0


async def answer_question(redis: Redis, payload: AnswerRequest) -> AnswerResult:
    await get_player(redis, payload.playerId)
    question = get_question(payload.questionId)

    added = await redis.sadd(answered_questions_key(payload.playerId), question.id)
    if not added:
        raise ConflictError("Question already answered")
    await redis.expire(
        answered_questions_key(payload.playerId),
        GAME_HISTORY_TTL_SECONDS,
    )

    correct = is_answer_correct(question, payload.answer)
    points = score_answer(correct)

    history_entry = {
        "questionId": question.id,
        "answer": payload.answer,
        "correct": correct,
        "pointsAwarded": points,
        "playedAt": datetime.now(UTC).isoformat(),
    }

    pipe = redis.pipeline()
    pipe.hincrby(player_key(payload.playerId), "gamesPlayed", 1)
    if correct:
        pipe.hincrby(player_key(payload.playerId), "correctAnswers", 1)
        pipe.hincrby(player_key(payload.playerId), "totalScore", points)
    else:
        pipe.hincrby(player_key(payload.playerId), "wrongAnswers", 1)
    pipe.lpush(game_history_key(payload.playerId), json.dumps(history_entry))
    pipe.ltrim(game_history_key(payload.playerId), 0, GAME_HISTORY_LIMIT - 1)
    pipe.expire(game_history_key(payload.playerId), GAME_HISTORY_TTL_SECONDS)
    await pipe.execute()

    rank = (
        await add_score(redis, payload.playerId, points)
        if points > 0
        else await get_player_rank(redis, payload.playerId)
    )

    return AnswerResult(
        playerId=payload.playerId,
        questionId=payload.questionId,
        correct=correct,
        pointsAwarded=points,
        correctAnswer=question.correct_answer,
        explanation=question.explanation,
        rank=rank,
    )
