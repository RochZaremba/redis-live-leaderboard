import pytest
from fakeredis.aioredis import FakeRedis
from pydantic import ValidationError

from app.game.schemas import AnswerRequest
from app.game.service import answer_question
from app.leaderboard.service import get_global_leaderboard
from app.players.schemas import PlayerCreate
from app.players.service import create_player
from app.quizzes.schemas import QuestionCreate, QuizCreate
from app.quizzes.service import DEFAULT_QUIZ_ID, create_quiz, list_quizzes


def test_quiz_question_requires_two_to_four_options() -> None:
    with pytest.raises(ValidationError):
        QuestionCreate(
            text="Za mało opcji?",
            options=["Tak"],
            correctOptionIndex=0,
        )

    with pytest.raises(ValidationError):
        QuestionCreate(
            text="Za dużo opcji?",
            options=["A", "B", "C", "D", "E"],
            correctOptionIndex=0,
        )


@pytest.mark.asyncio
async def test_create_quiz_and_list_with_default_quiz() -> None:
    redis = FakeRedis(decode_responses=True)

    quiz = await create_quiz(
        redis,
        QuizCreate(
            title="Quiz testowy",
            description="Krótki quiz do testów",
            questions=[
                QuestionCreate(
                    text="Ile opcji minimum ma pytanie?",
                    options=["1", "2", "5"],
                    correctOptionIndex=1,
                    explanation="Minimum to dwie opcje.",
                ),
            ],
        ),
    )

    quizzes = await list_quizzes(redis)

    assert quiz.title == "Quiz testowy"
    assert quiz.questionCount == 1
    assert quiz.questions[0].options == ["1", "2", "5"]
    assert [item.id for item in quizzes] == [DEFAULT_QUIZ_ID, quiz.id]
    await redis.aclose()


@pytest.mark.asyncio
async def test_custom_quiz_score_does_not_update_default_leaderboard() -> None:
    redis = FakeRedis(decode_responses=True)
    player = await create_player(redis, PlayerCreate(nick="Tester", avatar="bolt"))
    quiz = await create_quiz(
        redis,
        QuizCreate(
            title="Osobny ranking",
            questions=[
                QuestionCreate(
                    text="Poprawna odpowiedź?",
                    options=["Nie", "Tak"],
                    correctOptionIndex=1,
                ),
            ],
        ),
    )

    await answer_question(
        redis,
        AnswerRequest(
            quizId=quiz.id,
            playerId=player.id,
            questionId=quiz.questions[0].id,
            answer="Tak",
        ),
    )

    default_leaderboard = await get_global_leaderboard(redis, limit=10)
    custom_leaderboard = await get_global_leaderboard(
        redis,
        limit=10,
        quiz_id=quiz.id,
    )

    assert default_leaderboard.entries == []
    assert custom_leaderboard.entries[0].playerId == player.id
    assert custom_leaderboard.entries[0].score == 100
    await redis.aclose()
