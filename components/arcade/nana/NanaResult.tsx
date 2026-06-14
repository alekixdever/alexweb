// components/arcade/nana/NanaResult.tsx
import { useEffect, useState } from "react";
import {
  saveNanaSession,
  checkAndUnlockNanaAchievements,
} from "@/lib/arcade/arcade-db";
import type { NanaPlayer } from "@/types/arcade";
import type { WinMethod } from "@/types/arcade";

interface Props {
  winner: string;
  winMethod: WinMethod;
  players: NanaPlayer[];
  currentUserId?: string;
  lang: "en" | "ja";
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function NanaResult({
  winner,
  winMethod,
  players,
  currentUserId,
  lang,
  onPlayAgain,
  onExit,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  const winLabel =
    winMethod === "lucky_7"
      ? t("Lucky 7! / ラッキー7！", "ラッキー7！")
      : t("Three Trios! / スリートリオ！", "スリートリオ！");

  useEffect(() => {
    if (!currentUserId) return;

    const me = players.find((p) => p.userId === currentUserId);
    if (!me) return;

    const isWinner = me.name === winner;
    const result = isWinner ? "win" : "lose";

    async function save() {
      try {
        await saveNanaSession({ userId: currentUserId!, result });
        if (isWinner) {
          const unlocked = await checkAndUnlockNanaAchievements({
            userId: currentUserId!,
            result: "win",
            winMethod,
          });
          setNewAchievements(unlocked);
        }
        setSaved(true);
      } catch (e) {
        console.error("Failed to save Nana session:", e);
      }
    }

    save();
  }, [currentUserId]);

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
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
        {winLabel}
      </p>
      <p style={{ fontSize: 26, fontWeight: 700, color: "var(--fg-primary)" }}>
        {winner} {t("wins!", "の勝利！")}
      </p>

      {/* Final trios */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
          maxWidth: 300,
        }}
      >
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <span
              style={{
                color:
                  p.name === winner
                    ? "var(--accent-bright)"
                    : "var(--fg-muted)",
                fontWeight: p.name === winner ? 700 : 400,
              }}
            >
              {p.name}
            </span>
            <span style={{ color: "var(--fg-muted)" }}>
              {p.collectedTrios.map((t) => t[0]).join(", ") || "—"}
            </span>
          </div>
        ))}
      </div>

      {newAchievements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {newAchievements.map((key) => (
            <p key={key} style={{ fontSize: 12, color: "var(--accent)" }}>
              ⭐ {key.replace(/_/g, " ")}
            </p>
          ))}
        </div>
      )}

      {!currentUserId && (
        <p style={{ fontSize: 12, color: "var(--fg-muted)" }}>
          {t("Log in to save results / ", "")}ログインして結果を保存
        </p>
      )}
      {currentUserId && saved && (
        <p className="label-xs" style={{ color: "var(--green)" }}>
          {t("Saved ✓", "保存済み ✓")}
        </p>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-primary" onClick={onPlayAgain}>
          {t("Play Again / ", "")}もう一回
        </button>
        <button className="btn-secondary" onClick={onExit}>
          {t("Exit", "終了")}
        </button>
      </div>
    </div>
  );
}
