import { API_BASE } from "../api/client";

export type LeaderboardSocketEvent = {
  type: string;
  quizId?: string;
  player?: {
    id: string;
    nick: string;
    avatar: string;
  };
  pointsDelta?: number;
  globalScore?: number;
  globalRank?: number;
  weeklyScore?: number;
  weeklyRank?: number;
  weekKey?: string;
  updatedAt?: string;
  players?: number;
};

export function getLeaderboardSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  return `${API_BASE.replace(/^http/, "ws")}/ws/leaderboard`;
}

export function connectLeaderboardSocket(
  onMessage: (event: LeaderboardSocketEvent) => void,
  onStatusChange: (connected: boolean) => void,
) {
  const socket = new WebSocket(getLeaderboardSocketUrl());

  socket.addEventListener("open", () => onStatusChange(true));
  socket.addEventListener("close", () => onStatusChange(false));
  socket.addEventListener("error", () => onStatusChange(false));
  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data) as LeaderboardSocketEvent;
    onMessage(payload);
  });

  return socket;
}
