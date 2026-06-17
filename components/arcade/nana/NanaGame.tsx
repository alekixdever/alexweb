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
  getNanaRoom,
  joinNanaRoom,
  updateNanaRoomStatus,
} from "@/lib/arcade/nana-room-db";
import type { NanaGameState } from "@/types/arcade";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

interface Props {
  onExit: () => void;
  /**
   * Set when arriving via a direct sidebar invite (2026-06-17 Max design —
   * mirrors SnakeGame.tsx's initialRoomId). When present, NanaGame skips
   * NanaRoomLobby and joins this room directly — the inviter's room was
   * already created in the background by AppContext's startGameInvite.
   *
   * Unlike Snake (which polls postgres_changes on snake_rooms.status),
   * Nana is pure-broadcast: there's no "room status" row to subscribe to
   * for the start signal. Per Max's 2026-06-17 decision, the invitee
   * instead waits for the host's first broadcastGameState — useRealtimeNana
   * subscribes as soon as `roomId` state is set (its effect only depends
   * on `roomId`, not on any "phase"), so the invitee is already listening
   * on nana:room:{roomId} well before the host calls setupGame() +
   * broadcastGameState(). No separate "waiting for start" subscription is
   * needed — gameState being null vs non-null IS the signal.
   */
  initialRoomId?: string;
}

export default function NanaGame({ onExit, initialRoomId }: Props) {
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
  const [inviteJoinError, setInviteJoinError] = useState<string | null>(null);

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

  // ── Invitee auto-join (skip NanaRoomLobby entirely) ───────────────────────
  // Waits for profileName to resolve (falls back to "Guest" if the profile
  // fetch above hasn't completed — matches NanaRoomLobby's own behavior,
  // which has the same race since it also defaults to "Guest").
  useEffect(() => {
    if (!initialRoomId || !user?.id) return;
    let cancelled = false;

    async function autoJoin() {
      const room = await getNanaRoom(initialRoomId);
      if (cancelled) return;
      if (!room) {
        setInviteJoinError(t("Room not found.", "部屋が見つかりません。"));
        return;
      }
      if (room.status !== "waiting") {
        setInviteJoinError(
          t(
            "This game has already started.",
            "このゲームはすでに開始しています。",
          ),
        );
        return;
      }

      try {
        const { playerIndex } = await joinNanaRoom(
          initialRoomId,
          user.id,
          profileName,
        );
        if (cancelled) return;
        setMyPlayerIndex(playerIndex);
        setRoomId(initialRoomId); // triggers useRealtimeNana subscription below
      } catch {
        if (cancelled) return;
        setInviteJoinError(
          t("Failed to join room.", "部屋への参加に失敗しました。"),
        );
      }
    }

    autoJoin();
    return () => {
      cancelled = true;
    };
    // profileName intentionally excluded — joining with whatever name was
    // resolved at call time is fine; we don't want to re-join if it
    // updates moments later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomId, user?.id]);

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

    // ── Invitee path: skip NanaRoomLobby, show a waiting screen until the
    //    host's first broadcastGameState arrives (see initialRoomId doc
    //    comment above for why no separate "started" signal is needed).
    if (initialRoomId) {
      if (inviteJoinError) {
        return (
          <div
            className="float-card"
            style={{ padding: 32, textAlign: "center", borderRadius: "var(--radius)" }}
          >
            <p style={{ fontSize: 13, color: "#f87171", marginBottom: 12 }}>
              {inviteJoinError}
            </p>
            <button className="btn-secondary" onClick={onExit}>
              {t("Back", "戻る")}
            </button>
          </div>
        );
      }
      return (
        <div
          className="float-card"
          style={{ padding: 32, textAlign: "center", borderRadius: "var(--radius)" }}
        >
          <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>
            {roomId
              ? t("Waiting for host to start…", "ホストの開始を待っています…")
              : t("Joining room…", "部屋に参加中…")}
          </p>
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
