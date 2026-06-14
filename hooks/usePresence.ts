// hooks/usePresence.ts
// Phase 5 — Realtime: Online user status via Supabase Realtime Presence
// Do NOT modify AppContext. This hook is self-contained.
//
// Usage:
//   const { onlineUserIds, isOnline } = usePresence(user?.id ?? null)
//   isOnline("some-user-id") → true | false

import { useEffect, useState, useCallback } from "react";
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
  const supabase = createClient();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel("presence:global", {
      config: { presence: { key: currentUserId ?? "anonymous" } },
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

  const isOnline = useCallback(
    (userId: string) => onlineUserIds.has(userId),
    [onlineUserIds],
  );

  return { onlineUserIds, isOnline };
}
