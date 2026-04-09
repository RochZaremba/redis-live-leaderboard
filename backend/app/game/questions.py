from dataclasses import dataclass

from app.common.errors import NotFoundError


@dataclass(frozen=True)
class Question:
    id: str
    text: str
    options: list[str]
    correct_answer: str
    explanation: str


QUESTIONS: list[Question] = [
    Question(
        id="q-redis-sorted-set",
        text="Która struktura Redis najlepiej pasuje do rankingu punktowego?",
        options=["Hash", "Sorted Set", "List", "Stream"],
        correct_answer="Sorted Set",
        explanation=(
            "Sorted Set przechowuje elementy z wynikiem i pozwala szybko "
            "pobrać top N."
        ),
    ),
    Question(
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
    Question(
        id="q-ttl",
        text="Która komenda Redis pokazuje czas życia klucza?",
        options=["TTL", "ZCARD", "HGETALL", "PING"],
        correct_answer="TTL",
        explanation="TTL zwraca liczbę sekund do wygaśnięcia klucza.",
    ),
    Question(
        id="q-hash-profile",
        text="Która komenda pobiera wszystkie pola profilu zapisanego jako Hash?",
        options=["HGETALL", "ZRANGE", "PUBLISH", "EXPIRE"],
        correct_answer="HGETALL",
        explanation="HGETALL zwraca komplet pól i wartości zapisanych w Hashu.",
    ),
    Question(
        id="q-pubsub",
        text="Która para komend Redis odpowiada za prosty Pub/Sub?",
        options=["SET/GET", "LPUSH/LPOP", "PUBLISH/SUBSCRIBE", "ZADD/ZRANK"],
        correct_answer="PUBLISH/SUBSCRIBE",
        explanation=(
            "PUBLISH wysyła wiadomość na kanał, a SUBSCRIBE pozwala ją odebrać."
        ),
    ),
]


def normalize_answer(answer: str) -> str:
    return " ".join(answer.strip().lower().split())


def get_question(question_id: str) -> Question:
    for question in QUESTIONS:
        if question.id == question_id:
            return question
    raise NotFoundError("Question not found")


def is_answer_correct(question: Question, answer: str) -> bool:
    return normalize_answer(answer) == normalize_answer(question.correct_answer)
