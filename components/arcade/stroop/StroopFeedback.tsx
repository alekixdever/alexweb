// components/arcade/stroop/StroopFeedback.tsx
import { useEffect, useState } from "react";
import type { StroopColor } from "@/types/arcade";

interface Props {
  isCorrect: boolean;
  correctAnswer: StroopColor;
  scoreEarned: number;
  lang: "en" | "ja";
  onDone: () => void;
}

export default function StroopFeedback({
  isCorrect,
  correctAnswer,
  scoreEarned,
  lang,
  onDone,
}: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 300);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "var(--radius)",
        background: isCorrect
          ? "rgba(52,211,153,0.18)"
          : "rgba(248,113,113,0.18)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        pointerEvents: "none",
        zIndex: 10,
        animation: "fadeOut 0.3s ease forwards",
      }}
    >
      <span style={{ fontSize: 36 }}>{isCorrect ? "✓" : "✗"}</span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: isCorrect ? "var(--green)" : "#f87171",
        }}
      >
        {isCorrect
          ? lang === "ja"
            ? `+${scoreEarned} 正解！`
            : `+${scoreEarned} Correct!`
          : lang === "ja"
            ? `不正解 — ${correctAnswer.label_ja}`
            : `Wrong — ${correctAnswer.label}`}
      </span>
    </div>
  );
}
