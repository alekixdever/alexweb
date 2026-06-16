// components/arcade/nana/NanaGame.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { createNanaRoom } from '@/lib/arcade/nana-rooms'
import { useRealtimeNanaInvite } from '@/hooks/useRealtimeNanaInvite'
import type { NanaInvitePayload } from '@/hooks/useRealtimeNanaInvite'
import NanaRoomLobby from './NanaRoomLobby'

interface NanaGameProps {
  userId: string
  userName?: string
  onGameEnd?: (score: number) => void
}

export default function NanaGame({ userId, userName = '', onGameEnd }: NanaGameProps) {
  const { setNanaInviteReady, clearNanaInvite } = useApp()

  const [roomId, setRoomId] = useState<string | undefined>()
  const [pendingInvitePayload, setPendingInvitePayload] = useState
    NanaInvitePayload | undefined
  >()

  const inviteFnRef = useRef<((targetUserId: string) => void) | undefined>()

  // ── Realtime invite hook (Jane) ──────────────────────────────────────────
  const { broadcastNanaInvite } = useRealtimeNanaInvite({
    userId,
    onInviteReceived: (payload: NanaInvitePayload) => {
      setPendingInvitePayload(payload)
    },
  })

  // ── 建立房間，wire-in invite fn → AppContext ──────────────────────────
  async function handleStartMultiplayer() {
    const room = await createNanaRoom(userId)
    if (!room) return

    setRoomId(room.id)

    const inviteFn = (targetUserId: string) => {
      broadcastNanaInvite(room.id, targetUserId, userId, userName)
    }

    inviteFnRef.current = inviteFn
    setNanaInviteReady(room.id, inviteFn)
  }

  // ── 房間關閉時清除 Context ────────────────────────────────────────────
  function handleRoomClose() {
    setRoomId(undefined)
    inviteFnRef.current = undefined
    clearNanaInvite()
  }

  // ── unmount 時清除 ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearNanaInvite()
    }
  }, [clearNanaInvite])

  // ── 收到邀請 → 顯示 Lobby（autoJoin）────────────────────────────────
  if (pendingInvitePayload) {
    return (
      <NanaRoomLobby
        roomId={pendingInvitePayload.roomId}
        userId={userId}
        pendingInviteRoomId={pendingInvitePayload.roomId}
        fromUserName={pendingInvitePayload.fromUserName}
        onClose={() => setPendingInvitePayload(undefined)}
      />
    )
  }

  // ── Host Lobby ────────────────────────────────────────────────────────
  if (roomId) {
    return (
      <NanaRoomLobby
        roomId={roomId}
        userId={userId}
        onClose={handleRoomClose}
      />
    )
  }

  // ── 主畫面 ───────────────────────────────────────────────────────────
  return (
    <div className="nana-game">
      <h2>Nana / ナナ</h2>
      <button onClick={handleStartMultiplayer}>
        Multiplayer / マルチプレイ
      </button>
    </div>
  )
}
