// components/arcade/nana/NanaPlayerHand.tsx
import NanaCard from "./NanaCard";
import type { NanaGameState, NanaPlayer } from "@/types/arcade";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

interface Props {
  player: NanaPlayer;
  playerIndex: number;
  isActive: boolean;
  isMyTurn: boolean;
  flippableTargets: FlipTarget[];
  onFlip: (target: FlipTarget) => void;
  currentUserId?: string;
}

export default function NanaPlayerHand({
  player,
  playerIndex,
  isActive,
  isMyTurn,
  flippableTargets,
  onFlip,
  currentUserId,
}: Props) {
  const flippedIds = new Set<string>(); // currentTurn flipped tracked in parent
  const isMe = player.userId === currentUserId || player.id === currentUserId;

  const canFlipLeft =
    isMyTurn &&
    flippableTargets.some(
      (t) =>
        t.type === "hand" &&
        (t as any).playerIndex === playerIndex &&
        (t as any).side === "left",
    );
  const canFlipRight =
    isMyTurn &&
    flippableTargets.some(
      (t) =>
        t.type === "hand" &&
        (t as any).playerIndex === playerIndex &&
        (t as any).side === "right",
    );

  const hand = player.hand;

  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        border: isActive
          ? "1px solid var(--accent)"
          : "1px solid var(--border)",
        background: isActive ? "rgba(139,92,246,0.07)" : "var(--surface-2)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "all 0.2s ease",
      }}
    >
      {/* Player label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isActive ? "var(--accent-bright)" : "var(--fg-muted)",
          }}
        >
          {player.name} {isMe ? "(You / あなた)" : ""}
        </span>
        <span className="label-xs">
          {hand.length} cards · {player.collectedTrios.length} trios
        </span>
      </div>

      {/* Hand — only show endpoints */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          overflowX: "auto",
        }}
      >
        {hand.length === 0 ? (
          <span className="label-xs">Empty / 空</span>
        ) : (
          <>
            {/* Left endpoint */}
            <NanaCard
              number={hand[0].number}
              faceUp={hand[0].faceUp}
              isFlippable={canFlipLeft}
              onClick={() =>
                onFlip({ type: "hand", playerIndex, side: "left" })
              }
              size="sm"
            />

            {/* Middle cards — face-down, not tappable */}
            {hand.slice(1, -1).map((c) => (
              <NanaCard key={c.id} number={c.number} faceUp={false} size="sm" />
            ))}

            {/* Right endpoint (only if different from left) */}
            {hand.length > 1 && (
              <NanaCard
                number={hand[hand.length - 1].number}
                faceUp={hand[hand.length - 1].faceUp}
                isFlippable={canFlipRight}
                onClick={() =>
                  onFlip({ type: "hand", playerIndex, side: "right" })
                }
                size="sm"
              />
            )}
          </>
        )}
      </div>

      {/* Collected trios */}
      {player.collectedTrios.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {player.collectedTrios.map((trio, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {trio[0]} × 3
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
