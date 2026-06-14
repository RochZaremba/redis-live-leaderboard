export type PlayerProfile = {
  id: string;
  nick: string;
  avatar: string;
  gamesPlayed: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalScore: number;
};

export type PlayerRank = {
  playerId: string;
  globalRank: number | null;
  globalScore: number;
  weeklyRank: number | null;
  weeklyScore: number;
  weekKey: string;
};

export type PlayerAnswers = {
  playerId: string;
  answeredQuestionIds: string[];
};

export type Question = {
  id: string;
  text: string;
  options: string[];
};

export type AnswerResult = {
  playerId: string;
  questionId: string;
  correct: boolean;
  pointsAwarded: number;
  correctAnswer: string;
  explanation: string;
  rank: PlayerRank;
};

export type LeaderboardEntry = {
  playerId: string;
  nick: string;
  avatar: string;
  score: number;
  rank: number;
};

export type LeaderboardResponse = {
  scope: string;
  weekKey?: string | null;
  entries: LeaderboardEntry[];
};

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function createPlayer(nick: string, avatar: string) {
  return request<PlayerProfile>("/api/players", {
    method: "POST",
    body: JSON.stringify({ nick, avatar }),
  });
}

export function getPlayer(playerId: string) {
  return request<PlayerProfile>(`/api/players/${playerId}`);
}

export function getPlayerRank(playerId: string) {
  return request<PlayerRank>(`/api/players/${playerId}/rank`);
}

export function getPlayerAnswers(playerId: string) {
  return request<PlayerAnswers>(`/api/players/${playerId}/answers`);
}

export function getQuestions() {
  return request<Question[]>("/api/questions");
}

export function submitAnswer(
  playerId: string,
  questionId: string,
  answer: string,
) {
  return request<AnswerResult>("/api/game/answer", {
    method: "POST",
    body: JSON.stringify({ playerId, questionId, answer }),
  });
}

export function getGlobalLeaderboard(limit = 10) {
  return request<LeaderboardResponse>(`/api/leaderboard/global?limit=${limit}`);
}

export function getWeeklyLeaderboard(limit = 10) {
  return request<LeaderboardResponse>(`/api/leaderboard/weekly?limit=${limit}`);
}

export function seedDemo() {
  return request<{ status: string; players: number; weeklyKey: string }>(
    "/api/dev/seed",
    { method: "POST" },
  );
}

export function resetDemo() {
  return request<{ status: string; deletedKeys: number }>("/api/dev/reset", {
    method: "POST",
  });
}
