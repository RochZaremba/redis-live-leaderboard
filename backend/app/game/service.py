import json
from datetime import UTC, datetime

from redis.asyncio import Redis

from app.common.errors import ConflictError
from app.game.schemas import AnswerRequest, AnswerResult, QuestionOut
from app.leaderboard.service import add_score
from app.players.service import (
    answered_questions_key,
    game_history_key,
    get_player,
    player_key,
)
from app.quizzes.service import DEFAULT_QUIZ_ID, get_question, get_quiz_questions

POINTS_FOR_CORRECT_ANSWER = 100
GAME_HISTORY_LIMIT = 10
GAME_HISTORY_TTL_SECONDS = 30 * 24 * 60 * 60


def normalize_answer(answer: str) -> str:
    return " ".join(answer.strip().lower().split())


def is_answer_correct(correct_answer: str, answer: str) -> bool:
    return normalize_answer(answer) == normalize_answer(correct_answer)


async def list_questions(
    redis: Redis,
    quiz_id: str = DEFAULT_QUIZ_ID,
) -> list[QuestionOut]:
    return [
        QuestionOut(id=question.id, text=question.text, options=question.options)
        for question in await get_quiz_questions(redis, quiz_id)
    ]


def score_answer(correct: bool) -> int:
    return POINTS_FOR_CORRECT_ANSWER if correct else 0


async def answer_question(
    redis: Redis,
    payload: AnswerRequest,
    quiz_id: str | None = None,
) -> AnswerResult:
    quiz_id = quiz_id or payload.quizId
    await get_player(redis, payload.playerId)
    question = await get_question(redis, quiz_id, payload.questionId)

    added = await redis.sadd(
        answered_questions_key(payload.playerId, quiz_id),
        question.id,
    )
    if not added:
        raise ConflictError("Question already answered")
    await redis.expire(
        answered_questions_key(payload.playerId, quiz_id),
        GAME_HISTORY_TTL_SECONDS,
    )

    correct = is_answer_correct(question.correct_answer, payload.answer)
    points = score_answer(correct)

    history_entry = {
        "quizId": quiz_id,
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
    pipe.lpush(game_history_key(payload.playerId, quiz_id), json.dumps(history_entry))
    pipe.ltrim(game_history_key(payload.playerId, quiz_id), 0, GAME_HISTORY_LIMIT - 1)
    pipe.expire(game_history_key(payload.playerId, quiz_id), GAME_HISTORY_TTL_SECONDS)
    await pipe.execute()

    rank = await add_score(redis, payload.playerId, points, quiz_id=quiz_id)

    return AnswerResult(
        quizId=quiz_id,
        playerId=payload.playerId,
        questionId=payload.questionId,
        correct=correct,
        pointsAwarded=points,
        correctAnswer=question.correct_answer,
        explanation=question.explanation,
        rank=rank,
    )
