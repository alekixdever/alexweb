"use client";

// [MAX] PostCard.tsx
// Owner: Max | Integration
// Displays a single community post
// Used by: Feed.tsx
// Last updated: 2026-06-15

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Heart, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  event_id?: string | null;
  like_count: number;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url?: string | null;
  };
  events?: {
    title: string;
    title_ja: string;
  } | null;
  /** Whether the current user has liked this post — resolved by Feed */
  liked?: boolean;
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onLikeToggle?: (id: string, liked: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now / たった今";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({
  name,
  avatarUrl,
  size = 36,
  onClick,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  onClick?: () => void;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    cursor: onClick ? "pointer" : "default",
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onClick={onClick}
        style={{ ...baseStyle, objectFit: "cover", border: "1.5px solid var(--border)" }}
      />
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyle,
        background: "var(--accent-glow)",
        border: "1.5px solid var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.33,
        fontWeight: 700,
        color: "var(--accent-bright)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostCard({ post, onDelete, onLikeToggle }: PostCardProps) {
  const { user, isLoggedIn, openAuthModal } = useApp();
  const router = useRouter();
  const supabase = createClient();

  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [liking, setLiking] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isOwn = user?.id === post.user_id;
  const displayName = post.profiles?.name ?? "Member";

  async function handleLike() {
    if (!isLoggedIn) {
      openAuthModal("Like Post", { type: "COMMENT", eventId: post.event_id ?? "" });
      return;
    }
    if (liking) return;
    setLiking(true);

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    onLikeToggle?.(post.id, nextLiked);

    if (nextLiked) {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: user!.id });
    } else {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user!.id);
    }
    setLiking(false);
  }

  async function handleDelete() {
    if (!isOwn) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onDelete?.(post.id);
  }

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hovered ? "var(--border-glow)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "16px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-card)",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* ── Header: Avatar + Name + Time ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Avatar
          name={displayName}
          avatarUrl={post.profiles?.avatar_url}
          onClick={() => router.push(`/profile/${post.user_id}`)}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span
              onClick={() => router.push(`/profile/${post.user_id}`)}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--fg-primary)",
                cursor: "pointer",
              }}
            >
              {displayName}
            </span>
            <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* @event tag */}
          {post.events && (
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "rgba(139,92,246,0.12)",
                  color: "var(--accent-bright)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  cursor: "pointer",
                }}
                onClick={() => post.event_id && router.push(`/`)}
              >
                📅 {post.events.title} / {post.events.title_ja}
              </span>
            </div>
          )}
        </div>

        {/* Delete — own only */}
        {isOwn && (
          <button
            onClick={handleDelete}
            title="Delete / 削除"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              padding: "4px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--red)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)")}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <p
        style={{
          fontSize: 13,
          color: "var(--fg-secondary)",
          lineHeight: 1.65,
          margin: 0,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {post.content}
      </p>

      {/* ── Image (optional) ── */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="post image"
          style={{
            width: "100%",
            borderRadius: "var(--radius-sm)",
            objectFit: "cover",
            maxHeight: 320,
            border: "1px solid var(--border)",
          }}
        />
      )}

      {/* ── Footer: Like ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: -4 }}>
        <button
          onClick={handleLike}
          disabled={liking}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: liking ? "wait" : "pointer",
            color: liked ? "var(--red)" : "var(--fg-muted)",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!liked) (e.currentTarget as HTMLButtonElement).style.color = "var(--red)";
          }}
          onMouseLeave={(e) => {
            if (!liked) (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)";
          }}
        >
          <Heart
            size={14}
            fill={liked ? "var(--red)" : "none"}
            strokeWidth={liked ? 0 : 2}
          />
          <span style={{ fontWeight: liked ? 600 : 400 }}>
            {likeCount > 0 ? likeCount : ""} {liked ? "Liked / いいね済" : "Like / いいね"}
          </span>
        </button>
      </div>
    </article>
  );
}
