from app.game.questions import get_question, is_answer_correct, normalize_answer
from app.game.service import POINTS_FOR_CORRECT_ANSWER, score_answer


def test_answer_normalization_ignores_case_and_extra_spaces() -> None:
    assert normalize_answer("  Sorted   Set ") == "sorted set"


def test_correct_answer_validation() -> None:
    question = get_question("q-redis-sorted-set")
    assert is_answer_correct(question, "sorted set") is True
    assert is_answer_correct(question, "hash") is False


def test_score_answer() -> None:
    assert score_answer(True) == POINTS_FOR_CORRECT_ANSWER
    assert score_answer(False) == 0

