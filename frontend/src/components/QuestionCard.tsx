import { CheckCircle, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AnswerResult, Question } from "../api/client";

type Props = {
  answeredQuestionIds: string[];
  questions: Question[];
  disabled: boolean;
  onAnswer: (questionId: string, answer: string) => Promise<AnswerResult>;
  onComplete: () => void;
  playerId: string | null;
  quizId: string;
  quizTitle: string;
};

function firstUnansweredIndex(questions: Question[], answeredIds: Set<string>) {
  const index = questions.findIndex((question) => !answeredIds.has(question.id));
  return index === -1 ? 0 : index;
}

export function QuestionCard({
  answeredQuestionIds,
  questions,
  disabled,
  onAnswer,
  onComplete,
  playerId,
  quizId,
  quizTitle,
}: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const answeredIds = useMemo(
    () => new Set(answeredQuestionIds),
    [answeredQuestionIds],
  );
  const answeredQuestionCount = questions.filter((item) =>
    answeredIds.has(item.id),
  ).length;

  useEffect(() => {
    if (submitting || result) {
      return;
    }

    setSelected("");
    setResult(null);
    setSubmitError(null);
    setCompleted(
      questions.length > 0 &&
        questions.every((item) => answeredIds.has(item.id)),
    );
    setQuestionIndex(firstUnansweredIndex(questions, answeredIds));
  }, [answeredIds, playerId, questions, quizId, result, submitting]);

  const question = questions[questionIndex];
  const answeredCurrentQuestion = question ? answeredIds.has(question.id) : false;
  const answeredCount =
    answeredQuestionCount +
    (result && question && !answeredIds.has(question.id) ? 1 : 0);
  const progressPercent =
    questions.length > 0
      ? Math.min(100, Math.round((answeredCount / questions.length) * 100))
      : 0;

  async function submit(answer: string) {
    if (!question || disabled || submitting || answeredCurrentQuestion || result) {
      return;
    }
    setSelected(answer);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const nextResult = await onAnswer(question.id, answer);
      setResult(nextResult);
    } catch (error) {
      setSelected("");
      setSubmitError(
        error instanceof Error ? error.message : "Nie udało się wysłać odpowiedzi",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    const remainingQuestionIndex = questions.findIndex(
      (item, index) => index > questionIndex && !answeredIds.has(item.id),
    );

    setSelected("");
    setResult(null);
    setSubmitError(null);

    if (remainingQuestionIndex === -1) {
      setCompleted(true);
      onComplete();
      return;
    }

    setQuestionIndex(remainingQuestionIndex);
  }

  if (!question) {
    return (
      <section className="panel">
        <div className="emptyState">Brak pytań</div>
      </section>
    );
  }

  if (completed) {
    return (
      <section className="panel quizPanel">
        <div className="panelHeader">
          <div>
            <span className="muted">Quiz zakończony</span>
            <h2>Wszystkie pytania zostały rozwiązane</h2>
          </div>
        </div>
        <div className="quizComplete">
          Odpowiedziano na {answeredQuestionCount}/{questions.length} pytań.
          Przechodzę do podsumowania wyniku.
        </div>
      </section>
    );
  }

  return (
    <section className="panel quizPanel">
      <div className="panelHeader">
        <div>
          <span className="muted">
            {quizTitle} - Pytanie {questionIndex + 1}/{questions.length}
          </span>
          <h2>{question.text}</h2>
        </div>
      </div>

      <div
        aria-label={`Postęp ${answeredCount} z ${questions.length}`}
        className="questionProgress"
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="answers">
        {question.options.map((option, optionIndex) => (
          <button
            className={selected === option ? "answerButton selected" : "answerButton"}
            disabled={disabled || submitting || answeredCurrentQuestion || !!result}
            key={option}
            onClick={() => submit(option)}
            type="button"
          >
            <span className="answerKey" aria-hidden="true">
              {String.fromCharCode(65 + optionIndex)}
            </span>
            {option}
            <Send className="answerSendIcon" size={15} aria-hidden="true" />
          </button>
        ))}
      </div>

      {result ? (
        <div className={result.correct ? "answerResult ok" : "answerResult bad"}>
          {result.correct ? (
            <CheckCircle size={18} aria-hidden="true" />
          ) : (
            <XCircle size={18} aria-hidden="true" />
          )}
          <div>
            <strong>{result.correct ? "Dobra odpowiedź" : "Błędna odpowiedź"}</strong>
            <span>{result.explanation}</span>
          </div>
          <button className="ghostButton" onClick={nextQuestion} type="button">
            {answeredCount >= questions.length ? "Zakończ" : "Następne"}
          </button>
        </div>
      ) : null}

      {submitError ? <div className="answerError">{submitError}</div> : null}
    </section>
  );
}
