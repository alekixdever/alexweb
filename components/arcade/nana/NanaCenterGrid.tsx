// components/arcade/nana/NanaCenterGrid.tsx
import NanaCard from "./NanaCard";
import type { NanaGameState } from "@/types/arcade";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

interface Props {
  state: NanaGameState;
  flippableTargets: FlipTarget[];
  onFlip: (target: FlipTarget) => void;
  isMyTurn: boolean;
}

export default function NanaCenterGrid({
  state,
  flippableTargets,
  onFlip,
  isMyTurn,
}: Props) {
  const flippableGridIndices = new Set(
    flippableTargets
      .filter((t) => t.type === "center")
      .map((t) => (t as { type: "center"; gridIndex: number }).gridIndex),
  );

  const flippedIds = new Set(state.currentTurn.flipsThisTurn.map((c) => c.id));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <p className="label-xs">Center / 中央</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 56px)",
          gap: 8,
        }}
      >
        {state.centerGrid.map((card, i) => {
          const isFlippable = isMyTurn && flippableGridIndices.has(i);
          const isFlipped = card ? flippedIds.has(card.id) : false;
          return (
            <div key={i} style={{ width: 56, height: 56 }}>
              {card ? (
                <NanaCard
                  number={card.number}
                  faceUp={card.faceUp}
                  isFlippable={isFlippable}
                  isFlipped={isFlipped}
                  onClick={() => onFlip({ type: "center", gridIndex: i })}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--radius-sm)",
                    border: "1px dashed var(--border)",
                    opacity: 0.3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
