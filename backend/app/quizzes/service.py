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
        id="q-symbol-au",
        text="Który pierwiastek chemiczny ma symbol 'Au'?",
        options=["Srebro", "Złoto", "Platyna", "Miedź"],
        correct_answer="Złoto",
        explanation=(
            "Au pochodzi od łacińskiego 'aurum' — złoto. "
            "Srebro to Ag (argentum), platyna to Pt, miedź to Cu."
        ),
    ),
    StoredQuestion(
        id="q-berlin-wall",
        text="W którym roku upadł Mur Berliński?",
        options=["1985", "1991", "1989", "1993"],
        correct_answer="1989",
        explanation=(
            "Mur Berliński upadł 9 listopada 1989 roku, kończąc podział Niemiec."
        ),
    ),
    StoredQuestion(
        id="q-starry-night",
        text="Kto namalował 'Gwiaździstą noc'?",
        options=["Pablo Picasso", "Claude Monet", "Vincent van Gogh", "Salvador Dalí"],
        correct_answer="Vincent van Gogh",
        explanation=(
            "'Gwiaździsta noc' powstała w 1889 roku, gdy Van Gogh przebywał "
            "w szpitalu psychiatrycznym w Saint-Rémy-de-Provence."
        ),
    ),
    StoredQuestion(
        id="q-australia-capital",
        text="Jaka jest stolica Australii?",
        options=["Sydney", "Melbourne", "Brisbane", "Canberra"],
        correct_answer="Canberra",
        explanation=(
            "Stolicą Australii jest Canberra, nie Sydney. "
            "Wybrano ją jako kompromis między rywalizującymi Sydney i Melbourne."
        ),
    ),
    StoredQuestion(
        id="q-human-bones",
        text="Ile kości ma dorosły człowiek?",
        options=["156", "206", "256", "300"],
        correct_answer="206",
        explanation=(
            "Dorosły człowiek ma 206 kości. Niemowlęta rodzą się z ok. 270-300 kośćmi, "
            "które zrastają się podczas wzrostu."
        ),
    ),
    StoredQuestion(
        id="q-largest-ocean",
        text="Który ocean jest największy?",
        options=["Atlantycki", "Indyjski", "Arktyczny", "Spokojny"],
        correct_answer="Spokojny",
        explanation=(
            "Ocean Spokojny (Pacyfik) zajmuje ok. 165 mln km² — "
            "więcej niż wszystkie kontynenty razem wzięte."
        ),
    ),
    StoredQuestion(
        id="q-crime-punishment",
        text="Kto napisał 'Zbrodnię i karę'?",
        options=["Lew Tołstoj", "Anton Czechow", "Fiodor Dostojewski", "Iwan Turgieniew"],
        correct_answer="Fiodor Dostojewski",
        explanation=(
            "'Zbrodnia i kara' ukazała się w 1866 roku. "
            "Dostojewski pisał ją w częściach, by spłacić długi."
        ),
    ),
    StoredQuestion(
        id="q-apollo-11",
        text="W którym roku misja Apollo 11 wylądowała na Księżycu?",
        options=["1965", "1967", "1969", "1972"],
        correct_answer="1969",
        explanation=(
            "Apollo 11 wylądował 20 lipca 1969 roku. "
            "Neil Armstrong jako pierwszy człowiek postawił stopę na Księżycu."
        ),
    ),
    StoredQuestion(
        id="q-speed-of-light",
        text="Jaka jest przybliżona prędkość światła w próżni?",
        options=["300 km/s", "3 000 km/s", "300 000 km/s", "3 000 000 km/s"],
        correct_answer="300 000 km/s",
        explanation=(
            "Prędkość światła w próżni wynosi ok. 299 792 km/s, "
            "co zaokrągla się do 300 000 km/s. Jest stałą fizyczną oznaczaną 'c'."
        ),
    ),
    StoredQuestion(
        id="q-largest-country",
        text="Które państwo ma największą powierzchnię na świecie?",
        options=["Kanada", "Chiny", "USA", "Rosja"],
        correct_answer="Rosja",
        explanation=(
            "Rosja zajmuje ok. 17,1 mln km² — ponad dwukrotnie więcej niż Kanada "
            "będąca na drugiem miejscu."
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
        title="Wiedza ogólna",
        description="10 pytań z wiedzy ogólnej — geografia, historia, nauka, kultura.",
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
