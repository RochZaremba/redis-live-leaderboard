from pydantic import BaseModel, Field, field_validator, model_validator


class QuestionCreate(BaseModel):
    text: str = Field(min_length=1, max_length=240)
    options: list[str] = Field(min_length=2, max_length=4)
    correctOptionIndex: int = Field(ge=0, le=3)
    explanation: str = Field(default="", max_length=300)

    @field_validator("options")
    @classmethod
    def validate_options(cls, options: list[str]) -> list[str]:
        cleaned = [option.strip() for option in options]
        if any(not option for option in cleaned):
            raise ValueError("Options cannot be empty")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Options must be unique")
        return cleaned

    @model_validator(mode="after")
    def validate_correct_option(self) -> "QuestionCreate":
        if self.correctOptionIndex >= len(self.options):
            raise ValueError("Correct option must point to an existing option")
        return self


class QuizCreate(BaseModel):
    title: str = Field(min_length=2, max_length=80)
    description: str = Field(default="", max_length=240)
    questions: list[QuestionCreate] = Field(min_length=1)


class QuizSummary(BaseModel):
    id: str
    title: str
    description: str
    questionCount: int
    createdAt: str
    isDefault: bool = False


class QuizDetail(QuizSummary):
    questions: list["QuestionOut"]


class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]
