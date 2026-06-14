from typing import Annotated

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.game.schemas import AnswerRequest, AnswerResult
from app.game.service import answer_question
from app.leaderboard.schemas import LeaderboardResponse
from app.leaderboard.service import get_global_leaderboard, get_weekly_leaderboard
from app.quizzes.schemas import QuestionOut, QuizCreate, QuizDetail, QuizSummary
from app.quizzes.service import create_quiz, get_quiz, get_quiz_questions, list_quizzes

router = APIRouter(prefix="/quizzes", tags=["quizzes"])
RedisDep = Annotated[Redis, Depends(get_redis)]
LimitQuery = Annotated[int, Query(ge=1, le=100)]


@router.get("", response_model=list[QuizSummary])
async def get_quizzes(redis: RedisDep) -> list[QuizSummary]:
    return await list_quizzes(redis)


@router.post("", response_model=QuizDetail, status_code=201)
async def create_quiz_endpoint(
    payload: QuizCreate,
    redis: RedisDep,
) -> QuizDetail:
    return await create_quiz(redis, payload)


@router.get("/{quiz_id}", response_model=QuizDetail)
async def get_quiz_endpoint(quiz_id: str, redis: RedisDep) -> QuizDetail:
    return await get_quiz(redis, quiz_id)


@router.get("/{quiz_id}/questions", response_model=list[QuestionOut])
async def get_quiz_questions_endpoint(
    quiz_id: str,
    redis: RedisDep,
) -> list[QuestionOut]:
    return [
        QuestionOut(id=question.id, text=question.text, options=question.options)
        for question in await get_quiz_questions(redis, quiz_id)
    ]


@router.post("/{quiz_id}/answer", response_model=AnswerResult)
async def answer_quiz_question(
    quiz_id: str,
    payload: AnswerRequest,
    redis: RedisDep,
) -> AnswerResult:
    return await answer_question(redis, payload, quiz_id=quiz_id)


@router.get("/{quiz_id}/leaderboard/global", response_model=LeaderboardResponse)
async def get_quiz_global_leaderboard(
    quiz_id: str,
    redis: RedisDep,
    limit: LimitQuery = 10,
) -> LeaderboardResponse:
    return await get_global_leaderboard(redis, limit, quiz_id=quiz_id)


@router.get("/{quiz_id}/leaderboard/weekly", response_model=LeaderboardResponse)
async def get_quiz_weekly_leaderboard(
    quiz_id: str,
    redis: RedisDep,
    limit: LimitQuery = 10,
) -> LeaderboardResponse:
    return await get_weekly_leaderboard(redis, limit, quiz_id=quiz_id)
