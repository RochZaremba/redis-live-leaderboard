import { UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import { AvatarIcon, avatarOptions } from "./AvatarIcon";
import { AvatarPicker } from "./AvatarPicker";

type Props = {
  onCreate: (nick: string, avatar: string) => Promise<void>;
};

export function AccountSetup({ onCreate }: Props) {
  const [nick, setNick] = useState("");
  const [avatar, setAvatar] = useState(avatarOptions[0].value);
  const [creating, setCreating] = useState(false);
  const previewName = nick.trim() || "Twój nick";

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
          <div className="avatarPreview">
            <AvatarIcon size={34} value={avatar} />
            <strong>{previewName}</strong>
          </div>
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
          <AvatarPicker onChange={setAvatar} value={avatar} />
          <button
            className="primaryButton"
            disabled={creating || nick.trim().length < 2}
            type="submit"
          >
            <UserPlus size={16} aria-hidden="true" />
            Utwórz konto
          </button>
        </form>
      </div>
    </section>
  );
}
