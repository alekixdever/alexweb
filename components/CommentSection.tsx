"use client";

// [JANE] CommentSection.tsx
// Owner: Jane | Realtime & Presence
// Fix: [MAX] replaced setAuthModalOpen/setAuthModalAction with openAuthModal (2026-06-15)
// Fix: [MAX] pendingAction COMMENT — re-focus textarea after login if draft exists (2026-06-15)
// Uses: useRealtimeComments hook (Jane)
// Integrated by: Max → EventCard.tsx

import { useState, useRef, useEffect } from "react";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";
import { useApp } from "@/context/AppContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url?: string | null;
  };
}

interface CommentSectionProps {
  eventId: string;
  /** Optional: collapse into a toggle button when false */
  defaultOpen?: boolean;
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
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1.5px solid var(--border)",
        }}
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--accent-glow)",
        border: "1.5px solid var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--accent-bright)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommentSection({
  eventId,
  defaultOpen = false,
}: CommentSectionProps) {
  // [MAX FIX] AppContext exposes openAuthModal(action, pending), not individual setters
  const { user, isLoggedIn, openAuthModal } = useApp();
  const { comments, postComment, deleteComment } = useRealtimeComments(
    eventId,
    user?.id ?? null,
  );

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest comment when new ones arrive
  useEffect(() => {
    if (isOpen && listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  // [MAX] pendingAction COMMENT workaround:
  // AppContext only auto-executes JOIN_EVENT after login, not COMMENT.
  // If user had a draft and just logged in → open section + re-focus textarea
  // so they can send with ⌘↵ immediately (no manual re-type needed).
  useEffect(() => {
    if (isLoggedIn && draft.trim() && textareaRef.current) {
      setIsOpen(true);
      textareaRef.current.focus();
    }
  }, [isLoggedIn]);

  async function handlePost() {
    if (!isLoggedIn) {
      // [MAX FIX] Use openAuthModal with COMMENT pending action
      openAuthModal("Comment", { type: "COMMENT", eventId });
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) return;
    setIsPosting(true);
    setError(null);
    try {
      await postComment(trimmed);
      setDraft("");
    } catch {
      setError("Failed to post. / 投稿できませんでした。");
    } finally {
      setIsPosting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  }

  const count = comments?.length ?? 0;

  // ── Toggle Header ────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 12 }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          color: "var(--fg-secondary)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.03em",
        }}
      >
        <span style={{ fontSize: 14 }}>{isOpen ? "▾" : "▸"}</span>
        <span>
          {count > 0
            ? `${count} Comment${count !== 1 ? "s" : ""} / コメント`
            : "Comments / コメント"}
        </span>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div
          style={{
            marginTop: 10,
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
          }}
        >
          {/* ── Comment List ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxHeight: 320,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {(!comments || count === 0) && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--fg-muted)",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "16px 0",
                }}
              >
                No comments yet. Be the first! /
                まだコメントはありません。最初に投稿しましょう！
              </p>
            )}

            {comments?.map((c: Comment) => {
              const isOwn = c.user_id === user?.id;
              const displayName = c.profiles?.name ?? "Member";

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <Avatar
                    name={displayName}
                    avatarUrl={c.profiles?.avatar_url}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + time */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--fg-primary)",
                        }}
                      >
                        {displayName}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--fg-muted)",
                        }}
                      >
                        {timeAgo(c.created_at)}
                      </span>
                    </div>

                    {/* Content */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "var(--fg-secondary)",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {c.content}
                    </p>
                  </div>

                  {/* Delete — own comments only */}
                  {isOwn && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      title="Delete / 削除"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--fg-muted)",
                        fontSize: 12,
                        padding: "2px 4px",
                        borderRadius: 4,
                        flexShrink: 0,
                        lineHeight: 1,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color =
                          "var(--red)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.color =
                          "var(--fg-muted)")
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>

          {/* ── Composer ── */}
          <div
            style={{
              marginTop: 14,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            {/* Current user avatar */}
            {isLoggedIn && user && (
              <Avatar name={user.email ?? "Me"} avatarUrl={null} />
            )}

            <div style={{ flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLoggedIn
                    ? "Write a comment… / コメントを書く… (⌘↵ to send)"
                    : "Log in to comment / コメントするにはログインが必要です"
                }
                disabled={!isLoggedIn || isPosting}
                rows={1}
                style={{
                  width: "100%",
                  resize: "none",
                  overflow: "hidden",
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--fg-primary)",
                  fontSize: 13,
                  padding: "8px 10px",
                  outline: "none",
                  lineHeight: 1.5,
                  transition: "border-color 0.15s",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              />
              {error && (
                <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handlePost}
              disabled={isPosting || (!isLoggedIn ? false : !draft.trim())}
              className="btn-primary"
              style={{
                fontSize: 12,
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                whiteSpace: "nowrap",
                opacity: isPosting || (isLoggedIn && !draft.trim()) ? 0.5 : 1,
                cursor: isPosting ? "wait" : "pointer",
              }}
            >
              {isPosting
                ? "…"
                : isLoggedIn
                  ? "Post / 投稿"
                  : "Login / ログイン"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
