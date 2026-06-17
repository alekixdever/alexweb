// hooks/useRealtimeSnake.ts
// [JANE] — Realtime & Presence
// Snake online multiplayer — Supabase Broadcast channel
// Sync model: HOST AUTHORITATIVE
//   - Host runs full game loop (positions, food, collisions) and broadcasts
//     GAME_STATE every tick (~150ms).
//   - Non-host clients only broadcast INPUT (direction changes); they never
//     mutate game state locally — they just render whatever GAME_STATE the
//     host last sent.
// Max players: 4 (per Snake spec v1.0, agreed with Chris/Max 2026-06-16)
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SnakeGameState, SnakeDirection } from "@/types/arcade";

// ── Broadcast event types ─────────────────────────────────────────────────

interface BroadcastGameState {
  type: "GAME_STATE";
  payload: SnakeGameState;
}

interface BroadcastInput {
  type: "INPUT";
  payload: {
    userId: string;
    direction: SnakeDirection;
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

interface BroadcastGameOver {
  type: "GAME_OVER";
  payload: {
    winnerUserId: string | null;
    winnerName: string | null;
  };
}

type SnakeBroadcastEvent =
  | BroadcastGameState
  | BroadcastInput
  | BroadcastPlayerJoined
  | BroadcastGameOver;

// ── Hook interface ────────────────────────────────────────────────────────

interface UseRealtimeSnakeProps {
  roomId: string;
  userId: string;
  userName: string;
  playerIndex: number;
  /** true if this client is the host (playerIndex === 0) — runs the game loop */
  isHost: boolean;
  /** Non-host clients: receive authoritative state from host */
  onGameState?: (state: SnakeGameState) => void;
  /** Host only: receive direction input from any client (including self, if sent) */
  onInput?: (userId: string, direction: SnakeDirection) => void;
  onPlayerJoined?: (userId: string, userName: string, playerIndex: number) => void;
  onGameOver?: (winnerUserId: string | null, winnerName: string | null) => void;
}

interface UseRealtimeSnakeReturn {
  connected: boolean;
  /** Host calls this every tick (~150ms) with the new authoritative state */
  broadcastGameState: (state: SnakeGameState) => Promise<void>;
  /** Any client calls this when the player changes direction */
  broadcastInput: (direction: SnakeDirection) => Promise<void>;
  broadcastPlayerJoined: () => Promise<void>;
  /** Host calls this once when the match ends */
  broadcastGameOver: (
    winnerUserId: string | null,
    winnerName: string | null,
  ) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useRealtimeSnake({
  roomId,
  userId,
  userName,
  playerIndex,
  isHost,
  onGameState,
  onInput,
  onPlayerJoined,
  onGameOver,
}: UseRealtimeSnakeProps): UseRealtimeSnakeReturn {
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const connectedRef = useRef(false);

  // Stable refs for callbacks — avoids channel re-subscription on re-render
  const onGameStateRef = useRef(onGameState);
  const onInputRef = useRef(onInput);
  const onPlayerJoinedRef = useRef(onPlayerJoined);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    onGameStateRef.current = onGameState;
  }, [onGameState]);

  useEffect(() => {
    onInputRef.current = onInput;
  }, [onInput]);

  useEffect(() => {
    onPlayerJoinedRef.current = onPlayerJoined;
  }, [onPlayerJoined]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // ── Subscribe ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || roomId === "none") return;

    const supabase = createClient();

    const channel = supabase.channel(`snake:room:${roomId}`, {
      config: {
        broadcast: { self: false }, // don't receive own broadcasts
      },
    });

    channel
      .on("broadcast", { event: "GAME_STATE" }, ({ payload }) => {
        // Only non-host clients act on this — host is authoritative and
        // should not overwrite its own freshly-computed state with a
        // (non-existent, since self:false) echo, but we guard anyway.
        if (isHost) return;
        const event = payload as BroadcastGameState;
        onGameStateRef.current?.(event.payload);
      })
      .on("broadcast", { event: "INPUT" }, ({ payload }) => {
        // Only the host consumes input events
        if (!isHost) return;
        const event = payload as BroadcastInput;
        onInputRef.current?.(event.payload.userId, event.payload.direction);
      })
      .on("broadcast", { event: "PLAYER_JOINED" }, ({ payload }) => {
        const event = payload as BroadcastPlayerJoined;
        onPlayerJoinedRef.current?.(
          event.payload.userId,
          event.payload.userName,
          event.payload.playerIndex,
        );
      })
      .on("broadcast", { event: "GAME_OVER" }, ({ payload }) => {
        const event = payload as BroadcastGameOver;
        onGameOverRef.current?.(
          event.payload.winnerUserId,
          event.payload.winnerName,
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
  }, [roomId, isHost]); // re-subscribe if roomId or host role changes

  // ── Broadcast helpers ───────────────────────────────────────────────────

  const broadcastGameState = useCallback(
    async (state: SnakeGameState): Promise<void> => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "GAME_STATE",
        payload: {
          type: "GAME_STATE",
          payload: state,
        } satisfies BroadcastGameState,
      });
    },
    [],
  );

  const broadcastInput = useCallback(
    async (direction: SnakeDirection): Promise<void> => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "INPUT",
        payload: {
          type: "INPUT",
          payload: { userId, direction },
        } satisfies BroadcastInput,
      });
    },
    [userId],
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

  const broadcastGameOver = useCallback(
    async (
      winnerUserId: string | null,
      winnerName: string | null,
    ): Promise<void> => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "GAME_OVER",
        payload: {
          type: "GAME_OVER",
          payload: { winnerUserId, winnerName },
        } satisfies BroadcastGameOver,
      });
    },
    [],
  );

  return {
    get connected() {
      return connectedRef.current;
    },
    broadcastGameState,
    broadcastInput,
    broadcastPlayerJoined,
    broadcastGameOver,
  };
}
