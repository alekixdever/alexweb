// components/arcade/nana/NanaGame.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { createNanaRoom } from "@/lib/arcade/nana-rooms";
import { useRealtimeNanaInvite } from "@/hooks/useRealtimeNanaInvite";
import type { NanaInvitePayload } from "@/hooks/useRealtimeNanaInvite";
import NanaRoomLobby from "./NanaRoomLobby";
import NanaInviteToast from "./NanaInviteToast";

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
  const { setNanaInviteReady, clearNanaInvite, nanaInviteSoundEnabled } =
    useApp();

  const [showLobby, setShowLobby] = useState(false);
  const [pendingInvitePayload, setPendingInvitePayload] = useState<
    NanaInvitePayload | undefined
  >(undefined);
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

  // ── 建立房間，wire-in invite fn → AppContext ──────────────────────────
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

  // ── Lobby 關閉時清除 ──────────────────────────────────────────────────
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
    console.log("[NanaGame] room ready", { roomId, playerIndex, playerCount });
    // TODO: 進入實際遊戲畫面
  }

  // ── unmount 時清除 ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearNanaInvite();
    };
  }, [clearNanaInvite]);

  // ── 主畫面 base（所有分支共用） ───────────────────────────────────────
  const mainScreen = (
    <div className="nana-game">
      <h2>Nana / ナナ</h2>
      <button onClick={handleStartMultiplayer}>
        Multiplayer / マルチプレイ
      </button>
      {onExit && <button onClick={onExit}>Exit / 退出</button>}
    </div>
  );

  // ── 收到邀請 + 已接受 → Lobby autoJoin ───────────────────────────────
  if (pendingInvitePayload && showLobby) {
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

  // ── 收到邀請，等待用戶決定 → Toast 疊在主畫面上 ──────────────────────
  if (pendingInvitePayload) {
    return (
      <>
        {mainScreen}
        <NanaInviteToast
          fromUserName={pendingInvitePayload.fromUserName}
          soundEnabled={nanaInviteSoundEnabled}
          onAccept={() => setShowLobby(true)}
          onDecline={() => setPendingInvitePayload(undefined)}
        />
      </>
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
  return mainScreen;
}
