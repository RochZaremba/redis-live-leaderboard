import {
  ArrowLeft,
  Database,
  ExternalLink,
  Trophy,
  User,
  UserPlus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AnswerResult,
  LeaderboardResponse,
  PlayerProfile,
  PlayerRank,
  QuizCreate,
  QuizSummary,
  Question,
  createPlayer,
  createQuiz,
  getGlobalLeaderboard,
  getPlayer,
  getPlayerAnswers,
  getPlayerRank,
  getQuestions,
  getQuizzes,
  getWeeklyLeaderboard,
  seedDemo,
  submitAnswer,
} from "../api/client";
import { AccountSetup } from "../components/AccountSetup";
import { Leaderboard } from "../components/Leaderboard";
import { QuestionCard } from "../components/QuestionCard";
import { QuizCreator } from "../components/QuizCreator";
import { QuizProgress, QuizSelector } from "../components/QuizSelector";
import {
  LeaderboardSocketEvent,
  connectLeaderboardSocket,
} from "../socket/leaderboardSocket";

const storedPlayerKey = "quiz-leaderboard-player-id";
const defaultQuizId = "default";

type Page = "profile" | "quizzes" | "create" | "play" | "result";

export function Dashboard() {
  const previewRequestRef = useRef(0);
  const [page, setPage] = useState<Page>("profile");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [progressByQuizId, setProgressByQuizId] = useState<
    Record<string, QuizProgress>
  >({});
  const [selectedQuizId, setSelectedQuizId] = useState(defaultQuizId);
  const [previewQuizId, setPreviewQuizId] = useState<string | null>(null);
  const [previewLeaderboard, setPreviewLeaderboard] =
    useState<LeaderboardResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] =
    useState<LeaderboardResponse | null>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] =
    useState<LeaderboardResponse | null>(null);
  const [resultRank, setResultRank] = useState<PlayerRank | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveStateRef = useRef({
    page,
    player,
    previewQuizId,
    selectedQuizId,
  });

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  const refreshProgress = useCallback(
    async (nextPlayer: PlayerProfile | null, nextQuizzes: QuizSummary[]) => {
      if (!nextPlayer) {
        setProgressByQuizId({});
        return;
      }

      const rows = await Promise.all(
        nextQuizzes.map(async (quiz) => {
          const [rank, answers] = await Promise.all([
            getPlayerRank(nextPlayer.id, quiz.id),
            getPlayerAnswers(nextPlayer.id, quiz.id),
          ]);
          return [
            quiz.id,
            {
              answeredCount: answers.answeredQuestionIds.length,
              rank,
            },
          ] as const;
        }),
      );

      setProgressByQuizId(Object.fromEntries(rows));
    },
    [],
  );

  const refreshQuizzes = useCallback(
    async (nextPlayer: PlayerProfile | null) => {
      const items = await getQuizzes();
      setQuizzes(items);
      await refreshProgress(nextPlayer, items);
      return items;
    },
    [refreshProgress],
  );

  const loadQuizState = useCallback(
    async (quizId: string, nextPlayer: PlayerProfile | null = player) => {
      const [quizQuestions, globalBoard, weeklyBoard] = await Promise.all([
        getQuestions(quizId),
        getGlobalLeaderboard(10, quizId),
        getWeeklyLeaderboard(10, quizId),
      ]);
      setQuestions(quizQuestions);
      setGlobalLeaderboard(globalBoard);
      setWeeklyLeaderboard(weeklyBoard);

      if (!nextPlayer) {
        setAnsweredQuestionIds([]);
        setResultRank(null);
        return {
          answeredQuestionIds: [],
          questions: quizQuestions,
          rank: null,
        };
      }

      const [answers, rank] = await Promise.all([
        getPlayerAnswers(nextPlayer.id, quizId),
        getPlayerRank(nextPlayer.id, quizId),
      ]);
      setAnsweredQuestionIds(answers.answeredQuestionIds);
      setResultRank(rank);
      return {
        answeredQuestionIds: answers.answeredQuestionIds,
        questions: quizQuestions,
        rank,
      };
    },
    [player],
  );

  const previewQuizLeaderboard = useCallback((quizId: string) => {
    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setPreviewQuizId(quizId);
    setPreviewLeaderboard(null);
    getGlobalLeaderboard(10, quizId)
      .then((leaderboard) => {
        if (previewRequestRef.current === requestId) {
          setPreviewLeaderboard(leaderboard);
        }
      })
      .catch((err: Error) => {
        if (previewRequestRef.current === requestId) {
          setError(err.message);
        }
      });
  }, []);

  const liveHandlersRef = useRef({
    loadQuizState,
    previewQuizLeaderboard,
    refreshQuizzes,
  });

  useEffect(() => {
    liveStateRef.current = {
      page,
      player,
      previewQuizId,
      selectedQuizId,
    };
  }, [page, player, previewQuizId, selectedQuizId]);

  useEffect(() => {
    liveHandlersRef.current = {
      loadQuizState,
      previewQuizLeaderboard,
      refreshQuizzes,
    };
  }, [loadQuizState, previewQuizLeaderboard, refreshQuizzes]);

  useEffect(() => {
    async function boot() {
      try {
        const storedPlayerId = localStorage.getItem(storedPlayerKey);
        const profile = storedPlayerId ? await getPlayer(storedPlayerId) : null;
        setPlayer(profile);
        const items = await refreshQuizzes(profile);
        setSelectedQuizId(items[0]?.id ?? defaultQuizId);
        setPage(profile ? "quizzes" : "profile");
      } catch {
        localStorage.removeItem(storedPlayerKey);
        setPlayer(null);
        setPage("profile");
        refreshQuizzes(null).catch((err: Error) => setError(err.message));
      }
    }

    boot().catch((err: Error) => setError(err.message));
  }, [refreshQuizzes]);

  useEffect(() => {
    let reconnectId: number | null = null;
    let socket: WebSocket | null = null;
    let stopped = false;

    function clearReconnect() {
      if (reconnectId !== null) {
        window.clearTimeout(reconnectId);
        reconnectId = null;
      }
    }

    function scheduleReconnect() {
      if (stopped || reconnectId !== null) return;

      reconnectId = window.setTimeout(() => {
        reconnectId = null;
        connect();
      }, 1000);
    }

    function handleMessage(event: LeaderboardSocketEvent) {
      if (event.type === "connection.ready") return;

      const { page, player, previewQuizId, selectedQuizId } =
        liveStateRef.current;
      const { loadQuizState, previewQuizLeaderboard, refreshQuizzes } =
        liveHandlersRef.current;

      if (player) {
        refreshQuizzes(player).catch((err: Error) => setError(err.message));
      }
      if (event.quizId && event.quizId === previewQuizId && page === "quizzes") {
        previewQuizLeaderboard(event.quizId);
      }
      if (event.quizId === selectedQuizId && page === "result") {
        loadQuizState(selectedQuizId).catch((err: Error) =>
          setError(err.message),
        );
      }
    }

    function handleStatusChange(connected: boolean) {
      setSocketConnected(connected);
      if (connected) {
        clearReconnect();
        return;
      }

      scheduleReconnect();
    }

    function connect() {
      socket = connectLeaderboardSocket(handleMessage, handleStatusChange);
    }

    connect();

    return () => {
      stopped = true;
      clearReconnect();
      socket?.close();
    };
  }, []);

  async function handleCreatePlayer(nick: string, avatar: string) {
    const profile = await createPlayer(nick, avatar);
    localStorage.setItem(storedPlayerKey, profile.id);
    setPlayer(profile);
    await refreshQuizzes(profile);
    setPage("quizzes");
  }

  async function handleCreateQuiz(payload: QuizCreate) {
    const quiz = await createQuiz(payload);
    const summary: QuizSummary = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.questionCount,
      createdAt: quiz.createdAt,
      isDefault: quiz.isDefault,
    };
    const nextQuizzes = [...quizzes, summary];
    setQuizzes(nextQuizzes);
    await refreshProgress(player, nextQuizzes);
    setSelectedQuizId(quiz.id);
    setPage("quizzes");
  }

  async function openQuiz(quizId: string) {
    setSelectedQuizId(quizId);
    const state = await loadQuizState(quizId);
    const completed =
      state.questions.length > 0 &&
      state.answeredQuestionIds.length >= state.questions.length;
    setPage(completed ? "result" : "play");
  }

  async function openResult(quizId: string) {
    setSelectedQuizId(quizId);
    await loadQuizState(quizId);
    if (player) {
      await refreshQuizzes(player);
    }
    setPage("result");
  }

  async function handleAnswer(
    questionId: string,
    answer: string,
  ): Promise<AnswerResult> {
    if (!player) {
      throw new Error("Player is required");
    }

    const result = await submitAnswer(selectedQuizId, player.id, questionId, answer);
    setAnsweredQuestionIds((current) =>
      current.includes(questionId) ? current : [...current, questionId],
    );
    await refreshProgress(player, quizzes);
    return result;
  }

  async function handleSeed() {
    await seedDemo();
    await refreshQuizzes(player);

    if (previewQuizId) {
      previewQuizLeaderboard(previewQuizId);
    }

    if (page === "result") {
      await loadQuizState(selectedQuizId);
    }
  }

  function handleNewPlayer() {
    localStorage.removeItem(storedPlayerKey);
    setPlayer(null);
    setProgressByQuizId({});
    setAnsweredQuestionIds([]);
    setResultRank(null);
    setPage("profile");
  }

  const liveStatus = useMemo(
    () => (socketConnected ? "Live" : "Offline"),
    [socketConnected],
  );

  return (
    <>
      <header className="topBar">
        <div className="brandLockup">
          <span className="brandMark" aria-hidden="true">
            <Database size={23} />
          </span>
          <div>
            <p className="eyebrow">Redis + FastAPI + WebSocket</p>
            <h1>Quiz Leaderboard</h1>
          </div>
        </div>
        <div className="topActions">
          {player ? (
            <span className="status neutral">
              <User size={16} aria-hidden="true" />
              {player.nick}
            </span>
          ) : null}
          <span
            aria-live="polite"
            className={socketConnected ? "status online" : "status offline"}
          >
            {socketConnected ? (
              <Wifi size={16} aria-hidden="true" />
            ) : (
              <WifiOff size={16} aria-hidden="true" />
            )}
            {liveStatus}
          </span>
          <a
            className="ghostButton"
            href="/leaderboard"
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink size={16} aria-hidden="true" />
            Leaderboard
          </a>
          <button className="ghostButton" onClick={handleSeed} type="button">
            <Database size={16} aria-hidden="true" />
            Seed
          </button>
          {player ? (
            <button className="ghostButton" onClick={handleNewPlayer} type="button">
              <UserPlus size={16} aria-hidden="true" />
              Nowy gracz
            </button>
          ) : null}
        </div>
      </header>
      <main className="appShell">

      {error ? (
        <div className="errorBanner" role="alert">
          {error}
        </div>
      ) : null}

      {page === "profile" ? <AccountSetup onCreate={handleCreatePlayer} /> : null}

      {page === "quizzes" ? (
        <QuizSelector
          onCreateClick={() => setPage("create")}
          onOpenResult={openResult}
          onPreview={previewQuizLeaderboard}
          onStart={openQuiz}
          previewLeaderboard={previewLeaderboard}
          previewQuizId={previewQuizId}
          progressByQuizId={progressByQuizId}
          quizzes={quizzes}
        />
      ) : null}

      {page === "create" ? (
        <section className="pageStack">
          <button
            className="ghostButton pageBackButton"
            onClick={() => setPage("quizzes")}
            type="button"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Wróć do quizów
          </button>
          <QuizCreator
            onCancel={() => setPage("quizzes")}
            onCreate={handleCreateQuiz}
          />
        </section>
      ) : null}

      {page === "play" ? (
        <section className="singlePage">
          <button
            className="ghostButton pageBackButton"
            onClick={() => setPage("quizzes")}
            type="button"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Wróć do quizów
          </button>
          <QuestionCard
            answeredQuestionIds={answeredQuestionIds}
            disabled={!player}
            onAnswer={handleAnswer}
            onComplete={() => void openResult(selectedQuizId)}
            playerId={player?.id ?? null}
            quizId={selectedQuizId}
            quizTitle={selectedQuiz?.title ?? "Quiz"}
            questions={questions}
          />
        </section>
      ) : null}

      {page === "result" ? (
        <section className="pageStack">
          <button
            className="ghostButton pageBackButton"
            onClick={() => setPage("quizzes")}
            type="button"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Wróć do quizów
          </button>
          <section className="panel resultPanel">
            <div className="panelHeader">
              <div className="panelTitle">
                <Trophy size={20} aria-hidden="true" />
                <h2>{selectedQuiz?.title ?? "Wynik quizu"}</h2>
              </div>
            </div>
            <div className="resultStats">
              <div>
                <span className="muted">Twój wynik</span>
                <strong>{resultRank?.globalScore ?? 0} pkt</strong>
              </div>
              <div>
                <span className="muted">Ranking globalny</span>
                <strong>{resultRank?.globalRank ? `#${resultRank.globalRank}` : "-"}</strong>
              </div>
              <div>
                <span className="muted">Ranking tygodniowy</span>
                <strong>{resultRank?.weeklyRank ? `#${resultRank.weeklyRank}` : "-"}</strong>
              </div>
              <div>
                <span className="muted">Ukończono</span>
                <strong>
                  {answeredQuestionIds.length}/{questions.length}
                </strong>
              </div>
            </div>
          </section>
          <section className="resultBoards">
            <Leaderboard title="Ranking globalny" leaderboard={globalLeaderboard} />
            <Leaderboard title="Ranking tygodniowy" leaderboard={weeklyLeaderboard} />
          </section>
        </section>
      ) : null}
      </main>
    </>
  );
}
