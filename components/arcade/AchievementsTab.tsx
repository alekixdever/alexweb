"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACHIEVEMENT_META } from "@/lib/arcade/achievements";
import type { AchievementKey } from "@/types/arcade";

interface UserAchievement {
  user_id: string;
  achievement_key: AchievementKey;
  unlocked_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  }[];
}

const LABELS = {
  title:    { en: "Achievements",        ja: "実績" },
  subtitle: { en: "Recent unlocks",      ja: "最近の解除" },
  empty:    { en: "No achievements yet", ja: "まだ実績はありません" },
  loading:  { en: "Loading…",            ja: "読み込み中..." },
};

type Lang = "en" | "ja";

export default function AchievementsTab({ lang = "en" }: { lang?: Lang }) {
  const [items, setItems] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAchievements() {
      const { data, error } = await supabase
        .from("achievements")
        .select(`
          user_id,
          achievement_key,
          unlocked_at,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .order("unlocked_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[Jane][AchievementsTab] fetch error:", error.message);
      } else {
        setItems((data as unknown as UserAchievement[]) ?? []);
      }
      setLoading(false);
    }

    fetchAchievements();
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-muted)", fontSize: 13 }}>
        {LABELS.loading[lang]}
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!items.length) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
        <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>{LABELS.empty[lang]}</p>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-primary)", margin: 0 }}>
          {LABELS.title[lang]}
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 2 }}>
          {LABELS.subtitle[lang]}
        </p>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, idx) => {
          const meta    = ACHIEVEMENT_META[item.achievement_key];
          if (!meta) return null;
          const profile = item.profiles?.[0];

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md, 12px)",
                padding: "12px 14px",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(var(--accent-rgb,139,92,246),0.12)",
                border: "1px solid rgba(var(--accent-rgb,139,92,246),0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}>
                {meta.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--fg-primary)",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {lang === "ja" ? meta.labelJa : meta.label}
                </p>
                <p style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  margin: 0,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {lang === "ja" ? meta.descriptionJa : meta.description}
                </p>
              </div>

              {/* User */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}>
                    {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span style={{ fontSize: 12, color: "var(--fg-secondary)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.display_name ?? "—"}
                </span>
              </div>

              {/* Date */}
              <span style={{
                fontSize: 11,
                color: "var(--fg-muted)",
                flexShrink: 0,
                marginLeft: 4,
              }}>
                {new Date(item.unlocked_at).toLocaleDateString(
                  lang === "ja" ? "ja-JP" : "en-US",
                  { month: "short", day: "numeric" }
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
