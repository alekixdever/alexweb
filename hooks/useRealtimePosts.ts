// hooks/useRealtimePosts.ts
// [JANE] Owner: Jane | Realtime & Presence
// Subscribes to `posts` table INSERT/DELETE via Supabase Realtime
// Called by: Feed.tsx (Max's file)
// Last updated: 2026-06-15

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Post } from "@/components/PostCard"

export function useRealtimePosts(
  posts: Post[],
  setPosts: (posts: Post[]) => void
): void {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("realtime:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newRow = payload.new as Post

          // Avoid duplicates (e.g. optimistic insert already in state)
          if (posts.some((p) => p.id === newRow.id)) return

          // Fetch full row with joins (profiles + events)
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(name, avatar_url), events(title, title_ja)")
            .eq("id", newRow.id)
            .single()

          if (data) {
            setPosts([{ ...(data as Post), liked: false }, ...posts])
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setPosts(posts.filter((p) => p.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [posts, setPosts])
}
