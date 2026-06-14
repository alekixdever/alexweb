// hooks/useRealtimeComments.ts
// Phase 5 — Realtime: Live comment feed per event
// Do NOT modify AppContext. This hook is self-contained.

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Joined from profiles
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface UseRealtimeCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  postComment: (content: string) => Promise<{ error: string | null }>;
  deleteComment: (commentId: string) => Promise<{ error: string | null }>;
}

export function useRealtimeComments(
  eventId: string,
  currentUserId: string | null,
): UseRealtimeCommentsReturn {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Initial fetch (with profile join) ─────────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, event_id, user_id, content, created_at, profiles(name, avatar_url)",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (!error && data) setComments(data as unknown as Comment[]);
    setIsLoading(false);
  }, [eventId]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;

    fetchComments();

    const channel = supabase
      .channel(`comments:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Realtime doesn't return joined columns — re-fetch that single row
          const { data } = await supabase
            .from("comments")
            .select(
              "id, event_id, user_id, content, created_at, profiles(name, avatar_url)",
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setComments((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev;
              return [...prev, data as unknown as Comment];
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchComments]);

  // ── Post comment ───────────────────────────────────────────────────────────
  const postComment = useCallback(
    async (content: string): Promise<{ error: string | null }> => {
      if (!currentUserId)
        return { error: "Login required / ログインが必要です" };
      if (!content.trim())
        return {
          error: "Comment cannot be empty / コメントを入力してください",
        };

      const { error } = await supabase.from("comments").insert({
        event_id: eventId,
        user_id: currentUserId,
        content: content.trim(),
      });

      if (error) return { error: error.message };
      return { error: null };
      // Realtime INSERT will update state automatically
    },
    [eventId, currentUserId],
  );

  // ── Delete comment (own only — RLS enforced on DB side too) ───────────────
  const deleteComment = useCallback(
    async (commentId: string): Promise<{ error: string | null }> => {
      if (!currentUserId)
        return { error: "Login required / ログインが必要です" };

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUserId);

      if (error) return { error: error.message };
      return { error: null };
      // Realtime DELETE will update state automatically
    },
    [currentUserId],
  );

  return {
    comments,
    isLoading,
    postComment,
    deleteComment,
  };
}
