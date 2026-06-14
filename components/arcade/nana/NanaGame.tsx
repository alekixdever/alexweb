// components/arcade/nana/NanaGame.tsx
"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import NanaSetup from "./NanaSetup";
import NanaCenterGrid from "./NanaCenterGrid";
import NanaPlayerHand from "./NanaPlayerHand";
import NanaTurnIndicator from "./NanaTurnIndicator";
import NanaScoreboard from "./NanaScoreboard";
import NanaResult from "./NanaResult";
import { useRealtimeNana } from "@/lib/arcade/useRealtimeNana";
import {
  setupGame,
  flipCard,
  getFlippableTargets,
} from "@/lib/arcade/nana-engine";
import type { NanaGameState } from "@/types/arcade";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

interface Props {
  onExit: () => void;
}

// Generate a simple room ID (host creates, others join — future lobby system)
function genRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function NanaGame({ onExit }: Props) {
  const { user, lang } = useApp();
  const [gameState, setGameState] = useState<NanaGameState | null>(null);
  const [roomId] = useState(() => genRoomId());
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);
  const isMyTurn = gameState
    ? gameState.currentPlayerIndex === myPlayerIndex
    : false;

  // ── Realtime ─────────────────────────────────────────────────────────────
  const { connected, peers, broadcastGameState, broadcastFlip } =
    useRealtimeNana({
      roomId,
      userId: user?.id ?? `guest_${roomId}`,
      userName: user?.user_metadata?.name ?? "Guest",
      playerIndex: myPlayerIndex,
      onGameStateUpdate: (state) => setGameState(state),
      onPlayerJoined: (presence) => {
        const me = presence.find(
          (p) => p.userId === (user?.id ?? `guest_${roomId}`),
        );
        if (me) setMyPlayerIndex(me.playerIndex);
      },
    });

  // ── Start game ────────────────────────────────────────────────────────────
  const handleStart = useCallback(
    async (names: string[], userIds: (string | null)[]) => {
      const state = setupGame(names, userIds);
      setGameState(state);
      await broadcastGameState(state);
    },
    [broadcastGameState],
  );

  // ── Flip ──────────────────────────────────────────────────────────────────
  const handleFlip = useCallback(
    async (target: FlipTarget) => {
      if (!gameState || !isMyTurn) return;
      await broadcastFlip(target);
      const next = flipCard(gameState, target);
      setGameState(next);
      await broadcastGameState(next);
    },
    [gameState, isMyTurn, broadcastFlip, broadcastGameState],
  );

  // ── Play again ────────────────────────────────────────────────────────────
  function handlePlayAgain() {
    setGameState(null);
  }

  // ── Setup screen ─────────────────────────────────────────────────────────
  if (!gameState) {
    return (
      <NanaSetup
        currentUserName={user?.user_metadata?.name}
        currentUserId={user?.id}
        lang={lang}
        onStart={handleStart}
        onExit={onExit}
      />
    );
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  if (gameState.phase === "gameOver" && gameState.winner) {
    return (
      <NanaResult
        winner={gameState.winner}
        winMethod={gameState.winMethod}
        players={gameState.players}
        currentUserId={user?.id}
        lang={lang}
        onPlayAgain={handlePlayAgain}
        onExit={onExit}
      />
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  const flippableTargets = isMyTurn ? getFlippableTargets(gameState) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Connection badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p className="label-xs">
          Room / 部屋: <strong>{roomId}</strong>
        </p>
        <span
          className="label-xs"
          style={{ color: connected ? "var(--green)" : "var(--fg-muted)" }}
        >
          {connected ? "● Online" : "○ Connecting…"}
        </span>
      </div>

      {/* Scoreboard */}
      <NanaScoreboard
        players={gameState.players}
        currentPlayerIndex={gameState.currentPlayerIndex}
        lang={lang}
      />

      {/* Turn indicator */}
      <NanaTurnIndicator
        state={gameState}
        currentUserId={user?.id}
        lang={lang}
      />

      {/* Center grid */}
      <NanaCenterGrid
        state={gameState}
        flippableTargets={flippableTargets}
        onFlip={handleFlip}
        isMyTurn={isMyTurn}
      />

      {/* All player hands */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="label-xs">{t("Hands / 手札", "手札")}</p>
        {gameState.players.map((player, pi) => (
          <NanaPlayerHand
            key={player.id}
            player={player}
            playerIndex={pi}
            isActive={gameState.currentPlayerIndex === pi}
            isMyTurn={isMyTurn}
            flippableTargets={flippableTargets}
            onFlip={handleFlip}
            currentUserId={user?.id}
          />
        ))}
      </div>

      {/* Exit */}
      <button
        className="btn-secondary"
        onClick={onExit}
        style={{ fontSize: 12, alignSelf: "flex-end" }}
      >
        {t("Quit", "やめる")}
      </button>
    </div>
  );
}
