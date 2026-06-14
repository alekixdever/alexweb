// components/arcade/stroop/StroopProgress.tsx

interface Props {
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  lang: "en" | "ja";
}

export default function StroopProgress({
  currentRound,
  totalRounds,
  totalScore,
  lang,
}: Props) {
  const progress = ((currentRound - 1) / totalRounds) * 100;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Score + Round */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="label-xs">
          {lang === "ja" ? "スコア" : "Score"}: {totalScore.toLocaleString()}
        </span>
        <span className="label-xs">
          {currentRound}/{totalRounds}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 4,
          borderRadius: 99,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--accent)",
            borderRadius: 99,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
