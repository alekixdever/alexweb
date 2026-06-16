// components/arcade/nana/NanaGame.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { createNanaRoom } from "@/lib/arcade/nana-rooms";
import { useRealtimeNanaInvite } from "@/hooks/useRealtimeNanaInvite";
import type { NanaInvitePayload } from "@/hooks/useRealtimeNanaInvite";
import NanaRoomLobby from "./NanaRoomLobby";

interface NanaGameProps {
  userId: string;
  userName?: string;
  lang?: "en" | "ja";
  onGameEnd?: (score: number) => void;
  onExit?: () => void;
}

export default function NanaGame({
  userId,
  userName = "",
  lang = "en",
  onGameEnd,
  onExit,
}: NanaGameProps) {
  const { setNanaInviteReady, clearNanaInvite } = useApp();

  const [showLobby, setShowLobby] = useState(false);
  const [pendingInvitePayload, setPendingInvitePayload] = useState<
    NanaInvitePayload | undefined
  >();
  // 改成：
  const inviteFnRef = useRef<((targetUserId: string) => void) | undefined>(
    undefined,
  );

  // ── Realtime invite hook (Jane) ──────────────────────────────────────────
  const { broadcastNanaInvite } = useRealtimeNanaInvite({
    userId,
    onInviteReceived: (payload: NanaInvitePayload) => {
      setPendingInvitePayload(payload);
    },
  });

  // ── 建立房間後 wire-in invite fn → AppContext ─────────────────────────
  async function handleStartMultiplayer() {
    const room = await createNanaRoom(userId);
    if (!room) return;

    const inviteFn = (targetUserId: string) => {
      broadcastNanaInvite(room.id, targetUserId, userId, userName);
    };

    inviteFnRef.current = inviteFn;
    setNanaInviteReady(room.id, inviteFn);
    setShowLobby(true);
  }

  // ── Lobby 關閉時清除 Context ──────────────────────────────────────────
  function handleLobbyExit() {
    inviteFnRef.current = undefined;
    clearNanaInvite();
    setShowLobby(false);
    setPendingInvitePayload(undefined);
  }

  // ── 遊戲開始 callback ─────────────────────────────────────────────────
  function handleRoomReady(
    roomId: string,
    playerIndex: number,
    playerCount: number,
  ) {
    // TODO: 進入實際遊戲畫面
    console.log("[NanaGame] room ready", { roomId, playerIndex, playerCount });
  }

  // ── unmount 時清除 ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearNanaInvite();
    };
  }, [clearNanaInvite]);

  // ── 收到邀請 → Lobby autoJoin ─────────────────────────────────────────
  if (pendingInvitePayload) {
    return (
      <NanaRoomLobby
        userId={userId}
        userName={userName}
        lang={lang}
        pendingInviteRoomId={pendingInvitePayload.roomId}
        onRoomReady={handleRoomReady}
        onExit={handleLobbyExit}
      />
    );
  }

  // ── Host Lobby ────────────────────────────────────────────────────────
  if (showLobby) {
    return (
      <NanaRoomLobby
        userId={userId}
        userName={userName}
        lang={lang}
        onRoomReady={handleRoomReady}
        onExit={handleLobbyExit}
      />
    );
  }

  // ── 主畫面 ───────────────────────────────────────────────────────────
  return (
    <div className="nana-game">
      <h2>Nana / ナナ</h2>
      <button onClick={handleStartMultiplayer}>
        Multiplayer / マルチプレイ
      </button>
      {onExit && <button onClick={onExit}>Exit / 退出</button>}
    </div>
  );
}
