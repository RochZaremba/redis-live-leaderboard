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
  quizId: string;
  playerId: string;
  globalRank: number | null;
  globalScore: number;
  weeklyRank: number | null;
  weeklyScore: number;
  weekKey: string;
};

export type PlayerAnswers = {
  quizId: string;
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
  quizId: string;
  scope: string;
  weekKey?: string | null;
  entries: LeaderboardEntry[];
};

export type QuizSummary = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  createdAt: string;
  isDefault: boolean;
};

export type QuizQuestionCreate = {
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

export type QuizCreate = {
  title: string;
  description: string;
  questions: QuizQuestionCreate[];
};

export type QuizDetail = QuizSummary & {
  questions: Question[];
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

export function getPlayerRank(playerId: string, quizId = "default") {
  return request<PlayerRank>(`/api/players/${playerId}/quizzes/${quizId}/rank`);
}

export function getPlayerAnswers(playerId: string, quizId = "default") {
  return request<PlayerAnswers>(
    `/api/players/${playerId}/quizzes/${quizId}/answers`,
  );
}

export function getQuizzes() {
  return request<QuizSummary[]>("/api/quizzes");
}

export function createQuiz(payload: QuizCreate) {
  return request<QuizDetail>("/api/quizzes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getQuestions(quizId = "default") {
  return request<Question[]>(`/api/quizzes/${quizId}/questions`);
}

export function submitAnswer(
  quizId: string,
  playerId: string,
  questionId: string,
  answer: string,
) {
  return request<AnswerResult>(`/api/quizzes/${quizId}/answer`, {
    method: "POST",
    body: JSON.stringify({ quizId, playerId, questionId, answer }),
  });
}

export function getGlobalLeaderboard(limit = 10, quizId = "default") {
  return request<LeaderboardResponse>(
    `/api/quizzes/${quizId}/leaderboard/global?limit=${limit}`,
  );
}

export function getWeeklyLeaderboard(limit = 10, quizId = "default") {
  return request<LeaderboardResponse>(
    `/api/quizzes/${quizId}/leaderboard/weekly?limit=${limit}`,
  );
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
