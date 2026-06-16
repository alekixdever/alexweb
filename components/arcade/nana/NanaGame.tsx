// components/arcade/nana/NanaGame.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import NanaRoomLobby from "./NanaRoomLobby";
import NanaCenterGrid from "./NanaCenterGrid";
import NanaPlayerHand from "./NanaPlayerHand";
import NanaTurnIndicator from "./NanaTurnIndicator";
import NanaScoreboard from "./NanaScoreboard";
import NanaResult from "./NanaResult";
import NanaInviteToast from "./NanaInviteToast";
import { useRealtimeNana } from "@/lib/arcade/useRealtimeNana";
import { useRealtimeNanaInvite } from "@/hooks/useRealtimeNanaInvite";
import type { NanaInvitePayload } from "@/hooks/useRealtimeNanaInvite";
import {
  setupGame,
  flipCard,
  getFlippableTargets,
  commitTurnFail,
} from "@/lib/arcade/nana-engine";
import {
  getNanaRoomPlayers,
  updateNanaRoomStatus,
} from "@/lib/arcade/nana-room-db";
import type { NanaGameState } from "@/types/arcade";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

interface Props {
  onExit: () => void;
}

export default function NanaGame({ onExit }: Props) {
  const { user, registerGameInvite, unregisterGameInvite, nanaInviteSoundEnabled } =
    useApp();
  const lang =
    typeof navigator !== "undefined" && navigator.language.startsWith("ja")
      ? "ja"
      : "en";

  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);
  const [roomPlayerCount, setRoomPlayerCount] = useState(2);
  const [profileName, setProfileName] = useState("Guest");
  const [gameState, setGameState] = useState<NanaGameState | null>(null);
  const [pendingInvitePayload, setPendingInvitePayload] = useState<
    NanaInvitePayload | undefined
  >(undefined);
  const [acceptedInvite, setAcceptedInvite] = useState(false);

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  // ── Fetch profile name ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.name) setProfileName(data.name);
        });
    });
  }, [user?.id]);

  const isMyTurn = gameState
    ? gameState.currentPlayerIndex === myPlayerIndex
    : false;

  // ── Realtime game ─────────────────────────────────────────────────────────
  const { connected, broadcastGameState, broadcastFlip } = useRealtimeNana({
    roomId: roomId ?? "none",
    userId: user?.id ?? `guest_${Date.now().toString()}`,
    userName: profileName,
    playerIndex: myPlayerIndex,
    onGameStateUpdate: (state) => setGameState(state),
    onPlayerJoined: () => {},
  });

  // ── Realtime invite ───────────────────────────────────────────────────────
  const { broadcastNanaInvite } = useRealtimeNanaInvite({
    userId: user?.id,
    onInviteReceived: (payload: NanaInvitePayload) => {
      setPendingInvitePayload(payload);
    },
  });

  // ── unmount 時清除 invite context ────────────────────────────────────────
  useEffect(() => {
    return () => {
      unregisterGameInvite();
    };
  }, [unregisterGameInvite]);

  // ── Room created — register invite fn immediately ─────────────────────────
  const handleRoomCreated = useCallback(
    (rid: string) => {
      const inviteFn = (targetUserId: string) => {
        broadcastNanaInvite(rid, targetUserId, user?.id ?? "", profileName);
      };
      registerGameInvite("nana", rid, inviteFn);
    },
    [broadcastNanaInvite, profileName, registerGameInvite, user?.id],
  );

  // ── Room ready — start game ───────────────────────────────────────────────
  const handleRoomReady = useCallback(
    async (rid: string, playerIndex: number, playerCount: number) => {
      setRoomId(rid);
      setMyPlayerIndex(playerIndex);
      setRoomPlayerCount(playerCount);

      if (playerIndex !== 0) return;

      const roomPlayers = await getNanaRoomPlayers(rid);
      const names = roomPlayers
        .sort((a, b) => a.player_index - b.player_index)
        .map((p) => p.player_name);
      const userIds = roomPlayers
        .sort((a, b) => a.player_index - b.player_index)
        .map((p) => p.user_id);

      const state = setupGame(names, userIds);
      setGameState(state);
      await updateNanaRoomStatus(rid, "playing");
      await broadcastGameState(state);
    },
    [broadcastGameState],
  );

  // ── Lobby exit ────────────────────────────────────────────────────────────
  function handleLobbyExit() {
    unregisterGameInvite();
    setRoomId(null);
    setGameState(null);
    setPendingInvitePayload(undefined);
    setAcceptedInvite(false);
    onExit();
  }

  // ── Flip ──────────────────────────────────────────────────────────────────
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFlip = useCallback(
    async (target: FlipTarget) => {
      if (!gameState || !isMyTurn) return;

      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }

      await broadcastFlip(target);
      const next = flipCard(gameState, target);
      setGameState(next);
      await broadcastGameState(next);

      if (next.currentTurn.phase === "revealing") {
        revealTimerRef.current = setTimeout(async () => {
          revealTimerRef.current = null;
          const committed = commitTurnFail(next);
          setGameState(committed);
          await broadcastGameState(committed);
        }, 3000);
      }
    },
    [gameState, isMyTurn, broadcastFlip, broadcastGameState],
  );

  // ── 清除 reveal timer on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // ── Play again ────────────────────────────────────────────────────────────
  async function handlePlayAgain() {
    unregisterGameInvite();
    setGameState(null);
    setRoomId(null);
    setPendingInvitePayload(undefined);
    setAcceptedInvite(false);
  }

  // ── 收到邀請 + 已接受 → Lobby autoJoin ───────────────────────────────────
  if (pendingInvitePayload && acceptedInvite) {
    return (
      <NanaRoomLobby
        userId={user?.id ?? ""}
        userName={profileName}
        lang={lang}
        pendingInviteRoomId={pendingInvitePayload.roomId}
        onRoomCreated={handleRoomCreated}
        onRoomReady={handleRoomReady}
        onExit={handleLobbyExit}
      />
    );
  }

  // ── Room lobby（未登入 guard）────────────────────────────────────────────
  if (!roomId || !gameState) {
    if (!user?.id) {
      return (
        <div
          className="float-card"
          style={{
            padding: 32,
            textAlign: "center",
            borderRadius: "var(--radius)",
          }}
        >
          <p
            style={{
              fontSize: 15,
              color: "var(--fg-primary)",
              marginBottom: 12,
            }}
          >
            {t(
              "Log in to play Nana online.",
              "ナナをオンラインでプレイするにはログインしてください。",
            )}
          </p>
          <button className="btn-secondary" onClick={onExit}>
            {t("Back", "戻る")}
          </button>
        </div>
      );
    }

    return (
      <>
        <NanaRoomLobby
          userId={user.id}
          userName={profileName}
          lang={lang}
          onRoomCreated={handleRoomCreated}
          onRoomReady={handleRoomReady}
          onExit={onExit}
        />

        {pendingInvitePayload && (
          <NanaInviteToast
            fromUserName={pendingInvitePayload.fromUserName}
            soundEnabled={nanaInviteSoundEnabled}
            onAccept={() => setAcceptedInvite(true)}
            onDecline={() => setPendingInvitePayload(undefined)}
          />
        )}
      </>
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p className="label-xs">
          {t("Room", "部屋")}: <strong>{roomId}</strong>
        </p>
        <span
          className="label-xs"
          style={{ color: connected ? "var(--green)" : "var(--fg-muted)" }}
        >
          {connected ? "● Online" : "○ Connecting…"}
        </span>
      </div>

      <NanaScoreboard
        players={gameState.players}
        currentPlayerIndex={gameState.currentPlayerIndex}
        lang={lang}
      />

      <NanaTurnIndicator
        state={gameState}
        currentUserId={user?.id}
        lang={lang}
      />

      <NanaCenterGrid
        state={gameState}
        flippableTargets={flippableTargets}
        onFlip={handleFlip}
        isMyTurn={isMyTurn}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="label-xs">{t("Hands", "手札")}</p>
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

      {pendingInvitePayload && (
        <NanaInviteToast
          fromUserName={pendingInvitePayload.fromUserName}
          soundEnabled={nanaInviteSoundEnabled}
          onAccept={() => setAcceptedInvite(true)}
          onDecline={() => setPendingInvitePayload(undefined)}
        />
      )}

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
