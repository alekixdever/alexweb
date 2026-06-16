"use client";

// [MAX] Feed.tsx
// Owner: Max | Integration
// Community Feed — composes PostComposer + PostCard
// Realtime-ready: useRealtimePosts hook slot marked for [JANE]
// Last updated: 2026-06-15

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import PostCard, { Post } from "./PostCard";
import PostComposer from "./PostComposer";
import { RefreshCw } from "lucide-react";
import { useRealtimePosts } from "@/hooks/useRealtimePosts";

// ─── Hook slot ────────────────────────────────────────────────────────────────
// [JANE] Replace this with useRealtimePosts(posts, setPosts) when hook is ready.
// The hook should subscribe to `posts` table INSERT/DELETE and call setPosts.
// Signature suggestion:
//   useRealtimePosts(posts: Post[], setPosts: (posts: Post[]) => void): void

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Feed() {
  const { user } = useApp();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load posts ──────────────────────────────────────────────────────────────

  async function loadPosts(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    console.log("loadPosts called, user:", user?.id);

    const { data, error: err } = await supabase
      .from("posts")
      .select(
        "*, profiles!posts_user_id_fkey(name, avatar_url), events(title, title_ja)",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    console.log("query result:", { data, err });
    if (err) {
      setError("Failed to load feed. / フィードを読み込めませんでした。");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Resolve likes for current user
    let likedIds = new Set<string>();
    if (user?.id && data && data.length > 0) {
      const ids = data.map((p) => p.id);
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", ids);
      likedIds = new Set(
        (likesData ?? []).map((l: { post_id: string }) => l.post_id),
      );
    }

    const resolved: Post[] = (data ?? []).map((p) => ({
      ...(p as Post),
      liked: likedIds.has(p.id),
    }));

    setPosts(resolved);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadPosts();
  }, [user?.id]);

  // ── [JANE] Realtime ─────────────────────────────────────────────────────────
  // Subscribes to posts INSERT/DELETE — channel: "realtime:posts"
  useRealtimePosts(posts, setPosts);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleLikeToggle(id: string, liked: boolean) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked, like_count: p.like_count + (liked ? 1 : -1) }
          : p,
      ),
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}
    >
      {/* Composer */}
      <PostComposer onPost={handleNewPost} />

      {/* Feed header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2px",
        }}
      >
        <p className="label-xs">
          Community Feed / コミュニティフィード
          {!loading && (
            <span
              style={{ marginLeft: 8, fontWeight: 400, textTransform: "none" }}
            >
              ({posts.length} post{posts.length !== 1 ? "s" : ""})
            </span>
          )}
        </p>
        <button
          onClick={() => loadPosts(true)}
          disabled={refreshing}
          title="Refresh / 更新"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: refreshing ? "wait" : "pointer",
            color: "var(--fg-muted)",
            fontSize: 11,
            padding: "4px 6px",
            borderRadius: 6,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "var(--accent-bright)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "var(--fg-muted)")
          }
        >
          <RefreshCw
            size={12}
            style={{
              transition: "transform 0.5s",
              transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
            }}
          />
          {refreshing ? "Refreshing…" : "Refresh / 更新"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="float-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 13,
          }}
        >
          Loading… / 読み込み中…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          className="float-card"
          style={{
            padding: "20px",
            textAlign: "center",
            color: "var(--red)",
            fontSize: 13,
            border: "1px solid rgba(248,113,113,0.25)",
          }}
        >
          {error}
          <button
            onClick={() => loadPosts()}
            style={{
              display: "block",
              margin: "10px auto 0",
              background: "none",
              border: "none",
              color: "var(--accent-bright)",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Try again / もう一度
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div
          className="float-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 13,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32, opacity: 0.4 }}>📢</span>
          <p>No posts yet. Be the first!</p>
          <p style={{ fontSize: 11 }}>
            まだ投稿はありません。最初に投稿しましょう！
          </p>
        </div>
      )}

      {/* Posts list */}
      {!loading &&
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handleDelete}
            onLikeToggle={handleLikeToggle}
          />
        ))}
    </div>
  );
}
