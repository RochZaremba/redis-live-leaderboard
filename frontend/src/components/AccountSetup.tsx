import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  onCreate: (nick: string, avatar: string) => Promise<void>;
};

const avatars = ["rocket", "bolt", "star", "diamond"];

export function AccountSetup({ onCreate }: Props) {
  const [nick, setNick] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (nick.trim().length < 2) return;

    setCreating(true);
    try {
      await onCreate(nick.trim(), avatar);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="singlePage">
      <div className="panel accountPanel">
        <div className="panelHeader">
          <div className="panelTitle">
            <UserPlus size={20} aria-hidden="true" />
            <h2>Utwórz konto gracza</h2>
          </div>
        </div>

        <form className="accountForm" onSubmit={handleSubmit}>
          <label>
            <span className="muted">Nazwa użytkownika</span>
            <input
              maxLength={32}
              minLength={2}
              onChange={(event) => setNick(event.target.value)}
              placeholder="Wpisz nick"
              value={nick}
            />
          </label>
          <label>
            <span className="muted">Ikona</span>
            <select
              onChange={(event) => setAvatar(event.target.value)}
              value={avatar}
            >
              {avatars.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primaryButton"
            disabled={creating || nick.trim().length < 2}
          >
            <UserPlus size={16} aria-hidden="true" />
            Utwórz konto
          </button>
        </form>
      </div>
    </section>
  );
}
