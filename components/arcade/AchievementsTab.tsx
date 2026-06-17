"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACHIEVEMENT_META } from "@/lib/arcade/achievements";
import type { AchievementKey } from "@/types/arcade";

interface UserAchievement {
  user_id: string;
  achievement_key: AchievementKey;
  created_at: string;        // ✅ DB 實際欄位（非 unlocked_at）
  profiles: {
    name: string;            // ✅ DB 實際欄位（非 display_name）
    avatar_url: string | null;
  } | null;
}

const LABELS = {
  title:    { en: "Achievements",    ja: "実績" },
  subtitle: { en: "Recent unlocks",  ja: "最近の解除" },
  empty:    { en: "No achievements yet", ja: "まだ実績はありません" },
  loading:  { en: "Loading…",        ja: "読み込み中..." },
};

type Lang = "en" | "ja";

export default function AchievementsTab({ lang = "en" }: { lang?: Lang }) {
  const [items, setItems]     = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAchievements() {
      const { data, error } = await supabase
        .from("achievements")
        .select(`
          user_id,
          achievement_key,
          created_at,
          profiles (
            name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
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

  if (loading) return (
    <p style={{ textAlign: "center", color: "var(--fg-muted)", padding: 32 }}>
      {LABELS.loading[lang]}
    </p>
  );

  if (!items.length) return (
    <p style={{ textAlign: "center", color: "var(--fg-muted)", padding: 32 }}>
      {LABELS.empty[lang]}
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      <p style={{ fontSize: 11, color: "var(--fg-muted)", padding: "0 4px 4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {LABELS.subtitle[lang]}
      </p>

      {items.map((item, idx) => {
        const meta = ACHIEVEMENT_META[item.achievement_key];
        if (!meta) return null;

        const profile = item.profiles;

        return (
          <div
            key={idx}
            className="float-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: 24, flexShrink: 0 }}>{meta.icon}</span>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-primary)", margin: 0 }}>
                {lang === "ja" ? meta.labelJa : meta.label}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-muted)", margin: "2px 0 0" }}>
                {lang === "ja" ? meta.descriptionJa : meta.description}
              </p>
            </div>

            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {profile?.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--border)" }}
                />
              )}
              <span style={{ fontSize: 11, color: "var(--fg-secondary)" }}>
                {profile?.name ?? "—"}
              </span>
            </div>

            {/* Date */}
            <span style={{ fontSize: 10, color: "var(--fg-muted)", flexShrink: 0 }}>
              {new Date(item.created_at).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
