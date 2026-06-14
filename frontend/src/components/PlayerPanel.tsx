import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import type { PlayerProfile, PlayerRank } from "../api/client";
import { AvatarIcon, avatarOptions } from "./AvatarIcon";
import { AvatarPicker } from "./AvatarPicker";

type Props = {
  player: PlayerProfile | null;
  rank: PlayerRank | null;
  onCreate: (nick: string, avatar: string) => Promise<void>;
};

export function PlayerPanel({ player, rank, onCreate }: Props) {
  const [nick, setNick] = useState("");
  const [avatar, setAvatar] = useState(avatarOptions[0].value);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nick.trim()) return;
    setCreating(true);
    try {
      await onCreate(nick.trim(), avatar);
      setNick("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">
          <UserPlus size={18} aria-hidden="true" />
          <h2>Gracz</h2>
        </div>
      </div>

      <form className="playerForm" onSubmit={handleSubmit}>
        <input
          value={nick}
          onChange={(event) => setNick(event.target.value)}
          placeholder="Nick"
          minLength={2}
          maxLength={32}
        />
        <AvatarPicker onChange={setAvatar} value={avatar} />
        <button className="primaryButton" disabled={creating || !nick.trim()}>
          <UserPlus size={16} aria-hidden="true" />
          Utwórz
        </button>
      </form>

      {player ? (
        <div className="profileStats">
          <div>
            <span className="muted">Nick</span>
            <strong className="playerStatIdentity">
              <AvatarIcon decorative size={16} value={player.avatar} />
              {player.nick}
            </strong>
          </div>
          <div>
            <span className="muted">Punkty</span>
            <strong>{rank?.globalScore ?? player.totalScore}</strong>
          </div>
          <div>
            <span className="muted">Globalnie</span>
            <strong>{rank?.globalRank ? `#${rank.globalRank}` : "-"}</strong>
          </div>
          <div>
            <span className="muted">Tydzień</span>
            <strong>{rank?.weeklyRank ? `#${rank.weeklyRank}` : "-"}</strong>
          </div>
          <div>
            <span className="muted">Poprawne</span>
            <strong>{player.correctAnswers}</strong>
          </div>
          <div>
            <span className="muted">Błędne</span>
            <strong>{player.wrongAnswers}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}
