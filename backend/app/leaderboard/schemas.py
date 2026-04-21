from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    playerId: str
    nick: str
    avatar: str
    score: int
    rank: int


class LeaderboardResponse(BaseModel):
    scope: str
    weekKey: str | None = None
    entries: list[LeaderboardEntry]

