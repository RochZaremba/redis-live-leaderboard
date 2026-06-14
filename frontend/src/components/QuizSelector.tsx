import { ListChecks, Play, PlusCircle, Trophy } from "lucide-react";

import type { LeaderboardResponse, PlayerRank, QuizSummary } from "../api/client";
import { Leaderboard } from "./Leaderboard";

export type QuizProgress = {
  answeredCount: number;
  rank: PlayerRank | null;
};

type Props = {
  previewLeaderboard: LeaderboardResponse | null;
  previewQuizId: string | null;
  progressByQuizId: Record<string, QuizProgress>;
  quizzes: QuizSummary[];
  onCreateClick: () => void;
  onOpenResult: (quizId: string) => void;
  onPreview: (quizId: string) => void;
  onStart: (quizId: string) => void;
};

export function QuizSelector({
  previewLeaderboard,
  previewQuizId,
  progressByQuizId,
  quizzes,
  onCreateClick,
  onOpenResult,
  onPreview,
  onStart,
}: Props) {
  const previewQuiz = quizzes.find((quiz) => quiz.id === previewQuizId);

  return (
    <section className="pageStack">
      <div className="panel quizSelectorPanel">
        <div className="panelHeader">
          <div className="panelTitle">
            <ListChecks size={18} aria-hidden="true" />
            <h2>Wybierz quiz</h2>
          </div>
          <button className="primaryButton" onClick={onCreateClick} type="button">
            <PlusCircle size={16} aria-hidden="true" />
            Nowy quiz
          </button>
        </div>

        <div className="quizList">
          {quizzes.length ? (
            quizzes.map((quiz) => {
              const progress = progressByQuizId[quiz.id];
              const answeredCount = progress?.answeredCount ?? 0;
              const score = progress?.rank?.globalScore ?? 0;
              const rank = progress?.rank?.globalRank;
              const completed = answeredCount >= quiz.questionCount;
              const selected = previewQuizId === quiz.id;
              const progressPercent =
                quiz.questionCount > 0
                  ? Math.min(
                      100,
                      Math.round((answeredCount / quiz.questionCount) * 100),
                    )
                  : 0;

              return (
                <article
                  className={[
                    "quizRow",
                    selected ? "selectedQuiz" : "",
                    completed ? "completedQuiz" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={quiz.id}
                >
                  <button
                    aria-pressed={selected}
                    className="quizPreviewButton"
                    onClick={() => onPreview(quiz.id)}
                    type="button"
                  >
                    <div className="quizCardMain">
                      <div>
                        <strong>{quiz.title}</strong>
                        {quiz.description ? <small>{quiz.description}</small> : null}
                      </div>
                      <span className="quizMeta">
                        {quiz.isDefault ? <em>default</em> : null}
                        {completed ? (
                          <em className="successPill">ukończony</em>
                        ) : null}
                        {quiz.questionCount} pytań
                      </span>
                    </div>

                    <div
                      aria-label={`Postęp ${answeredCount} z ${quiz.questionCount}`}
                      className="progressTrack"
                    >
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="quizScoreGrid">
                      <div>
                        <span className="muted">Twój wynik</span>
                        <strong>{score} pkt</strong>
                      </div>
                      <div>
                        <span className="muted">Miejsce</span>
                        <strong>{rank ? `#${rank}` : "-"}</strong>
                      </div>
                      <div>
                        <span className="muted">Postęp</span>
                        <strong>
                          {answeredCount}/{quiz.questionCount}
                        </strong>
                      </div>
                    </div>
                  </button>

                  <button
                    className={completed ? "ghostButton" : "primaryButton"}
                    onClick={() =>
                      completed ? onOpenResult(quiz.id) : onStart(quiz.id)
                    }
                    type="button"
                  >
                    {completed ? (
                      <Trophy size={16} aria-hidden="true" />
                    ) : (
                      <Play size={16} aria-hidden="true" />
                    )}
                    {completed
                      ? "Zobacz wynik"
                      : answeredCount > 0
                        ? "Kontynuuj"
                        : "Rozpocznij"}
                  </button>
                </article>
              );
            })
          ) : (
            <div className="emptyState quizEmptyState">Brak quizów</div>
          )}
        </div>
      </div>

      {previewQuiz ? (
        <Leaderboard
          leaderboard={previewLeaderboard}
          title={`Tabela wyników: ${previewQuiz.title}`}
        />
      ) : null}
    </section>
  );
}
