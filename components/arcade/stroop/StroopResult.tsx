// components/arcade/stroop/StroopResult.tsx
import { useEffect, useState } from "react";
import StroopLeaderboard from "./StroopLeaderboard";
import {
  saveStroopSession,
  upsertRanking,
  checkAndUnlockStroopAchievements,
  getUserGlobalRank,
} from "@/lib/arcade/arcade-db";
import type { StroopSessionSummary } from "@/lib/arcade/stroop-engine";

interface Props {
  summary: StroopSessionSummary;
  userId?: string;
  lang: "en" | "ja";
  onPlayAgain: () => void;
}

export default function StroopResult({
  summary,
  userId,
  lang,
  onPlayAgain,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;

    async function saveAndRank() {
      setSaving(true);
      try {
        await saveStroopSession({
          userId: userId!,
          score: summary.totalScore,
          accuracy: summary.accuracy,
          avgReactionMs: summary.avgReactionMs,
          roundsPlayed: 20,
        });
        await upsertRanking({
          userId: userId!,
          gameId: "stroop",
          score: summary.totalScore,
          accuracy: summary.accuracy,
        });
        const unlocked = await checkAndUnlockStroopAchievements({
          userId: userId!,
          score: summary.totalScore,
          accuracy: summary.accuracy,
          avgReactionMs: summary.avgReactionMs,
        });
        const rank = await getUserGlobalRank(userId!, "stroop");
        setGlobalRank(rank);
        setNewAchievements(unlocked);
        setSaved(true);
      } catch (e) {
        console.error("Failed to save Stroop session:", e);
      } finally {
        setSaving(false);
      }
    }

    saveAndRank();
  }, [userId]); // run once on mount

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  return (
    <div
      className="float-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: 28,
        borderRadius: "var(--radius)",
      }}
    >
      {/* Title */}
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-primary)" }}>
        {t("Result / ", "")}結果
      </p>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          width: "100%",
          maxWidth: 320,
        }}
      >
        {[
          {
            label: t("Score", "スコア"),
            value: summary.totalScore.toLocaleString(),
          },
          { label: t("Accuracy", "正確率"), value: `${summary.accuracy}%` },
          {
            label: t("Avg Reaction", "平均反応速度"),
            value: `${summary.avgReactionMs}ms`,
          },
          {
            label: t("Global Rank", "世界ランク"),
            value: globalRank ? `#${globalRank}` : "—",
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="float-card"
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
            }}
          >
            <p className="label-xs">{label}</p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--accent-bright)",
                marginTop: 4,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Personal best badge */}
      {summary.newPersonalBest && (
        <p style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
          🏆 {t("New Personal Best!", "新記録！")}
        </p>
      )}

      {/* Achievement unlocks */}
      {newAchievements.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            width: "100%",
            maxWidth: 320,
          }}
        >
          {newAchievements.map((key) => (
            <p
              key={key}
              style={{
                fontSize: 12,
                color: "var(--accent)",
                textAlign: "center",
              }}
            >
              ⭐ {key.replace(/_/g, " ")}
            </p>
          ))}
        </div>
      )}

      {/* Save status / login prompt */}
      {!userId && (
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-muted)",
            textAlign: "center",
          }}
        >
          {t("Log in to save your results / ", "")}ログインして結果を保存
        </p>
      )}
      {userId && saving && (
        <p className="label-xs">{t("Saving…", "保存中…")}</p>
      )}
      {userId && saved && (
        <p className="label-xs" style={{ color: "var(--green)" }}>
          {t("Saved ✓", "保存済み ✓")}
        </p>
      )}

      {/* Leaderboard */}
      <StroopLeaderboard currentUserId={userId} lang={lang} />

      {/* Play again */}
      <button
        className="btn-primary"
        onClick={onPlayAgain}
        style={{ marginTop: 8 }}
      >
        {t("Play Again / ", "")}もう一回
      </button>
    </div>
  );
}
