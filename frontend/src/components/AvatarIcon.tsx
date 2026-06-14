import {
  CircleUserRound,
  Diamond,
  Rocket,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";

type AvatarOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
};

export const avatarOptions: AvatarOption[] = [
  { value: "rocket", label: "Rakieta", Icon: Rocket },
  { value: "bolt", label: "Błysk", Icon: Zap },
  { value: "star", label: "Gwiazda", Icon: Star },
  { value: "diamond", label: "Diament", Icon: Diamond },
];

function getAvatarOption(value: string) {
  return avatarOptions.find((option) => option.value === value);
}

export function getAvatarLabel(value: string) {
  return getAvatarOption(value)?.label ?? "Gracz";
}

type AvatarIconProps = {
  className?: string;
  decorative?: boolean;
  size?: number;
  value: string;
};

export function AvatarIcon({
  className,
  decorative = false,
  size = 18,
  value,
}: AvatarIconProps) {
  const option = getAvatarOption(value);
  const Icon = option?.Icon ?? CircleUserRound;
  const label = option?.label ?? "Gracz";

  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : label}
      className={["avatarIcon", className].filter(Boolean).join(" ")}
      title={label}
    >
      <Icon aria-hidden="true" size={size} strokeWidth={2.3} />
    </span>
  );
}
