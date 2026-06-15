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
        id="q-symbol-au",
        text="Który pierwiastek chemiczny ma symbol 'Au'?",
        options=["Srebro", "Złoto", "Platyna", "Miedź"],
        correct_answer="Złoto",
        explanation=(
            "Au pochodzi od łacińskiego 'aurum' — złoto. "
            "Srebro to Ag (argentum), platyna to Pt, miedź to Cu."
        ),
    ),
    Question(
        id="q-berlin-wall",
        text="W którym roku upadł Mur Berliński?",
        options=["1985", "1991", "1989", "1993"],
        correct_answer="1989",
        explanation=(
            "Mur Berliński upadł 9 listopada 1989 roku, kończąc podział Niemiec."
        ),
    ),
    Question(
        id="q-starry-night",
        text="Kto namalował 'Gwiaździstą noc'?",
        options=["Pablo Picasso", "Claude Monet", "Vincent van Gogh", "Salvador Dalí"],
        correct_answer="Vincent van Gogh",
        explanation=(
            "'Gwiaździsta noc' powstała w 1889 roku, gdy Van Gogh przebywał "
            "w szpitalu psychiatrycznym w Saint-Rémy-de-Provence."
        ),
    ),
    Question(
        id="q-australia-capital",
        text="Jaka jest stolica Australii?",
        options=["Sydney", "Melbourne", "Brisbane", "Canberra"],
        correct_answer="Canberra",
        explanation=(
            "Stolicą Australii jest Canberra, nie Sydney. "
            "Wybrano ją jako kompromis między rywalizującymi Sydney i Melbourne."
        ),
    ),
    Question(
        id="q-human-bones",
        text="Ile kości ma dorosły człowiek?",
        options=["156", "206", "256", "300"],
        correct_answer="206",
        explanation=(
            "Dorosły człowiek ma 206 kości. Niemowlęta rodzą się z ok. 270-300 kośćmi, "
            "które zrastają się podczas wzrostu."
        ),
    ),
    Question(
        id="q-largest-ocean",
        text="Który ocean jest największy?",
        options=["Atlantycki", "Indyjski", "Arktyczny", "Spokojny"],
        correct_answer="Spokojny",
        explanation=(
            "Ocean Spokojny (Pacyfik) zajmuje ok. 165 mln km² — "
            "więcej niż wszystkie kontynenty razem wzięte."
        ),
    ),
    Question(
        id="q-crime-punishment",
        text="Kto napisał 'Zbrodnię i karę'?",
        options=["Lew Tołstoj", "Anton Czechow", "Fiodor Dostojewski", "Iwan Turgieniew"],
        correct_answer="Fiodor Dostojewski",
        explanation=(
            "'Zbrodnia i kara' ukazała się w 1866 roku. "
            "Dostojewski pisał ją w częściach, by spłacić długi."
        ),
    ),
    Question(
        id="q-apollo-11",
        text="W którym roku misja Apollo 11 wylądowała na Księżycu?",
        options=["1965", "1967", "1969", "1972"],
        correct_answer="1969",
        explanation=(
            "Apollo 11 wylądował 20 lipca 1969 roku. "
            "Neil Armstrong jako pierwszy człowiek postawił stopę na Księżycu."
        ),
    ),
    Question(
        id="q-speed-of-light",
        text="Jaka jest przybliżona prędkość światła w próżni?",
        options=["300 km/s", "3 000 km/s", "300 000 km/s", "3 000 000 km/s"],
        correct_answer="300 000 km/s",
        explanation=(
            "Prędkość światła w próżni wynosi ok. 299 792 km/s, "
            "co zaokrągla się do 300 000 km/s. Jest stałą fizyczną oznaczaną 'c'."
        ),
    ),
    Question(
        id="q-largest-country",
        text="Które państwo ma największą powierzchnię na świecie?",
        options=["Kanada", "Chiny", "USA", "Rosja"],
        correct_answer="Rosja",
        explanation=(
            "Rosja zajmuje ok. 17,1 mln km² — ponad dwukrotnie więcej niż Kanada "
            "będąca na drugim miejscu."
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
