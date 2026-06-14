from typing import Annotated

from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.leaderboard.service import get_player_rank
from app.players.schemas import (
    PlayerAnswersResponse,
    PlayerCreate,
    PlayerProfile,
    PlayerRankResponse,
)
from app.players.service import create_player, get_answered_question_ids, get_player

router = APIRouter(prefix="/players", tags=["players"])
RedisDep = Annotated[Redis, Depends(get_redis)]


@router.post("", response_model=PlayerProfile, status_code=201)
async def create_player_endpoint(
    payload: PlayerCreate,
    redis: RedisDep,
) -> PlayerProfile:
    return await create_player(redis, payload)


@router.get("/{player_id}", response_model=PlayerProfile)
async def get_player_endpoint(
    player_id: str,
    redis: RedisDep,
) -> PlayerProfile:
    return await get_player(redis, player_id)


@router.get("/{player_id}/rank", response_model=PlayerRankResponse)
async def get_player_rank_endpoint(
    player_id: str,
    redis: RedisDep,
) -> PlayerRankResponse:
    return await get_player_rank(redis, player_id)


@router.get("/{player_id}/answers", response_model=PlayerAnswersResponse)
async def get_player_answers_endpoint(
    player_id: str,
    redis: RedisDep,
) -> PlayerAnswersResponse:
    return PlayerAnswersResponse(
        quizId="default",
        playerId=player_id,
        answeredQuestionIds=await get_answered_question_ids(redis, player_id),
    )


@router.get("/{player_id}/quizzes/{quiz_id}/rank", response_model=PlayerRankResponse)
async def get_player_quiz_rank_endpoint(
    player_id: str,
    quiz_id: str,
    redis: RedisDep,
) -> PlayerRankResponse:
    return await get_player_rank(redis, player_id, quiz_id=quiz_id)


@router.get(
    "/{player_id}/quizzes/{quiz_id}/answers",
    response_model=PlayerAnswersResponse,
)
async def get_player_quiz_answers_endpoint(
    player_id: str,
    quiz_id: str,
    redis: RedisDep,
) -> PlayerAnswersResponse:
    return PlayerAnswersResponse(
        quizId=quiz_id,
        playerId=player_id,
        answeredQuestionIds=await get_answered_question_ids(redis, player_id, quiz_id),
    )
