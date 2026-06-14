// components/arcade/stroop/StroopQuestion.tsx
import type { StroopQuestion as Q } from "@/types/arcade";

interface Props {
  question: Q;
  lang: "en" | "ja";
}

export default function StroopQuestion({ question, lang }: Props) {
  const text =
    question === "color"
      ? lang === "ja"
        ? "ボールの色は何色？"
        : "What COLOR is the ball?"
      : lang === "ja"
        ? "テキストは何と書いてある？"
        : "What does the TEXT say?";

  return (
    <p
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: "var(--fg-primary)",
        textAlign: "center",
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </p>
  );
}
