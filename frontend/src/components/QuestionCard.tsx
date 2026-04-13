import { CheckCircle, Send, XCircle } from "lucide-react";
import { useState } from "react";

import type { AnswerResult, Question } from "../api/client";

type Props = {
  questions: Question[];
  disabled: boolean;
  onAnswer: (questionId: string, answer: string) => Promise<AnswerResult>;
};

export function QuestionCard({ questions, disabled, onAnswer }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const question = questions[questionIndex];

  async function submit(answer: string) {
    if (!question || disabled) return;
    setSelected(answer);
    setSubmitting(true);
    try {
      const nextResult = await onAnswer(question.id, answer);
      setResult(nextResult);
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    setSelected("");
    setResult(null);
    setQuestionIndex((current) => (current + 1) % questions.length);
  }

  if (!question) {
    return (
      <section className="panel">
        <div className="emptyState">Brak pytań</div>
      </section>
    );
  }

  return (
    <section className="panel quizPanel">
      <div className="panelHeader">
        <div>
          <span className="muted">Pytanie {questionIndex + 1}/{questions.length}</span>
          <h2>{question.text}</h2>
        </div>
      </div>

      <div className="answers">
        {question.options.map((option) => (
          <button
            className={selected === option ? "answerButton selected" : "answerButton"}
            disabled={disabled || submitting}
            key={option}
            onClick={() => submit(option)}
            type="button"
          >
            <Send size={15} aria-hidden="true" />
            {option}
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
            <strong>
              {result.correct ? `+${result.pointsAwarded} pkt` : "0 pkt"}
            </strong>
            <span>{result.explanation}</span>
          </div>
          <button className="ghostButton" onClick={nextQuestion} type="button">
            Następne
          </button>
        </div>
      ) : null}
    </section>
  );
}

