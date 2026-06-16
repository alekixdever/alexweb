// hooks/useRealtimeNana.ts
// [JANE] — Realtime & Presence
// Nana online multiplayer — Supabase Broadcast channel
// Max players: 6 (per MESP Arcade Spec v1.0)
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NanaGameState } from "@/types/arcade";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

// ── Broadcast event types ─────────────────────────────────────────────────
// Strategy: full gameState sync on every state change (authoritative host model)
// Flip broadcast sent BEFORE state update — lets other clients animate the flip

interface BroadcastGameState {
  type: "GAME_STATE";
  payload: NanaGameState;
}

interface BroadcastFlip {
  type: "FLIP";
  payload: {
    target: FlipTarget;
    playerIndex: number;
  };
}

interface BroadcastPlayerJoined {
  type: "PLAYER_JOINED";
  payload: {
    userId: string;
    userName: string;
    playerIndex: number;
  };
}

type NanaBroadcastEvent =
  | BroadcastGameState
  | BroadcastFlip
  | BroadcastPlayerJoined;

// ── Hook interface ────────────────────────────────────────────────────────

interface UseRealtimeNanaProps {
  roomId: string;
  userId: string;
  userName: string;
  playerIndex: number;
  onGameStateUpdate: (state: NanaGameState) => void;
  onFlip?: (target: FlipTarget, fromPlayerIndex: number) => void;
  onPlayerJoined?: (userId: string, userName: string, playerIndex: number) => void;
}

interface UseRealtimeNanaReturn {
  connected: boolean;
  broadcastGameState: (state: NanaGameState) => Promise<void>;
  broadcastFlip: (target: FlipTarget) => Promise<void>;
  broadcastPlayerJoined: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useRealtimeNana({
  roomId,
  userId,
  userName,
  playerIndex,
  onGameStateUpdate,
  onFlip,
  onPlayerJoined,
}: UseRealtimeNanaProps): UseRealtimeNanaReturn {
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const connectedRef = useRef(false);

  // Stable refs for callbacks — avoids channel re-subscription on re-render
  const onGameStateUpdateRef = useRef(onGameStateUpdate);
  const onFlipRef = useRef(onFlip);
  const onPlayerJoinedRef = useRef(onPlayerJoined);

  useEffect(() => {
    onGameStateUpdateRef.current = onGameStateUpdate;
  }, [onGameStateUpdate]);

  useEffect(() => {
    onFlipRef.current = onFlip;
  }, [onFlip]);

  useEffect(() => {
    onPlayerJoinedRef.current = onPlayerJoined;
  }, [onPlayerJoined]);

  // ── Subscribe ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || roomId === "none") return;

    const supabase = createClient();

    const channel = supabase.channel(`nana:room:${roomId}`, {
      config: {
        broadcast: { self: false }, // don't receive own broadcasts
      },
    });

    channel
      .on("broadcast", { event: "GAME_STATE" }, ({ payload }) => {
        const event = payload as BroadcastGameState;
        onGameStateUpdateRef.current(event.payload);
      })
      .on("broadcast", { event: "FLIP" }, ({ payload }) => {
        const event = payload as BroadcastFlip;
        onFlipRef.current?.(event.payload.target, event.payload.playerIndex);
      })
      .on("broadcast", { event: "PLAYER_JOINED" }, ({ payload }) => {
        const event = payload as BroadcastPlayerJoined;
        onPlayerJoinedRef.current?.(
          event.payload.userId,
          event.payload.userName,
          event.payload.playerIndex,
        );
      })
      .subscribe((status) => {
        connectedRef.current = status === "SUBSCRIBED";
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      connectedRef.current = false;
    };
  }, [roomId]); // only re-subscribe when roomId changes

  // ── Broadcast helpers ───────────────────────────────────────────────────

  const broadcastGameState = useCallback(
    async (state: NanaGameState): Promise<void> => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "GAME_STATE",
        payload: { type: "GAME_STATE", payload: state } satisfies BroadcastGameState,
      });
    },
    [],
  );

  const broadcastFlip = useCallback(
    async (target: FlipTarget): Promise<void> => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "FLIP",
        payload: {
          type: "FLIP",
          payload: { target, playerIndex },
        } satisfies BroadcastFlip,
      });
    },
    [playerIndex],
  );

  const broadcastPlayerJoined = useCallback(async (): Promise<void> => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "PLAYER_JOINED",
      payload: {
        type: "PLAYER_JOINED",
        payload: { userId, userName, playerIndex },
      } satisfies BroadcastPlayerJoined,
    });
  }, [userId, userName, playerIndex]);

  return {
    get connected() {
      return connectedRef.current;
    },
    broadcastGameState,
    broadcastFlip,
    broadcastPlayerJoined,
  };
}
