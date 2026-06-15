// hooks/useRealtimeNotifications.ts
// [JANE] — Realtime & Presence
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: "comment" | "like" | "join" | "system";
  message: string;
  message_ja: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
}

export function useRealtimeNotifications(
  userId: string | undefined,
): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
    }

    fetchNotifications();

    // ── Realtime subscription — INSERT only ───────────────────────────────
    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as Notification;
          setNotifications((prev) => {
            // Keep latest 10
            const updated = [incoming, ...prev];
            return updated.slice(0, 10);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── Mark as read ──────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAsRead };
}
