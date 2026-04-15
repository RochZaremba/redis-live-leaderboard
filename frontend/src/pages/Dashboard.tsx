import { Database, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AnswerResult,
  LeaderboardResponse,
  PlayerProfile,
  PlayerRank,
  Question,
  createPlayer,
  getGlobalLeaderboard,
  getPlayer,
  getPlayerRank,
  getQuestions,
  getWeeklyLeaderboard,
  resetDemo,
  seedDemo,
  submitAnswer,
} from "../api/client";
import { Leaderboard } from "../components/Leaderboard";
import { PlayerPanel } from "../components/PlayerPanel";
import { QuestionCard } from "../components/QuestionCard";
import {
  LeaderboardSocketEvent,
  connectLeaderboardSocket,
} from "../socket/leaderboardSocket";

const storedPlayerKey = "quiz-leaderboard-player-id";

export function Dashboard() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] =
    useState<LeaderboardResponse | null>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] =
    useState<LeaderboardResponse | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [events, setEvents] = useState<LeaderboardSocketEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshLeaderboards = useCallback(async () => {
    const [globalBoard, weeklyBoard] = await Promise.all([
      getGlobalLeaderboard(10),
      getWeeklyLeaderboard(10),
    ]);
    setGlobalLeaderboard(globalBoard);
    setWeeklyLeaderboard(weeklyBoard);
  }, []);

  const refreshPlayer = useCallback(async (playerId: string) => {
    const [profile, playerRank] = await Promise.all([
      getPlayer(playerId),
      getPlayerRank(playerId),
    ]);
    setPlayer(profile);
    setRank(playerRank);
  }, []);

  useEffect(() => {
    getQuestions().then(setQuestions).catch((err: Error) => setError(err.message));
    refreshLeaderboards().catch((err: Error) => setError(err.message));

    const storedPlayerId = localStorage.getItem(storedPlayerKey);
    if (storedPlayerId) {
      refreshPlayer(storedPlayerId).catch(() =>
        localStorage.removeItem(storedPlayerKey),
      );
    }
  }, [refreshLeaderboards, refreshPlayer]);

  useEffect(() => {
    const socket = connectLeaderboardSocket(
      (event) => {
        if (event.type !== "connection.ready") {
          setEvents((current) => [event, ...current].slice(0, 6));
          refreshLeaderboards().catch((err: Error) => setError(err.message));
          const playerId = localStorage.getItem(storedPlayerKey);
          if (playerId) {
            refreshPlayer(playerId).catch((err: Error) => setError(err.message));
          }
        }
      },
      setSocketConnected,
    );

    return () => socket.close();
  }, [refreshLeaderboards, refreshPlayer]);

  async function handleCreatePlayer(nick: string, avatar: string) {
    const profile = await createPlayer(nick, avatar);
    localStorage.setItem(storedPlayerKey, profile.id);
    setPlayer(profile);
    setRank(await getPlayerRank(profile.id));
  }

  async function handleAnswer(questionId: string, answer: string): Promise<AnswerResult> {
    if (!player) {
      throw new Error("Player is required");
    }
    const result = await submitAnswer(player.id, questionId, answer);
    await Promise.all([refreshPlayer(player.id), refreshLeaderboards()]);
    return result;
  }

  async function handleSeed() {
    await seedDemo();
    await refreshLeaderboards();
  }

  async function handleReset() {
    await resetDemo();
    localStorage.removeItem(storedPlayerKey);
    setPlayer(null);
    setRank(null);
    setEvents([]);
    await refreshLeaderboards();
  }

  const liveStatus = useMemo(
    () => (socketConnected ? "Live" : "Offline"),
    [socketConnected],
  );

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">Redis + FastAPI + WebSocket</p>
          <h1>Quiz Leaderboard</h1>
        </div>
        <div className="topActions">
          <span className={socketConnected ? "status online" : "status offline"}>
            {socketConnected ? (
              <Wifi size={16} aria-hidden="true" />
            ) : (
              <WifiOff size={16} aria-hidden="true" />
            )}
            {liveStatus}
          </span>
          <button className="ghostButton" onClick={handleSeed} type="button">
            <Database size={16} aria-hidden="true" />
            Seed
          </button>
          <button className="dangerButton" onClick={handleReset} type="button">
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </header>

      {error ? <div className="errorBanner">{error}</div> : null}

      <section className="mainGrid">
        <div className="leftColumn">
          <PlayerPanel player={player} rank={rank} onCreate={handleCreatePlayer} />
          <QuestionCard
            disabled={!player}
            onAnswer={handleAnswer}
            questions={questions}
          />
        </div>

        <div className="rightColumn">
          <Leaderboard title="Ranking globalny" leaderboard={globalLeaderboard} />
          <Leaderboard title="Ranking tygodniowy" leaderboard={weeklyLeaderboard} />
          <section className="panel">
            <div className="panelHeader">
              <div className="panelTitle">
                <Wifi size={18} aria-hidden="true" />
                <h2>Eventy</h2>
              </div>
            </div>
            <div className="eventList">
              {events.length ? (
                events.map((event, index) => (
                  <div className="eventRow" key={`${event.updatedAt}-${index}`}>
                    <strong>{event.type}</strong>
                    <span>
                      {event.player?.nick ?? "system"}{" "}
                      {event.pointsDelta ? `+${event.pointsDelta} pkt` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <div className="emptyState">Brak eventów</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

