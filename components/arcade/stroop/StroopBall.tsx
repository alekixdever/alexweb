// components/arcade/stroop/StroopBall.tsx
import type { StroopColor } from "@/types/arcade";

interface Props {
  ballColor: StroopColor;
  textLabel: StroopColor;
  lang: "en" | "ja";
}

// Auto-pick text colour for contrast
function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a2e" : "#ffffff";
}

export default function StroopBall({ ballColor, textLabel, lang }: Props) {
  return (
    <div
      style={{
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${ballColor.hex}dd, ${ballColor.hex})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 40px ${ballColor.hex}66, 0 8px 32px rgba(0,0,0,0.3)`,
        transition: "background 0.15s ease, box-shadow 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: contrastText(ballColor.hex),
          letterSpacing: "0.02em",
          userSelect: "none",
        }}
      >
        {lang === "ja" ? textLabel.label_ja : textLabel.label}
      </span>
    </div>
  );
}
