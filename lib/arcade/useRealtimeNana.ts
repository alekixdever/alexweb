// lib/arcade/useRealtimeNana.ts
// Supabase Realtime channel for online Nana
// Pattern follows useRealtimeParticipants.ts channel conventions

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NanaGameState } from "@/types/arcade";
import { flipCard } from "@/lib/arcade/nana-engine";
import type { FlipTarget } from "@/lib/arcade/nana-engine";

// ── Types ─────────────────────────────────────────────────────────────────

export type NanaRoomStatus = "waiting" | "playing" | "finished";

export interface NanaPresenceState {
  userId: string;
  name: string;
  playerIndex: number;
  online: boolean;
}

type NanaBroadcastEvent =
  | { type: "game_state"; payload: NanaGameState }
  | { type: "flip"; payload: { target: FlipTarget; fromPlayerIndex: number } }
  | { type: "player_ready"; payload: { userId: string; playerIndex: number } }
  | { type: "restart_vote"; payload: { userId: string } };

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseRealtimeNanaOptions {
  roomId: string;
  userId: string;
  userName: string;
  playerIndex: number;
  onGameStateUpdate: (state: NanaGameState) => void;
  onPlayerJoined: (presence: NanaPresenceState[]) => void;
}

export function useRealtimeNana({
  roomId,
  userId,
  userName,
  playerIndex,
  onGameStateUpdate,
  onPlayerJoined,
}: UseRealtimeNanaOptions) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<NanaPresenceState[]>([]);

  // ── Subscribe ────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`nana_room:${roomId}`, {
      config: { presence: { key: userId } },
    });

    // Presence: who's in the room
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState<NanaPresenceState>();
      const list = Object.values(presenceState)
        .flat()
        .map((p) => p as NanaPresenceState);
      setPeers(list);
      onPlayerJoined(list);
    });

    // Broadcast: game events
    channel.on(
      "broadcast",
      { event: "game_state" },
      ({ payload }: { payload: NanaGameState }) => {
        onGameStateUpdate(payload);
      },
    );

    channel.on(
      "broadcast",
      { event: "flip" },
      ({
        payload,
      }: {
        payload: { target: FlipTarget; fromPlayerIndex: number };
      }) => {
        // Host applies the flip and re-broadcasts full state
        // Non-host just listens for game_state updates
        // See broadcastFlip below
        void payload;
      },
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnected(true);
        await channel.track({
          userId,
          name: userName,
          playerIndex,
          online: true,
        } satisfies NanaPresenceState);
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]); // stable — only reconnect if room changes

  // ── Broadcast helpers ────────────────────────────────────────────────────

  const broadcastGameState = useCallback(async (state: NanaGameState) => {
    await channelRef.current?.send({
      type: "broadcast",
      event: "game_state",
      payload: state,
    });
  }, []);

  const broadcastFlip = useCallback(
    async (target: FlipTarget) => {
      await channelRef.current?.send({
        type: "broadcast",
        event: "flip",
        payload: { target, fromPlayerIndex: playerIndex },
      });
    },
    [playerIndex],
  );

  return { connected, peers, broadcastGameState, broadcastFlip };
}
