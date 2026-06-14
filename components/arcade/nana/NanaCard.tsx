// components/arcade/nana/NanaCard.tsx

interface Props {
  number: number | null;
  faceUp: boolean;
  isFlippable?: boolean;
  isFlipped?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export default function NanaCard({
  number,
  faceUp,
  isFlippable = false,
  isFlipped = false,
  onClick,
  size = "md",
}: Props) {
  const dim = size === "sm" ? 44 : 56;

  const bg = faceUp
    ? "var(--surface-2)"
    : isFlipped
      ? "rgba(139,92,246,0.25)"
      : "var(--surface-3)";

  const border = isFlippable
    ? "2px solid var(--accent)"
    : isFlipped
      ? "2px solid var(--accent-bright)"
      : "1px solid var(--border)";

  return (
    <button
      onClick={isFlippable ? onClick : undefined}
      disabled={!isFlippable}
      style={{
        width: dim,
        height: dim,
        borderRadius: "var(--radius-sm)",
        background: bg,
        border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isFlippable ? "pointer" : "default",
        fontSize: size === "sm" ? 14 : 18,
        fontWeight: 700,
        color: faceUp ? "var(--fg-primary)" : "transparent",
        transition: "all 0.2s ease",
        boxShadow: isFlippable ? "0 0 8px var(--accent)44" : "none",
        flexShrink: 0,
        transform: isFlipped ? "scale(1.06)" : "scale(1)",
      }}
    >
      {faceUp ? number : ""}
    </button>
  );
}
