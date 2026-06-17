// components/arcade/ArcadeLobby.tsx
"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import ArcadeGameCard from "./ArcadeGameCard";
import StroopGame from "./stroop/StroopGame";
import NanaGame from "./nana/NanaGame";
import { getUserRanking, getUserGlobalRank } from "@/lib/arcade/arcade-db";
import SnakeGame from "./SnakeGame";

type ActiveGame = "stroop" | "nana" | "snake" | null;

interface PersonalStats {
  stroopBest: number | null;
  stroopRank: number | null;
}

export default function ArcadeLobby() {
  const { user } = useApp();
  const lang =
    typeof navigator !== "undefined" && navigator.language.startsWith("ja")
      ? "ja"
      : "en";

  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [stats, setStats] = useState<PersonalStats>({
    stroopBest: null,
    stroopRank: null,
  });

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  // Fetch personal bests on mount (only if logged in)
  useEffect(() => {
    if (!user?.id) return;

    async function fetchStats() {
      try {
        const [ranking, rank] = await Promise.all([
          getUserRanking(user!.id, "stroop"),
          getUserGlobalRank(user!.id, "stroop"),
        ]);
        setStats({
          stroopBest: ranking?.best_score ?? null,
          stroopRank: rank,
        });
      } catch {
        // silently fail — stats are cosmetic
      }
    }

    fetchStats();
  }, [user?.id]);

  // ── Active game screens ───────────────────────────────────────────────────
  if (activeGame === "stroop") {
    return <StroopGame onExit={() => setActiveGame(null)} />;
  }

  if (activeGame === "nana") {
    return <NanaGame onExit={() => setActiveGame(null)} />;
  }

  if (activeGame === "snake") {
    return <SnakeGame onExit={() => setActiveGame(null)} />;
  }
  // ── Lobby ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <p
          style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-primary)" }}
        >
          {t("Arcade", "アーケード")}
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 2 }}>
          {t(
            "Play games, set records, climb the rankings.",
            "ゲームをプレイして、記録を作り、ランキングを登れ。",
          )}
        </p>
      </div>

      {/* Game cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <ArcadeGameCard
          gameId="stroop"
          title="Stroop Challenge"
          title_ja="ストループチャレンジ"
          description="Test your reaction speed. A colored ball shows a word — answer fast and beat your best score."
          description_ja="反応速度を試せ。色のついたボールに文字が表示される — 素早く答えて自己記録を更新しよう。"
          icon="🎨"
          personalBest={stats.stroopBest}
          globalRank={stats.stroopRank}
          onPlay={() => setActiveGame("stroop")}
          lang={lang}
        />

        <ArcadeGameCard
          gameId="nana"
          title="Nana"
          title_ja="ナナ"
          description="Collect 3 trios — or trigger a Lucky 7 — to win. Play online with up to 6 players."
          description_ja="3組のトリオを集めるか、ラッキー7を発動して勝利。最大6人でオンライン対戦。"
          icon="🃏"
          personalBest={null}
          globalRank={null}
          onPlay={() => setActiveGame("nana")}
          lang={lang}
        />

        <ArcadeGameCard
          gameId="snake"
          title="Snake"
          title_ja="スネーク"
          description="Multi-player Snake — last one alive wins. Up to 4 players online."
          description_ja="マルチプレイヤー・スネーク — 最後まで生き残れ。最大4人オンライン対戦。"
          icon="🐍"
          personalBest={null}
          globalRank={null}
          onPlay={() => setActiveGame("snake")}
          lang={lang}
        />
      </div>

      {/* Guest prompt */}
      {!user && (
        <p
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {t(
            "Log in to save scores and appear on the leaderboard.",
            "ログインしてスコアを保存し、ランキングに載ろう。",
          )}
        </p>
      )}
    </div>
  );
}
