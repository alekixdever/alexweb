// hooks/useRealtimeSnakeInvite.ts
// [JANE] — Realtime & Presence
// Snake invite system — each user listens on their own private channel
// Channel: snake:invite:{userId}
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Broadcast event type ──────────────────────────────────────────────────

export interface SnakeInvitePayload {
  roomId: string;
  fromUserId: string;
  fromUserName: string;
}

interface BroadcastSnakeInvite {
  type: "SNAKE_INVITE";
  payload: SnakeInvitePayload;
}

// ── Hook interface ────────────────────────────────────────────────────────

interface UseRealtimeSnakeInviteProps {
  /** The current logged-in user's ID — subscribes to snake:invite:{userId} */
  userId: string | undefined;
  /** Called when this user receives an invite */
  onInviteReceived: (invite: SnakeInvitePayload) => void;
}

interface UseRealtimeSnakeInviteReturn {
  /**
   * Send a Snake room invite to a target user.
   * Call from host after room is created.
   */
  broadcastSnakeInvite: (
    roomId: string,
    targetUserId: string,
    fromUserId: string,
    fromUserName: string,
  ) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useRealtimeSnakeInvite({
  userId,
  onInviteReceived,
}: UseRealtimeSnakeInviteProps): UseRealtimeSnakeInviteReturn {
  const onInviteReceivedRef = useRef(onInviteReceived);

  useEffect(() => {
    onInviteReceivedRef.current = onInviteReceived;
  }, [onInviteReceived]);

  // ── Subscribe to own invite channel ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`snake:invite:${userId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "SNAKE_INVITE" }, ({ payload }) => {
        const event = payload as BroadcastSnakeInvite;
        onInviteReceivedRef.current(event.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── Send invite to target user's channel ───────────────────────────────
  const broadcastSnakeInvite = useCallback(
    async (
      roomId: string,
      targetUserId: string,
      fromUserId: string,
      fromUserName: string,
    ): Promise<void> => {
      if (!targetUserId) return;

      const supabase = createClient();

      // Publish to the TARGET user's channel (not own)
      const targetChannel = supabase.channel(`snake:invite:${targetUserId}`, {
        config: { broadcast: { self: false } },
      });

      // Subscribe briefly to send, then clean up
      await new Promise<void>((resolve) => {
        targetChannel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await targetChannel.send({
              type: "broadcast",
              event: "SNAKE_INVITE",
              payload: {
                type: "SNAKE_INVITE",
                payload: { roomId, fromUserId, fromUserName },
              } satisfies BroadcastSnakeInvite,
            });
            await supabase.removeChannel(targetChannel);
            resolve();
          }
        });
      });
    },
    [],
  );

  return { broadcastSnakeInvite };
}
