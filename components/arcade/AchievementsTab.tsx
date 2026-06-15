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
  };
}

// i18n labels
const LABELS = {
  title: { en: "Achievements", ja: "実績" },
  subtitle: { en: "Recent unlocks", ja: "最近の解除" },
  empty: { en: "No achievements yet", ja: "まだ実績はありません" },
  loading: { en: "Loading…", ja: "読み込み中…" },
  unlocked_at: { en: "Unlocked", ja: "解除日" },
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
        .select(
          `
          user_id,
          achievement_key,
          unlocked_at,
          profiles (
            display_name,
            avatar_url
          )
        `,
        )
        .order("unlocked_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[Eric][AchievementsTab] fetch error:", error.message);
      } else {
        setItems((data as UserAchievement[]) ?? []);
      }
      setLoading(false);
    }

    fetchAchievements();
  }, []);

  if (loading)
    return <p className="text-center text-muted">{LABELS.loading[lang]}</p>;
  if (!items.length)
    return <p className="text-center text-muted">{LABELS.empty[lang]}</p>;

  return (
    <div className="achievements-tab">
      <h2 className="tab-title">{LABELS.title[lang]}</h2>
      <p className="tab-subtitle">{LABELS.subtitle[lang]}</p>

      <ul className="achievement-list">
        {items.map((item, idx) => {
          const meta = ACHIEVEMENT_META[item.achievement_key];
          if (!meta) return null;

          return (
            <li key={idx} className="achievement-row">
              <span className="achievement-icon">{meta.icon}</span>

              <div className="achievement-info">
                <span className="achievement-label">
                  {lang === "ja" ? meta.labelJa : meta.label}
                </span>
                <span className="achievement-desc">
                  {lang === "ja" ? meta.descriptionJa : meta.description}
                </span>
              </div>

              <div className="achievement-user">
                {item.profiles?.avatar_url && (
                  <img
                    src={item.profiles.avatar_url}
                    alt={item.profiles.display_name}
                    className="achievement-avatar"
                  />
                )}
                <span className="achievement-username">
                  {item.profiles?.display_name ?? "—"}
                </span>
              </div>

              <span className="achievement-date">
                {new Date(item.unlocked_at).toLocaleDateString(
                  lang === "ja" ? "ja-JP" : "en-US",
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
