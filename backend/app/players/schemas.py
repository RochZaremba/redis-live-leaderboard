from pydantic import BaseModel, Field


class PlayerCreate(BaseModel):
    nick: str = Field(min_length=2, max_length=32)
    avatar: str = Field(default="rocket", min_length=1, max_length=64)


class PlayerProfile(BaseModel):
    id: str
    nick: str
    avatar: str
    gamesPlayed: int
    correctAnswers: int
    wrongAnswers: int
    totalScore: int


class PlayerRankResponse(BaseModel):
    quizId: str = "default"
    playerId: str
    globalRank: int | None
    globalScore: int
    weeklyRank: int | None
    weeklyScore: int
    weekKey: str


class PlayerAnswersResponse(BaseModel):
    quizId: str = "default"
    playerId: str
    answeredQuestionIds: list[str]
