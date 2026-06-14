// hooks/useRealtimeParticipants.ts
// Phase 5 — Realtime: Live participant count + join status per event
// Do NOT modify AppContext. This hook is self-contained.

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Participant {
  user_id: string;
  joined_at: string;
}

interface UseRealtimeParticipantsReturn {
  participants: Participant[];
  count: number;
  isJoined: boolean;
  isLoading: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
}

export function useRealtimeParticipants(
  eventId: string,
  currentUserId: string | null,
): UseRealtimeParticipantsReturn {
  const supabaseRef = useRef(createClient());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const fetchParticipants = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabaseRef.current
      .from("event_participants")
      .select("user_id, joined_at")
      .eq("event_id", eventId);
    if (!error && data) setParticipants(data);
    setIsLoading(false);
  }, [eventId]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;

    fetchParticipants();

    const channel = supabaseRef.current
      .channel(`event_participants:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newRow = payload.new as Participant;
          setParticipants((prev) => {
            if (prev.some((p) => p.user_id === newRow.user_id)) return prev;
            return [...prev, newRow];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const deletedRow = payload.old as Participant;
          setParticipants((prev) =>
            prev.filter((p) => p.user_id !== deletedRow.user_id),
          );
        },
      )
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [eventId, fetchParticipants]);

  // ── Join ───────────────────────────────────────────────────────────────────
  const join = useCallback(async () => {
    if (!currentUserId || !eventId) return;
    await supabaseRef.current
      .from("event_participants")
      .insert({ event_id: eventId, user_id: currentUserId });
  }, [eventId, currentUserId]);

  // ── Leave ──────────────────────────────────────────────────────────────────
  const leave = useCallback(async () => {
    if (!currentUserId || !eventId) return;
    await supabaseRef.current
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", currentUserId);
  }, [eventId, currentUserId]);

  return {
    participants,
    count: participants.length,
    isJoined:
      !!currentUserId && participants.some((p) => p.user_id === currentUserId),
    isLoading,
    join,
    leave,
  };
}
