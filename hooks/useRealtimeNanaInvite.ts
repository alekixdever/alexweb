// hooks/useRealtimeNanaInvite.ts
// [JANE] — Realtime & Presence
// Nana invite system — each user listens on their own private channel
// Channel: nana:invite:{userId}
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Broadcast event type ──────────────────────────────────────────────────

export interface NanaInvitePayload {
  roomId: string;
  fromUserId: string;
  fromUserName: string;
}

interface BroadcastNanaInvite {
  type: "NANA_INVITE";
  payload: NanaInvitePayload;
}

// ── Hook interface ────────────────────────────────────────────────────────

interface UseRealtimeNanaInviteProps {
  /** The current logged-in user's ID — subscribes to nana:invite:{userId} */
  userId: string | undefined;
  /** Called when this user receives an invite */
  onInviteReceived: (invite: NanaInvitePayload) => void;
}

interface UseRealtimeNanaInviteReturn {
  /**
   * Send a Nana room invite to a target user.
   * Call from host after room is created.
   */
  broadcastNanaInvite: (
    roomId: string,
    targetUserId: string,
    fromUserId: string,
    fromUserName: string,
  ) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useRealtimeNanaInvite({
  userId,
  onInviteReceived,
}: UseRealtimeNanaInviteProps): UseRealtimeNanaInviteReturn {
  const onInviteReceivedRef = useRef(onInviteReceived);

  useEffect(() => {
    onInviteReceivedRef.current = onInviteReceived;
  }, [onInviteReceived]);

  // ── Subscribe to own invite channel ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`nana:invite:${userId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "NANA_INVITE" }, ({ payload }) => {
        const event = payload as BroadcastNanaInvite;
        onInviteReceivedRef.current(event.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── Send invite to target user's channel ───────────────────────────────
  const broadcastNanaInvite = useCallback(
    async (
      roomId: string,
      targetUserId: string,
      fromUserId: string,
      fromUserName: string,
    ): Promise<void> => {
      if (!targetUserId) return;

      const supabase = createClient();

      // Publish to the TARGET user's channel (not own)
      const targetChannel = supabase.channel(`nana:invite:${targetUserId}`, {
        config: { broadcast: { self: false } },
      });

      // Subscribe briefly to send, then clean up
      await new Promise<void>((resolve) => {
        targetChannel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await targetChannel.send({
              type: "broadcast",
              event: "NANA_INVITE",
              payload: {
                type: "NANA_INVITE",
                payload: { roomId, fromUserId, fromUserName },
              } satisfies BroadcastNanaInvite,
            });
            await supabase.removeChannel(targetChannel);
            resolve();
          }
        });
      });
    },
    [],
  );

  return { broadcastNanaInvite };
}
