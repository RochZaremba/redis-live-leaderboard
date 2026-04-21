from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Quiz Leaderboard"
    api_prefix: str = "/api"
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    cors_origins_raw: str = Field(
        default="http://localhost:5173",
        alias="CORS_ORIGINS",
    )
    weekly_leaderboard_ttl_seconds: int = Field(
        default=14 * 24 * 60 * 60,
        alias="WEEKLY_LEADERBOARD_TTL_SECONDS",
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()

