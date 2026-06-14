import json
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from redis.asyncio import Redis

from app.common.errors import NotFoundError
from app.quizzes.schemas import (
    QuestionCreate,
    QuestionOut,
    QuizCreate,
    QuizDetail,
    QuizSummary,
)

DEFAULT_QUIZ_ID = "default"
QUIZZES_INDEX_KEY = "quizzes:index"


@dataclass(frozen=True)
class StoredQuestion:
    id: str
    text: str
    options: list[str]
    correct_answer: str
    explanation: str


DEFAULT_QUESTIONS: list[StoredQuestion] = [
    StoredQuestion(
        id="q-redis-sorted-set",
        text="Która struktura Redis najlepiej pasuje do rankingu punktowego?",
        options=["Hash", "Sorted Set", "List", "Stream"],
        correct_answer="Sorted Set",
        explanation=(
            "Sorted Set przechowuje elementy z wynikiem i pozwala szybko "
            "pobrać top N."
        ),
    ),
    StoredQuestion(
        id="q-fastapi-ws",
        text=(
            "Który protokół najlepiej nadaje się do live aktualizacji rankingu "
            "w przeglądarce?"
        ),
        options=["SMTP", "WebSocket", "FTP", "DNS"],
        correct_answer="WebSocket",
        explanation=(
            "WebSocket utrzymuje stałe połączenie i pozwala serwerowi "
            "wypychać eventy."
        ),
    ),
    StoredQuestion(
        id="q-ttl",
        text="Która komenda Redis pokazuje czas życia klucza?",
        options=["TTL", "ZCARD", "HGETALL", "PING"],
        correct_answer="TTL",
        explanation="TTL zwraca liczbę sekund do wygaśnięcia klucza.",
    ),
    StoredQuestion(
        id="q-hash-profile",
        text="Która komenda pobiera wszystkie pola profilu zapisanego jako Hash?",
        options=["HGETALL", "ZRANGE", "PUBLISH", "EXPIRE"],
        correct_answer="HGETALL",
        explanation="HGETALL zwraca komplet pól i wartości zapisanych w Hashu.",
    ),
    StoredQuestion(
        id="q-pubsub",
        text="Która para komend Redis odpowiada za prosty Pub/Sub?",
        options=["SET/GET", "LPUSH/LPOP", "PUBLISH/SUBSCRIBE", "ZADD/ZRANK"],
        correct_answer="PUBLISH/SUBSCRIBE",
        explanation=(
            "PUBLISH wysyła wiadomość na kanał, a SUBSCRIBE pozwala ją odebrać."
        ),
    ),
]


def quiz_key(quiz_id: str) -> str:
    return f"quiz:{quiz_id}"


def quiz_questions_key(quiz_id: str) -> str:
    return f"quiz:{quiz_id}:questions"


def default_quiz_summary() -> QuizSummary:
    return QuizSummary(
        id=DEFAULT_QUIZ_ID,
        title="Domyślny quiz Redis",
        description="Pytania o Redis, FastAPI, WebSockety i ranking live.",
        questionCount=len(DEFAULT_QUESTIONS),
        createdAt="2026-01-01T00:00:00+00:00",
        isDefault=True,
    )


def question_to_out(question: StoredQuestion) -> QuestionOut:
    return QuestionOut(id=question.id, text=question.text, options=question.options)


def question_to_json(question: QuestionCreate) -> str:
    question_id = f"q-{uuid4()}"
    correct_answer = question.options[question.correctOptionIndex]
    return json.dumps(
        {
            "id": question_id,
            "text": question.text.strip(),
            "options": question.options,
            "correctAnswer": correct_answer,
            "explanation": question.explanation.strip()
            or f"Poprawna odpowiedź: {correct_answer}.",
        }
    )


def question_from_json(raw: str) -> StoredQuestion:
    data = json.loads(raw)
    return StoredQuestion(
        id=data["id"],
        text=data["text"],
        options=list(data["options"]),
        correct_answer=data["correctAnswer"],
        explanation=data.get("explanation", ""),
    )


async def list_quizzes(redis: Redis) -> list[QuizSummary]:
    quiz_ids = await redis.zrange(QUIZZES_INDEX_KEY, 0, -1)
    quizzes = [default_quiz_summary()]

    for quiz_id in quiz_ids:
        raw = await redis.hgetall(quiz_key(quiz_id))
        if raw:
            quizzes.append(quiz_summary_from_hash(raw))

    return quizzes


def quiz_summary_from_hash(raw: dict[str, str]) -> QuizSummary:
    return QuizSummary(
        id=raw["id"],
        title=raw["title"],
        description=raw.get("description", ""),
        questionCount=int(raw.get("questionCount", 0)),
        createdAt=raw["createdAt"],
        isDefault=False,
    )


async def create_quiz(redis: Redis, payload: QuizCreate) -> QuizDetail:
    quiz_id = str(uuid4())
    created_at = datetime.now(UTC).isoformat()
    metadata = {
        "id": quiz_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "questionCount": len(payload.questions),
        "createdAt": created_at,
    }
    question_rows = [question_to_json(question) for question in payload.questions]

    pipe = redis.pipeline()
    pipe.hset(quiz_key(quiz_id), mapping=metadata)
    pipe.rpush(quiz_questions_key(quiz_id), *question_rows)
    pipe.zadd(QUIZZES_INDEX_KEY, {quiz_id: datetime.now(UTC).timestamp()})
    await pipe.execute()

    return await get_quiz(redis, quiz_id)


async def get_quiz_summary(redis: Redis, quiz_id: str) -> QuizSummary:
    if quiz_id == DEFAULT_QUIZ_ID:
        return default_quiz_summary()
    raw = await redis.hgetall(quiz_key(quiz_id))
    if not raw:
        raise NotFoundError("Quiz not found")
    return quiz_summary_from_hash(raw)


async def get_quiz_questions(redis: Redis, quiz_id: str) -> list[StoredQuestion]:
    if quiz_id == DEFAULT_QUIZ_ID:
        return DEFAULT_QUESTIONS

    await get_quiz_summary(redis, quiz_id)
    rows = await redis.lrange(quiz_questions_key(quiz_id), 0, -1)
    return [question_from_json(row) for row in rows]


async def get_quiz(redis: Redis, quiz_id: str) -> QuizDetail:
    summary = await get_quiz_summary(redis, quiz_id)
    questions = await get_quiz_questions(redis, quiz_id)
    return QuizDetail(
        **summary.model_dump(),
        questions=[question_to_out(question) for question in questions],
    )


async def get_question(redis: Redis, quiz_id: str, question_id: str) -> StoredQuestion:
    for question in await get_quiz_questions(redis, quiz_id):
        if question.id == question_id:
            return question
    raise NotFoundError("Question not found")
