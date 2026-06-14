import { AvatarIcon, avatarOptions } from "./AvatarIcon";

type Props = {
  label?: string;
  onChange: (value: string) => void;
  value: string;
};

export function AvatarPicker({ label = "Ikona", onChange, value }: Props) {
  return (
    <fieldset className="avatarPicker">
      <legend className="muted">{label}</legend>
      <div className="avatarChoiceGrid">
        {avatarOptions.map((option) => {
          const selected = option.value === value;

          return (
            <button
              aria-pressed={selected}
              className={selected ? "avatarChoice selected" : "avatarChoice"}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <AvatarIcon decorative size={20} value={option.value} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
