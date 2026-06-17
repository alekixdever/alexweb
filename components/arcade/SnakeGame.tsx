"use client";

/**
 * SnakeGame.tsx — Multi-player Snake / マルチプレイヤー・スネーク
 * [CHRIS] owns this file.
 *
 * Architecture: HOST AUTHORITATIVE (Jane's model)
 *   - Host (playerIndex 0): runs full game loop, broadcasts GAME_STATE each tick
 *   - Non-host: sends INPUT (direction) only, renders host's GAME_STATE
 */

import { useEffect, useRef, useState, useCallback } from "react";
import SnakeLobby from "./SnakeLobby";
import { useRealtimeSnake } from "@/hooks/useRealtimeSnake";
import type { SnakeGameState, SnakeDirection } from "@/types/arcade";
import { useApp } from "@/context/AppContext";
import {
  GRID,
  TICK_START,
  tick as snakeTick,
  initGameState,
  getWinner,
} from "@/lib/arcade/snake-engine";

// ── Constants ─────────────────────────────────────────────────────────────────
const CELL       = 24;
const CANVAS_PX  = GRID * CELL; // 480px

const PLAYER_COLORS = ["#a855f7", "#22c55e", "#eab308", "#ec4899"];


// ── Root Component ────────────────────────────────────────────────────────────
interface SnakeGameProps {
  onExit?: () => void;
}

export default function SnakeGame({ onExit }: SnakeGameProps = {}) {
  const [phase, setPhase]     = useState<"lobby" | "playing" | "over">("lobby");
  const [roomId, setRoomId]   = useState("");
  const [myIndex, setMyIndex] = useState(0);
  const [playerSlots, setPlayerSlots] = useState<{ userId: string; playerIndex: number }[]>([]);
  const [winnerName, setWinnerName]   = useState<string | null>(null);
  const { user } = useApp();

  function handleEnterRoom(rid: string, pidx: number, slots: { userId: string; playerIndex: number }[]) {
    setRoomId(rid);
    setMyIndex(pidx);
    setPlayerSlots(slots);
    setPhase("playing");
  }

  function handleGameOver(wName: string | null) {
    setWinnerName(wName);
    setPhase("over");
  }

  if (phase === "lobby") return <SnakeLobby onEnterRoom={handleEnterRoom} />;
  if (phase === "playing") return (
    <GameCanvas
      roomId={roomId}
      playerIndex={myIndex}
      userId={user?.id ?? ""}
      userName={user?.user_metadata?.display_name ?? `Player ${myIndex + 1}`}
      playerSlots={playerSlots}
      onGameOver={handleGameOver}
    />
  );
  return <GameOver winner={winnerName} onReplay={() => setPhase("lobby")} onExit={onExit} />;
}

// ── Game Canvas ───────────────────────────────────────────────────────────────
interface GameCanvasProps {
  roomId: string;
  playerIndex: number;
  userId: string;
  userName: string;
  playerSlots: { userId: string; playerIndex: number }[];
  onGameOver: (winner: string | null) => void;
}

function GameCanvas({ roomId, playerIndex, userId, userName, playerSlots, onGameOver }: GameCanvasProps) {
  const isHost = playerIndex === 0;

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gsRef      = useRef<SnakeGameState | null>(null);   // host: authoritative; client: from broadcast
  const loopRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirBuf     = useRef<SnakeDirection | null>(null);
  // Host: per-player pending direction from INPUT events
  const inputBuf   = useRef<Map<string, SnakeDirection>>(new Map());

  const [countdown, setCountdown] = useState<number | null>(3);
  const [scores, setScores]       = useState<number[]>([0, 0, 0, 0]);
  const [aliveMask, setAliveMask] = useState<boolean[]>([true, true, true, true]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  const { broadcastGameState, broadcastInput, broadcastPlayerJoined, broadcastGameOver } =
    useRealtimeSnake({
      roomId,
      userId,
      userName,
      playerIndex,
      isHost,
      // Non-host: receive full game state from host
      onGameState: (state) => {
        if (isHost) return;
        gsRef.current = state;
        draw(state);
        syncUI(state);
        if (state.status === "over") {
          const winner = state.winnerIndex !== null
            ? `Player ${state.winnerIndex + 1}`
            : null;
          onGameOver(winner);
        }
      },
      // Host: receive direction inputs from non-host clients
      onInput: (uid, dir) => {
        if (!isHost) return;
        inputBuf.current.set(uid, dir);
      },
      onPlayerJoined: () => {},
      onGameOver: (_, wName) => { onGameOver(wName); },
    });

  // ── Init countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    broadcastPlayerJoined();

    if (!isHost) return; // only host runs loop

    let n = 3;
    setCountdown(n);
    const iv = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(iv);
        setCountdown(null);
        const state = initGameState(playerSlots.length > 0 ? playerSlots : [{ userId, playerIndex }]);
        gsRef.current = { ...state, status: "playing" };
        loop();
      } else {
        setCountdown(n);
      }
    }, 1000);

    return () => {
      clearInterval(iv);
      if (loopRef.current) clearTimeout(loopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Host game loop ─────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const gs = gsRef.current;
    if (!gs || gs.status !== "playing") return;
    runTick();
    loopRef.current = setTimeout(loop, gsRef.current?.tick ?? TICK_START);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runTick() {
    const gs = gsRef.current;
    if (!gs) return;

    // Host's own direction comes from dirBuf (keyboard/d-pad), merged into
    // the same inputBuf the engine consumes — host is just another player
    // from the engine's point of view.
    if (dirBuf.current) {
      inputBuf.current.set(userId, dirBuf.current);
      dirBuf.current = null;
    }

    const newState = snakeTick(gs, inputBuf.current);
    gsRef.current = newState;

    broadcastGameState(newState);
    draw(newState);
    syncUI(newState);

    if (newState.status === "over") {
      const winner = getWinner(newState);
      broadcastGameOver(
        winner?.userId ?? null,
        winner ? `Player ${winner.playerIndex + 1}` : null,
      );
      if (loopRef.current) clearTimeout(loopRef.current);
      setTimeout(
        () => onGameOver(winner ? `Player ${winner.playerIndex + 1}` : null),
        1500,
      );
    }
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function draw(gs: SnakeGameState) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    // Grid dots
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let x = 0; x < GRID; x++) for (let y = 0; y < GRID; y++) {
      ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
    }

    // Snakes
    gs.players.forEach((snake) => {
      const color = PLAYER_COLORS[snake.playerIndex] ?? "#fff";
      ctx.fillStyle = snake.alive ? color : "rgba(255,255,255,0.12)";
      ctx.shadowColor = snake.alive ? color : "transparent";
      ctx.shadowBlur  = snake.alive ? 8 : 0;
      snake.body.forEach((p, i) => {
        const size = i === 0 ? CELL - 2 : CELL - 4;
        const off  = i === 0 ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect(p.x * CELL + off, p.y * CELL + off, size, size, i === 0 ? 6 : 4);
        ctx.fill();
      });
    });
    ctx.shadowBlur = 0;

    // Food
    ctx.fillStyle = "#f97316";
    ctx.shadowColor = "#f97316";
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    ctx.arc(gs.food.x * CELL + CELL / 2, gs.food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function syncUI(gs: SnakeGameState) {
    const s = [0, 0, 0, 0];
    const a = [false, false, false, false];
    gs.players.forEach((p) => { s[p.playerIndex] = p.score; a[p.playerIndex] = p.alive; });
    setScores([...s]);
    setAliveMask([...a]);
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const MAP: Record<string, SnakeDirection> = {
      ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
      w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      W: "UP", S: "DOWN", A: "LEFT", D: "RIGHT",
    };
    const onKey = (e: KeyboardEvent) => {
      const d = MAP[e.key];
      if (!d) return;
      e.preventDefault();
      if (isHost) {
        dirBuf.current = d;
      } else {
        dirBuf.current = d;
        broadcastInput(d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHost, broadcastInput]);

  const dpad = (d: SnakeDirection) => () => {
    if (isHost) { dirBuf.current = d; }
    else { dirBuf.current = d; broadcastInput(d); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 16 }}>

      {/* Score bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {PLAYER_COLORS.map((c, i) => {
          const hasPlayer = gsRef.current?.players.some((p) => p.playerIndex === i) ?? i === playerIndex;
          if (!hasPlayer) return null;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--bg-glass)", border: `1px solid ${c}40`,
              borderRadius: "var(--radius-sm)", padding: "4px 10px",
              opacity: aliveMask[i] ? 1 : 0.35,
              transition: "opacity 0.3s",
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: c, fontWeight: 700 }}>{scores[i]}</span>
              {i === playerIndex && <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>YOU</span>}
              {!aliveMask[i] && <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>💀</span>}
            </div>
          );
        })}
      </div>

      {/* Canvas */}
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          style={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            boxShadow: "0 0 40px rgba(168,85,247,0.15)",
            display: "block",
            maxWidth: "100%",
          }}
        />
        {countdown !== null && (
          <div style={overlayStyle}>
            <span style={{ fontSize: 80, fontWeight: 900, color: "#fff", lineHeight: 1,
              textShadow: "0 0 40px var(--accent)" }}>
              {countdown}
            </span>
            <span style={{ fontSize: 14, color: "var(--fg-muted)", marginTop: 8 }}>
              {isHost ? "You are HOST / ホスト" : "Waiting for host... / ホスト待機中"}
            </span>
          </div>
        )}
      </div>

      {/* Mobile D-pad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,44px)", gridTemplateRows: "repeat(3,44px)", gap: 4 }}>
        {(["UP","LEFT","RIGHT","DOWN"] as const).map((d) => {
          const pos: Record<string, { gridColumn: number; gridRow: number }> = {
            UP:    { gridColumn: 2, gridRow: 1 },
            LEFT:  { gridColumn: 1, gridRow: 2 },
            RIGHT: { gridColumn: 3, gridRow: 2 },
            DOWN:  { gridColumn: 2, gridRow: 3 },
          };
          return (
            <button key={d} onClick={dpad(d)} style={{ ...dpadBtn, ...pos[d] }}>
              {d === "UP" ? "▲" : d === "DOWN" ? "▼" : d === "LEFT" ? "◀" : "▶"}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
        Room: <span style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>{roomId}</span>
        {" · "}Arrow keys / WASD
        {isHost && <span style={{ color: "var(--accent)", marginLeft: 6 }}>● HOST</span>}
      </p>
    </div>
  );
}

// ── Game Over screen ──────────────────────────────────────────────────────────
function GameOver({
  winner,
  onReplay,
  onExit,
}: {
  winner: string | null;
  onReplay: () => void;
  onExit?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 48, textAlign: "center" }}>
      <h2 style={{ fontSize: 36, fontWeight: 900, color: "var(--fg-primary)", margin: 0 }}>
        {winner ? "🏆 Winner! / 勝者！" : "💀 Game Over / ゲームオーバー"}
      </h2>
      {winner && (
        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{winner}</p>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onReplay} style={{
          padding: "12px 32px", background: "var(--accent)", color: "#fff",
          border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700,
          fontSize: 15, cursor: "pointer", boxShadow: "0 4px 12px var(--accent-glow)",
        }}>
          Play Again / もう一度
        </button>
        <button onClick={onExit} style={secondaryBtn}>
          Exit / 終了
        </button>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const secondaryBtn: React.CSSProperties = {
  padding: "12px 32px",
  background: "var(--bg-glass)",
  color: "var(--fg-primary)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

const overlayStyle: React.CSSProperties = {
  position: "absolute", inset: 0,
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.6)",
  borderRadius: 12,
};

const dpadBtn: React.CSSProperties = {
  width: 44, height: 44,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--bg-glass)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", cursor: "pointer",
  color: "var(--fg-secondary)", fontSize: 16,
};
