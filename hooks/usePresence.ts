// hooks/usePresence.ts
// Phase 5 — Realtime: Online user status via Supabase Realtime Presence

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceState {
  user_id: string;
  online_at: string;
}

interface UsePresenceReturn {
  onlineUserIds: Set<string>;
  isOnline: (userId: string) => boolean;
}

export function usePresence(currentUserId: string | null): UsePresenceReturn {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    // Remove any existing channel with this name before creating a new one
    // This prevents "cannot add presence callbacks after subscribe()" errors
    const CHANNEL_NAME = "mesp:presence:global";
    const existing = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${CHANNEL_NAME}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: currentUserId ?? "anon" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const ids = new Set(
          Object.values(state)
            .flat()
            .map((p) => p.user_id)
            .filter(Boolean),
        );
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUserId) {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return {
    onlineUserIds,
    isOnline: (userId: string) => onlineUserIds.has(userId),
  };
}
