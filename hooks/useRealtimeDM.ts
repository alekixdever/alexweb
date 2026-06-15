// hooks/useRealtimeDM.ts
// [JANE] — Realtime & Presence
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DMMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  image_url: string | null;
  read: boolean;
  created_at: string;
}

interface UseRealtimeDMReturn {
  messages: DMMessage[];
  unreadCount: number;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loading: boolean;
}

export function useRealtimeDM(
  currentUserId: string | undefined,
  otherUserId: string | undefined,
): UseRealtimeDMReturn {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const supabase = createClient();

    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: true });

      if (!error && data) setMessages(data as DMMessage[]);
      setLoading(false);
    }

    fetchMessages();

    // ── Realtime subscription ─────────────────────────────────────────────
    const channel = supabase
      .channel(`realtime:dm:${[currentUserId, otherUserId].sort().join("_")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const incoming = payload.new as DMMessage;
          // Only append if it's from otherUserId
          if (incoming.sender_id !== otherUserId) return;
          setMessages((prev) => [...prev, incoming]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!currentUserId || !otherUserId) return;
      if (!content.trim() && !imageUrl) return;

      const supabase = createClient();

      const optimistic: DMMessage = {
        id: `optimistic_${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: content.trim() || null,
        image_url: imageUrl ?? null,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setMessages((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: content.trim() || null,
          image_url: imageUrl ?? null,
        })
        .select()
        .single();

      if (error) {
        // Rollback optimistic
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else if (data) {
        // Replace optimistic with real row
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? (data as DMMessage) : m)),
        );
      }
    },
    [currentUserId, otherUserId],
  );

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!currentUserId || !otherUserId) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", otherUserId)
      .eq("read", false);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver_id === currentUserId && m.sender_id === otherUserId
            ? { ...m, read: true }
            : m,
        ),
      );
    }
  }, [currentUserId, otherUserId]);

  const unreadCount = messages.filter(
    (m) => m.receiver_id === currentUserId && !m.read,
  ).length;

  return { messages, unreadCount, sendMessage, markAllRead, loading };
}
