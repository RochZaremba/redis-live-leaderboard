import { Database, Trophy, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  LeaderboardResponse,
  QuizSummary,
  getGlobalLeaderboard,
  getQuizzes,
} from "../api/client";
import { AvatarIcon } from "../components/AvatarIcon";
import {
  LeaderboardSocketEvent,
  connectLeaderboardSocket,
} from "../socket/leaderboardSocket";

export function LeaderboardDisplay() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const liveQuizIdRef = useRef<string | null>(null);

  function fetchLeaderboard(quizId: string) {
    getGlobalLeaderboard(20, quizId)
      .then(setLeaderboard)
      .catch(console.error);
  }

  useEffect(() => {
    liveQuizIdRef.current = selectedQuizId;
    if (selectedQuizId) fetchLeaderboard(selectedQuizId);
  }, [selectedQuizId]);

  useEffect(() => {
    getQuizzes()
      .then((items) => {
        setQuizzes(items);
        const firstId = items[0]?.id ?? "default";
        setSelectedQuizId(firstId);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let reconnectId: number | null = null;
    let socket: WebSocket | null = null;
    let stopped = false;

    function scheduleReconnect() {
      if (stopped || reconnectId !== null) return;
      reconnectId = window.setTimeout(() => {
        reconnectId = null;
        connect();
      }, 1000);
    }

    function handleMessage(event: LeaderboardSocketEvent) {
      if (event.type === "connection.ready") return;
      const quizId = liveQuizIdRef.current;
      if (quizId) fetchLeaderboard(quizId);
    }

    function handleStatusChange(connected: boolean) {
      setSocketConnected(connected);
      if (!connected) {
        scheduleReconnect();
      } else if (reconnectId !== null) {
        window.clearTimeout(reconnectId);
        reconnectId = null;
      }
    }

    function connect() {
      socket = connectLeaderboardSocket(handleMessage, handleStatusChange);
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectId !== null) window.clearTimeout(reconnectId);
      socket?.close();
    };
  }, []);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  return (
    <main className="lbDisplayShell">
      <header className="lbDisplayHeader">
        <div className="brandLockup">
          <span className="brandMark" aria-hidden="true">
            <Database size={23} />
          </span>
          <div>
            <p className="eyebrow">Live Leaderboard</p>
            <h1 className="lbDisplayTitle">
              <Trophy size={28} aria-hidden="true" />
              {selectedQuiz?.title ?? "Ranking"}
            </h1>
          </div>
        </div>
        <div className="topActions">
          {quizzes.length > 1 ? (
            <select
              onChange={(e) => setSelectedQuizId(e.target.value)}
              value={selectedQuizId ?? ""}
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
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
            {socketConnected ? "Live" : "Offline"}
          </span>
        </div>
      </header>

      <section className="lbDisplayRows">
        {leaderboard?.entries.length ? (
          leaderboard.entries.map((entry) => (
            <div
              className={`lbDisplayRow rank-${entry.rank <= 3 ? entry.rank : "default"}`}
              key={entry.playerId}
            >
              <span aria-label={`Miejsce ${entry.rank}`} className="lbDisplayRank">
                #{entry.rank}
              </span>
              <span className="leaderboardIdentity">
                <AvatarIcon
                  className="avatar lbDisplayAvatar"
                  decorative
                  value={entry.avatar}
                />
                <span className="nick lbDisplayNick">{entry.nick}</span>
              </span>
              <strong className="scorePill lbDisplayScore">{entry.score} pkt</strong>
            </div>
          ))
        ) : (
          <div className="emptyState" role="status">
            Brak wyników
          </div>
        )}
      </section>
    </main>
  );
}
