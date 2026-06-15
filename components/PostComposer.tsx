"use client";

// [MAX] PostComposer.tsx
// Owner: Max | Integration
// Post creation form for Community Feed
// Used by: Feed.tsx
// Last updated: 2026-06-15

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Send, X, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Post } from "./PostCard";
import PostImageUpload from "@/components/PostImageUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostComposerProps {
  onPost: (post: Post) => void;
}

interface EventOption {
  id: string;
  title: string;
  title_ja: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostComposer({ onPost }: PostComposerProps) {
  const { user, isLoggedIn, openAuthModal } = useApp();
  const supabase = createClient();

  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taggedEvent, setTaggedEvent] = useState<EventOption | null>(null);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [postImageUrl, setPostImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  // Load events when picker opens
  useEffect(() => {
    if (!showEventPicker || events.length > 0) return;
    const load = async () => {
      setEventsLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, title, title_ja")
        .order("date", { ascending: false })
        .limit(20);
      setEvents(data ?? []);
      setEventsLoading(false);
    };
    load();
  }, [showEventPicker]);

  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Member";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handlePost() {
    if (!isLoggedIn) {
      openAuthModal("Post", { type: "COMMENT", eventId: "" });
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;

    setPosting(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("posts")
      .insert({
        user_id: user!.id,
        content: trimmed,
        image_url: postImageUrl,
        event_id: taggedEvent?.id ?? null,
      })
      .select("*, profiles(name, avatar_url), events(title, title_ja)")
      .single();

    if (err || !data) {
      setError("Failed to post. / 投稿できませんでした。");
      setPosting(false);
      return;
    }

    onPost({ ...(data as Post), liked: false });
    setContent("");
    setTaggedEvent(null);
    setPostImageUrl(null);
    setPosting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  }

  // ── Not logged in: prompt ─────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div
        className="float-card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={() => openAuthModal("Post", { type: "COMMENT", eventId: "" })}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--bg-glass)",
            border: "1.5px solid var(--border)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--fg-muted)",
          }}
        >
          Log in to post… / 投稿するにはログインが必要です
        </div>
      </div>
    );
  }

  // ── Composer ──────────────────────────────────────────────────────────────

  return (
    <div className="float-card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--accent-glow)",
            border: "1.5px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent-bright)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1 }}>
          {/* Tagged event pill */}
          {taggedEvent && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 99,
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
                marginBottom: 8,
                fontSize: 11,
                color: "var(--accent-bright)",
              }}
            >
              <CalendarDays size={11} />
              {taggedEvent.title}
              <button
                onClick={() => setTaggedEvent(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={11} />
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share something with the community… / コミュニティに投稿する… (⌘↵)"
            disabled={posting}
            rows={2}
            style={{
              width: "100%",
              resize: "none",
              overflow: "hidden",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--fg-primary)",
              fontSize: 13,
              padding: "10px 12px",
              outline: "none",
              lineHeight: 1.6,
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />

          {error && (
            <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
              {error}
            </p>
          )}

          {/* [CHRIS] Image upload — Sprint 3 */}
          <PostImageUpload
            userId={user!.id}
            value={postImageUrl}
            onChange={setPostImageUrl}
          />

          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            {/* @event tag button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowEventPicker((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: showEventPicker ? "var(--accent-bright)" : "var(--fg-muted)",
                  background: showEventPicker ? "rgba(139,92,246,0.1)" : "none",
                  border: "1px solid",
                  borderColor: showEventPicker ? "var(--accent)" : "var(--border)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <CalendarDays size={12} />
                {taggedEvent ? "Change Event" : "Tag Event / イベントをタグ"}
              </button>

              {/* Event picker dropdown */}
              {showEventPicker && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    zIndex: 100,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "var(--shadow-md)",
                    maxHeight: 240,
                    overflowY: "auto",
                    minWidth: 260,
                  }}
                >
                  {eventsLoading ? (
                    <p style={{ fontSize: 12, color: "var(--fg-muted)", padding: "12px 16px" }}>
                      Loading… / 読み込み中…
                    </p>
                  ) : events.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--fg-muted)", padding: "12px 16px" }}>
                      No events found / イベントがありません
                    </p>
                  ) : (
                    events.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setTaggedEvent(ev);
                          setShowEventPicker(false);
                        }}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <p style={{ fontSize: 12, color: "var(--fg-primary)", fontWeight: 500 }}>
                          {ev.title}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ev.title_ja}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Post button */}
            <button
              onClick={handlePost}
              disabled={posting || !content.trim()}
              className="btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                padding: "7px 16px",
                borderRadius: "var(--radius-sm)",
                opacity: posting || !content.trim() ? 0.5 : 1,
                cursor: posting ? "wait" : !content.trim() ? "default" : "pointer",
              }}
            >
              <Send size={12} />
              {posting ? "…" : "Post / 投稿"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
