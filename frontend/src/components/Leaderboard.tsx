import { Trophy } from "lucide-react";

import type { LeaderboardResponse } from "../api/client";
import { AvatarIcon } from "./AvatarIcon";

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
            <div
              className={`leaderboardRow rank-${entry.rank <= 3 ? entry.rank : "default"}`}
              key={entry.playerId}
            >
              <span aria-label={`Miejsce ${entry.rank}`} className="rank">
                #{entry.rank}
              </span>
              <span className="leaderboardIdentity">
                <AvatarIcon className="avatar" decorative value={entry.avatar} />
                <span className="nick">{entry.nick}</span>
              </span>
              <strong className="scorePill">{entry.score} pkt</strong>
            </div>
          ))
        ) : (
          <div className="emptyState" role="status">
            Brak wyników
          </div>
        )}
      </div>
    </section>
  );
}
