// components/arcade/nana/NanaScoreboard.tsx
import type { NanaPlayer } from "@/types/arcade";

interface Props {
  players: NanaPlayer[];
  currentPlayerIndex: number;
  lang: "en" | "ja";
}

export default function NanaScoreboard({
  players,
  currentPlayerIndex,
  lang,
}: Props) {
  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  return (
    <div
      className="float-card"
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        flexWrap: "wrap",
      }}
    >
      {players.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 99,
            background:
              i === currentPlayerIndex ? "var(--accent)" : "var(--surface-3)",
            color: i === currentPlayerIndex ? "#fff" : "var(--fg-muted)",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
        >
          <span>{p.name}</span>
          <span style={{ opacity: 0.7 }}>
            {p.collectedTrios.length} {t("trio", "トリオ")}
          </span>
        </div>
      ))}
    </div>
  );
}
