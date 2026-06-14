from typing import Annotated

from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.game.schemas import AnswerRequest, AnswerResult, QuestionOut
from app.game.service import answer_question, list_questions

router = APIRouter(tags=["game"])
RedisDep = Annotated[Redis, Depends(get_redis)]


@router.get("/questions", response_model=list[QuestionOut])
async def get_questions(redis: RedisDep) -> list[QuestionOut]:
    return await list_questions(redis)


@router.post("/game/answer", response_model=AnswerResult)
async def post_answer(
    payload: AnswerRequest,
    redis: RedisDep,
) -> AnswerResult:
    return await answer_question(redis, payload)
