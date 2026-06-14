// components/arcade/stroop/StroopAnswerButtons.tsx
import type { StroopColor } from "@/types/arcade";

interface Props {
  options: StroopColor[];
  onAnswer: (color: StroopColor) => void;
  disabled: boolean;
  lang: "en" | "ja";
}

export default function StroopAnswerButtons({
  options,
  onAnswer,
  disabled,
  lang,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        width: "100%",
        maxWidth: 360,
      }}
    >
      {options.map((color) => (
        <button
          key={color.key}
          onClick={() => !disabled && onAnswer(color)}
          disabled={disabled}
          style={{
            padding: "14px 8px",
            borderRadius: "var(--radius-sm)",
            border: `2px solid ${color.hex}55`,
            background: `${color.hex}18`,
            color: color.hex,
            fontSize: 15,
            fontWeight: 600,
            cursor: disabled ? "default" : "pointer",
            transition: "all 0.12s ease",
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.background =
                `${color.hex}33`;
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                color.hex;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              `${color.hex}18`;
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              `${color.hex}55`;
          }}
        >
          {lang === "ja" ? color.label_ja : color.label}
        </button>
      ))}
    </div>
  );
}
