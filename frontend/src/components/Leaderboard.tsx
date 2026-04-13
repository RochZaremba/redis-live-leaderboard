import { Trophy } from "lucide-react";

import type { LeaderboardResponse } from "../api/client";

type Props = {
  title: string;
  leaderboard: LeaderboardResponse | null;
};

export function Leaderboard({ title, leaderboard }: Props) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">
          <Trophy size={18} aria-hidden="true" />
          <h2>{title}</h2>
        </div>
        {leaderboard?.weekKey ? (
          <span className="tag">{leaderboard.weekKey.replace("leaderboard:", "")}</span>
        ) : null}
      </div>

      <div className="leaderboardRows">
        {leaderboard?.entries.length ? (
          leaderboard.entries.map((entry) => (
            <div className="leaderboardRow" key={entry.playerId}>
              <span className="rank">#{entry.rank}</span>
              <span className="avatar">{entry.avatar}</span>
              <span className="nick">{entry.nick}</span>
              <strong>{entry.score} pkt</strong>
            </div>
          ))
        ) : (
          <div className="emptyState">Brak wyników</div>
        )}
      </div>
    </section>
  );
}

