// components/arcade/ArcadeGameCard.tsx
import type { GameId } from "@/types/arcade";

interface ArcadeGameCardProps {
  gameId: GameId;
  title: string;
  title_ja: string;
  description: string;
  description_ja: string;
  icon: string;
  personalBest?: number | null;
  globalRank?: number | null;
  onPlay: () => void;
  lang: "en" | "ja";
}

export default function ArcadeGameCard({
  gameId,
  title,
  title_ja,
  description,
  description_ja,
  icon,
  personalBest,
  globalRank,
  onPlay,
  lang,
}: ArcadeGameCardProps) {
  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  return (
    <div
      className="float-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "20px 20px 16px",
        borderRadius: "var(--radius)",
        cursor: "default",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--fg-primary)",
              lineHeight: 1.2,
            }}
          >
            {lang === "ja" ? title_ja : title}
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
            {lang === "ja" ? title : title_ja}
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        style={{ fontSize: 13, color: "var(--fg-secondary)", lineHeight: 1.5 }}
      >
        {lang === "ja" ? description_ja : description}
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        <div>
          <p className="label-xs">{t("Personal Best", "自己ベスト")}</p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--accent-bright)",
              marginTop: 2,
            }}
          >
            {personalBest != null
              ? personalBest.toLocaleString()
              : t("No record yet", "記録なし")}
          </p>
        </div>
        {globalRank != null && (
          <div>
            <p className="label-xs">{t("Global Rank", "世界ランク")}</p>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--accent-bright)",
                marginTop: 2,
              }}
            >
              #{globalRank}
            </p>
          </div>
        )}
      </div>

      {/* Play button */}
      <button
        className="btn-primary"
        onClick={onPlay}
        style={{ alignSelf: "flex-start", marginTop: 4 }}
      >
        {t("Play", "プレイ")}
      </button>
    </div>
  );
}
