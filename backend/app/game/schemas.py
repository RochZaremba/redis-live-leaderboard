from pydantic import BaseModel, Field

from app.players.schemas import PlayerRankResponse


class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]


class AnswerRequest(BaseModel):
    playerId: str = Field(min_length=1)
    questionId: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class AnswerResult(BaseModel):
    playerId: str
    questionId: str
    correct: bool
    pointsAwarded: int
    correctAnswer: str
    explanation: str
    rank: PlayerRankResponse

