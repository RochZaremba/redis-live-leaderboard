import { CheckCircle, PlusCircle, Save, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import type { QuizCreate } from "../api/client";

type DraftQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

type Props = {
  onCancel: () => void;
  onCreate: (payload: QuizCreate) => Promise<void>;
};

function createDraftQuestionId() {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (randomUUID) {
    return randomUUID.call(globalThis.crypto);
  }

  const randomValues = new Uint32Array(4);
  globalThis.crypto?.getRandomValues?.(randomValues);
  const randomPart = Array.from(randomValues, (value) => value.toString(36)).join(
    "-",
  );

  return `draft-${Date.now().toString(36)}-${randomPart || Math.random().toString(36).slice(2)}`;
}

function createDraftQuestion(): DraftQuestion {
  return {
    id: createDraftQuestionId(),
    text: "",
    options: ["", ""],
    correctOptionIndex: 0,
    explanation: "",
  };
}

function validationMessage(title: string, questions: DraftQuestion[]) {
  if (title.trim().length < 2) {
    return "Podaj nazwę quizu.";
  }

  for (const [index, question] of questions.entries()) {
    if (!question.text.trim()) {
      return `Pytanie ${index + 1}: wpisz treść pytania.`;
    }
    if (question.options.length < 2 || question.options.length > 4) {
      return `Pytanie ${index + 1}: dodaj od 2 do 4 opcji.`;
    }

    const cleanedOptions = question.options.map((option) => option.trim());
    if (cleanedOptions.some((option) => !option)) {
      return `Pytanie ${index + 1}: uzupełnij wszystkie opcje.`;
    }
    if (new Set(cleanedOptions).size !== cleanedOptions.length) {
      return `Pytanie ${index + 1}: opcje nie mogą się powtarzać.`;
    }
    if (!cleanedOptions[question.correctOptionIndex]) {
      return `Pytanie ${index + 1}: wybierz poprawną odpowiedź.`;
    }
  }

  return null;
}

export function QuizCreator({ onCancel, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    createDraftQuestion(),
  ]);
  const [saving, setSaving] = useState(false);

  const validation = useMemo(
    () => validationMessage(title, questions),
    [questions, title],
  );

  function updateQuestion(
    questionId: string,
    updater: (question: DraftQuestion) => DraftQuestion,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    );
  }

  function updateOption(questionId: string, optionIndex: number, value: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option, index) =>
        index === optionIndex ? value : option,
      ),
    }));
  }

  function removeOption(questionId: string, optionIndex: number) {
    updateQuestion(questionId, (question) => {
      const options = question.options.filter((_, index) => index !== optionIndex);
      return {
        ...question,
        options,
        correctOptionIndex: Math.min(question.correctOptionIndex, options.length - 1),
      };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (validation) return;

    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        questions: questions.map((question) => ({
          text: question.text.trim(),
          options: question.options.map((option) => option.trim()),
          correctOptionIndex: question.correctOptionIndex,
          explanation: question.explanation.trim(),
        })),
      });
      setTitle("");
      setDescription("");
      setQuestions([createDraftQuestion()]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel quizCreatorPanel">
      <div className="panelHeader">
        <div className="panelTitle">
          <PlusCircle size={18} aria-hidden="true" />
          <h2>Nowy quiz</h2>
        </div>
        <button className="ghostButton" onClick={onCancel} type="button">
          <X size={16} aria-hidden="true" />
          Zamknij
        </button>
      </div>

      <form className="quizCreator" onSubmit={handleSubmit}>
        <div className="quizFields">
          <label>
            <span className="muted">Nazwa quizu</span>
            <input
              maxLength={80}
              minLength={2}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Tytuł quizu"
              value={title}
            />
          </label>
          <label>
            <span className="muted">Opis</span>
            <input
              maxLength={240}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Krótki opis quizu"
              value={description}
            />
          </label>
        </div>

        <div className="questionBuilderList">
          {questions.map((question, questionIndex) => (
            <section className="questionBuilder" key={question.id}>
              <div className="questionBuilderHeader">
                <strong aria-label={`Pytanie ${questionIndex + 1}`}>
                  <span className="questionIndexBadge" aria-hidden="true">
                    {questionIndex + 1}
                  </span>
                  Pytanie
                </strong>
                {questions.length > 1 ? (
                  <button
                    className="iconTextButton dangerText"
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((item) => item.id !== question.id),
                      )
                    }
                    type="button"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Usuń
                  </button>
                ) : null}
              </div>

              <label>
                <span className="muted">Treść pytania</span>
                <input
                  maxLength={240}
                  onChange={(event) =>
                    updateQuestion(question.id, (item) => ({
                      ...item,
                      text: event.target.value,
                    }))
                  }
                  placeholder="Wpisz pytanie"
                  value={question.text}
                />
              </label>

              <div className="optionBuilderList">
                {question.options.map((option, optionIndex) => (
                  <div className="optionBuilder" key={`${question.id}-${optionIndex}`}>
                    <label className="correctOptionControl">
                      <input
                        aria-label={`Opcja ${optionIndex + 1} jest poprawna`}
                        checked={question.correctOptionIndex === optionIndex}
                        name={`correct-${question.id}`}
                        onChange={() =>
                          updateQuestion(question.id, (item) => ({
                            ...item,
                            correctOptionIndex: optionIndex,
                          }))
                        }
                        type="radio"
                      />
                      <CheckCircle size={16} aria-hidden="true" />
                    </label>
                    <input
                      maxLength={120}
                      onChange={(event) =>
                        updateOption(question.id, optionIndex, event.target.value)
                      }
                      placeholder={`Opcja ${optionIndex + 1}`}
                      value={option}
                    />
                    <button
                      className="iconButton"
                      disabled={question.options.length <= 2}
                      onClick={() => removeOption(question.id, optionIndex)}
                      title="Usuń opcję"
                      type="button"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="builderActions">
                <button
                  className="ghostButton"
                  disabled={question.options.length >= 4}
                  onClick={() =>
                    updateQuestion(question.id, (item) => ({
                      ...item,
                      options: [...item.options, ""],
                    }))
                  }
                  type="button"
                >
                  <PlusCircle size={16} aria-hidden="true" />
                  Dodaj opcję
                </button>
              </div>

              <label>
                <span className="muted">Wyjaśnienie</span>
                <input
                  maxLength={300}
                  onChange={(event) =>
                    updateQuestion(question.id, (item) => ({
                      ...item,
                      explanation: event.target.value,
                    }))
                  }
                  placeholder="Opcjonalne wyjaśnienie po odpowiedzi"
                  value={question.explanation}
                />
              </label>
            </section>
          ))}
        </div>

        <div className="quizCreatorFooter">
          <button
            className="ghostButton"
            onClick={() => setQuestions((current) => [...current, createDraftQuestion()])}
            type="button"
          >
            <PlusCircle size={16} aria-hidden="true" />
            Dodaj pytanie
          </button>
          <div className="saveQuizArea">
            {validation ? <span className="formHint">{validation}</span> : null}
            <button
              className="primaryButton"
              disabled={saving || !!validation}
              type="submit"
            >
              <Save size={16} aria-hidden="true" />
              Zapisz quiz
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
