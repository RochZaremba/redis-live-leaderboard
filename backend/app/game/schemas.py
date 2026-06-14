from pydantic import BaseModel, Field

from app.players.schemas import PlayerRankResponse


class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]


class AnswerRequest(BaseModel):
    quizId: str = Field(default="default", min_length=1)
    playerId: str = Field(min_length=1)
    questionId: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class AnswerResult(BaseModel):
    quizId: str
    playerId: str
    questionId: str
    correct: bool
    pointsAwarded: int
    correctAnswer: str
    explanation: str
    rank: PlayerRankResponse
