import { Database, Trophy, Wifi, WifiOff } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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

const CONFETTI_COLORS = ["#facc15", "#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
const CONFETTI_COUNT = 28;

interface ConfettiPiece {
  id: number;
  color: string;
  left: number;
  cx: number;
  cy: number;
  cr: number;
  size: number;
  delay: number;
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: 10 + Math.random() * 80,
    cx: Math.random() * 160 - 80,
    cy: -(60 + Math.random() * 100),
    cr: Math.random() * 720 - 360,
    size: Math.random() * 8 + 6,
    delay: Math.random() * 0.35,
  }));
}

export function LeaderboardDisplay() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[] | null>(null);
  const liveQuizIdRef = useRef<string | null>(null);
  const prevPositionsRef = useRef<Map<string, number>>(new Map());
  const prevRank1IdRef = useRef<string | null>(null);
  const rowsRef = useRef<Map<string, HTMLDivElement>>(new Map());

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

  // Auto-clear confetti after animation completes
  useEffect(() => {
    if (!confetti) return;
    const t = setTimeout(() => setConfetti(null), 2400);
    return () => clearTimeout(t);
  }, [confetti]);

  // FLIP animation + rank-1 detection (runs synchronously before browser paint)
  useLayoutEffect(() => {
    const entries = leaderboard?.entries ?? [];

    // Disable transition + clear any lingering transforms before measuring
    entries.forEach((entry) => {
      const el = rowsRef.current.get(entry.playerId);
      if (!el) return;
      el.style.transition = "none";
      el.style.transform = "";
    });

    // Force reflow so cleared transforms are committed before we read positions
    const newPositions = new Map<string, number>();
    entries.forEach((entry) => {
      const el = rowsRef.current.get(entry.playerId);
      if (!el) return;
      newPositions.set(entry.playerId, el.getBoundingClientRect().top);
    });

    // Apply inverted transforms so elements appear at their old positions
    const prevPositions = prevPositionsRef.current;
    entries.forEach((entry) => {
      const el = rowsRef.current.get(entry.playerId);
      if (!el) return;
      const prevTop = prevPositions.get(entry.playerId);
      const newTop = newPositions.get(entry.playerId);
      if (prevTop !== undefined && newTop !== undefined) {
        const delta = prevTop - newTop;
        if (Math.abs(delta) > 1) {
          el.style.transition = "none";
          el.style.transform = `translateY(${delta}px)`;
        }
      }
    });

    // Store new positions for next update
    prevPositionsRef.current = newPositions;

    // Double-rAF: first frame commits the inverted positions to the compositor,
    // second frame sets the transition + clears transforms so the browser animates
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entries.forEach((entry) => {
          const el = rowsRef.current.get(entry.playerId);
          if (!el) return;
          el.style.transition = "transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          el.style.transform = "";
        });
      });
    });

    // Detect rank-1 change and trigger confetti
    const newRank1Id = entries.find((e) => e.rank === 1)?.playerId ?? null;
    const prevRank1Id = prevRank1IdRef.current;
    prevRank1IdRef.current = newRank1Id;

    if (newRank1Id && newRank1Id !== prevRank1Id && prevRank1Id !== null) {
      setConfetti(makeConfetti());
    }
  }, [leaderboard]);

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
              ref={(el) => {
                if (el) rowsRef.current.set(entry.playerId, el);
                else rowsRef.current.delete(entry.playerId);
              }}
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

              {entry.rank === 1 && confetti ? (
                <div className="confettiContainer" aria-hidden="true">
                  {confetti.map((piece) => (
                    <span
                      key={piece.id}
                      className="confettiPiece"
                      style={
                        {
                          backgroundColor: piece.color,
                          width: piece.size,
                          height: piece.size,
                          left: `${piece.left}%`,
                          "--cx": `${piece.cx}px`,
                          "--cy": `${piece.cy}px`,
                          "--cr": `${piece.cr}deg`,
                          animationDelay: `${piece.delay}s`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              ) : null}
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
