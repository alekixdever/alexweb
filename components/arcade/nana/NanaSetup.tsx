// components/arcade/nana/NanaSetup.tsx
"use client";

import { useState } from "react";

interface Props {
  currentUserName?: string;
  currentUserId?: string;
  lang: "en" | "ja";
  onStart: (names: string[], userIds: (string | null)[]) => void;
  onExit: () => void;
}

export default function NanaSetup({
  currentUserName,
  currentUserId,
  lang,
  onStart,
  onExit,
}: Props) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(
    Array(6)
      .fill("")
      .map((_, i) =>
        i === 0 && currentUserName ? currentUserName : `Player ${i + 1}`,
      ),
  );

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  function handleStart() {
    const selectedNames = names.slice(0, playerCount);
    const userIds = selectedNames.map((_, i) =>
      i === 0 ? (currentUserId ?? null) : null,
    );
    onStart(selectedNames, userIds);
  }

  return (
    <div
      className="float-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: 32,
        borderRadius: "var(--radius)",
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-primary)" }}>
        {t("Nana / ナナ", "ナナ")}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--fg-muted)",
          textAlign: "center",
          maxWidth: 280,
        }}
      >
        {t(
          "Collect 3 trios, or 2 trios that sum/differ by 7 (Lucky 7!) to win.",
          "3組のトリオを集めるか、合計または差が7になる2組（ラッキー7！）で勝利。",
        )}
      </p>

      {/* Player count */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        <p className="label-xs">{t("Number of players", "プレイヤー人数")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setPlayerCount(n)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                background:
                  playerCount === n ? "var(--accent)" : "var(--surface-3)",
                color: playerCount === n ? "#fff" : "var(--fg-muted)",
                transition: "all 0.15s ease",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Player names */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        <p className="label-xs">{t("Player names", "プレイヤー名")}</p>
        {Array.from({ length: playerCount }).map((_, i) => (
          <input
            key={i}
            value={names[i]}
            onChange={(e) => {
              const next = [...names];
              next[i] = e.target.value;
              setNames(next);
            }}
            placeholder={`Player ${i + 1}`}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--fg-primary)",
              fontSize: 14,
              outline: "none",
              width: "100%",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-primary" onClick={handleStart}>
          {t("Start Game / ", "")}ゲームを始める
        </button>
        <button className="btn-secondary" onClick={onExit}>
          {t("Back", "戻る")}
        </button>
      </div>
    </div>
  );
}
