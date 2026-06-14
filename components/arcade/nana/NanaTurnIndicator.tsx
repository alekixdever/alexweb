// components/arcade/nana/NanaTurnIndicator.tsx
import type { NanaGameState } from "@/types/arcade";

interface Props {
  state: NanaGameState;
  currentUserId?: string;
  lang: "en" | "ja";
}

export default function NanaTurnIndicator({
  state,
  currentUserId,
  lang,
}: Props) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn =
    currentPlayer?.userId === currentUserId ||
    currentPlayer?.id === currentUserId;
  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  const flipLabels: Record<string, string> = {
    flip1: t("Flip 1st card", "1枚目をめくる"),
    flip2: t("Flip 2nd card", "2枚目をめくる"),
    flip3: t("Flip 3rd card", "3枚目をめくる"),
    resolving: t("Resolving…", "処理中…"),
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        background: isMyTurn ? "rgba(139,92,246,0.12)" : "var(--surface-2)",
        border: isMyTurn
          ? "1px solid var(--accent)"
          : "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isMyTurn ? "var(--accent-bright)" : "var(--fg-primary)",
        }}
      >
        {isMyTurn
          ? t("Your turn / あなたのターン", "あなたのターン")
          : `${currentPlayer?.name} ${t("'s turn", "のターン")}`}
      </span>
      <span className="label-xs">
        {flipLabels[state.currentTurn.phase] ?? ""}
      </span>
    </div>
  );
}
