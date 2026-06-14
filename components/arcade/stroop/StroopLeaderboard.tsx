// components/arcade/stroop/StroopLeaderboard.tsx
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/arcade/arcade-db";
import type { ArcadeRanking } from "@/types/arcade";

interface Props {
  currentUserId?: string;
  lang: "en" | "ja";
}

export default function StroopLeaderboard({ currentUserId, lang }: Props) {
  const [board, setBoard] = useState<ArcadeRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard("stroop", 10)
      .then(setBoard)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="label-xs" style={{ textAlign: "center", padding: 16 }}>
        {lang === "ja" ? "読み込み中…" : "Loading…"}
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        width: "100%",
      }}
    >
      <p className="label-xs" style={{ marginBottom: 4 }}>
        {lang === "ja" ? "ランキング" : "Leaderboard"}
      </p>
      {board.map((entry, i) => {
        const isMe = entry.user_id === currentUserId;
        return (
          <div
            key={entry.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              background: isMe ? "rgba(139,92,246,0.12)" : "var(--surface-2)",
              border: isMe
                ? "1px solid var(--accent)"
                : "1px solid transparent",
            }}
          >
            <span
              className="label-xs"
              style={{
                width: 20,
                textAlign: "right",
                color: i < 3 ? "var(--accent)" : "var(--fg-muted)",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: isMe ? 600 : 400,
                color: "var(--fg-primary)",
              }}
            >
              {entry.profiles?.name ?? "—"}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--accent-bright)",
                fontWeight: 600,
              }}
            >
              {entry.best_score.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
