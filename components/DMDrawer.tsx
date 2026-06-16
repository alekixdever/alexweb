// components/DMDrawer.tsx
// [JANE] — Realtime & Presence
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { useRealtimeDM } from "@/hooks/useRealtimeDM";
import { createClient } from "@/lib/supabase/client";
import { X, ChevronLeft, Send, Image, Check, CheckCheck } from "lucide-react";

const lang =
  typeof navigator !== "undefined" && navigator.language.startsWith("ja")
    ? "ja"
    : "en";
const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

// ── Types ─────────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ContactWithUnread extends Profile {
  unread: number;
  lastMessage: string | null;
  lastAt: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("now", "今");
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function Avatar({
  profile,
  size = 36,
}: {
  profile: Pick<Profile, "name" | "avatar_url">;
  size?: number;
}) {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--accent-glow)",
        border: "1px solid var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.3,
        fontWeight: 700,
        color: "var(--accent-bright)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── ContactList ───────────────────────────────────────────────────────────
function ContactList({
  currentUserId,
  onSelect,
  initialContactId,
}: {
  currentUserId: string;
  onSelect: (profile: Profile) => void;
  initialContactId?: string | null;
}) {
  const [contacts, setContacts] = useState<ContactWithUnread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      // Fetch all profiles except self
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .neq("id", currentUserId)
        .order("name", { ascending: true });

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Fetch unread counts + last messages for each contact
      const enriched: ContactWithUnread[] = await Promise.all(
        profiles.map(async (p) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("content, image_url, read, created_at, sender_id")
            .or(
              `and(sender_id.eq.${currentUserId},receiver_id.eq.${p.id}),` +
                `and(sender_id.eq.${p.id},receiver_id.eq.${currentUserId})`,
            )
            .order("created_at", { ascending: false })
            .limit(1);

          const last = msgs?.[0] ?? null;
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("sender_id", p.id)
            .eq("receiver_id", currentUserId)
            .eq("read", false);

          return {
            ...p,
            unread: count ?? 0,
            lastMessage: last?.content ?? (last?.image_url ? "📷" : null),
            lastAt: last?.created_at ?? null,
          };
        }),
      );

      // Sort: contacts with messages first, then by lastAt
      enriched.sort((a, b) => {
        if (!a.lastAt && !b.lastAt) return 0;
        if (!a.lastAt) return 1;
        if (!b.lastAt) return -1;
        return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
      });

      setContacts(enriched);
      setLoading(false);

      // Auto-select if initialContactId provided
      if (initialContactId) {
        const target = enriched.find((c) => c.id === initialContactId);
        if (target) onSelect(target);
      }
    }

    load();
  }, [currentUserId, initialContactId]);

  if (loading) {
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: 13,
        }}
      >
        {t("Loading…", "読み込み中…")}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div
        style={{
          padding: "40px 16px",
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: 13,
        }}
      >
        {t("No members found.", "メンバーが見つかりません。")}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {contacts.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border)",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s",
            width: "100%",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-glass)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Avatar profile={c} size={38} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                }}
              >
                {c.name}
              </span>
              {c.lastAt && (
                <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                  {timeAgo(c.lastAt)}
                </span>
              )}
            </div>
            {c.lastMessage && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 2,
                }}
              >
                {c.lastMessage}
              </p>
            )}
          </div>

          {c.unread > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 99,
                background: "var(--accent)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                flexShrink: 0,
              }}
            >
              {c.unread > 9 ? "9+" : c.unread}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── ConversationView ──────────────────────────────────────────────────────
function ConversationView({
  currentUserId,
  otherUser,
  onBack,
}: {
  currentUserId: string;
  otherUser: Profile;
  onBack: () => void;
}) {
  const { messages, sendMessage, markAllRead, loading } = useRealtimeDM(
    currentUserId,
    otherUser.id,
  );
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark read on open
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() && !imageUrl.trim()) return;
    setSending(true);
    await sendMessage(text, imageUrl.trim() || undefined);
    setText("");
    setImageUrl("");
    setShowImageInput(false);
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Image upload via Supabase Storage ────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `dm/${currentUserId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: false });

    if (error) {
      console.error("[DMDrawer] image upload failed:", error.message);
      alert(
        t(
          `Image upload failed: ${error.message}`,
          `画像のアップロードに失敗しました: ${error.message}`,
        ),
      );
      return;
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setShowImageInput(true);
    // Reset file input so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            display: "flex",
            padding: 4,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <Avatar profile={otherUser} size={32} />
        <span
          style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-primary)" }}
        >
          {otherUser.name}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
              paddingTop: 32,
            }}
          >
            {t("Loading…", "読み込み中…")}
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
              paddingTop: 40,
            }}
          >
            {t(
              "No messages yet. Say hi!",
              "まだメッセージはありません。挨拶しよう！",
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  gap: 2,
                }}
              >
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="attachment"
                    style={{
                      maxWidth: 200,
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                    }}
                  />
                )}
                {msg.content && (
                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "8px 12px",
                      borderRadius: isMe
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                      background: isMe ? "var(--accent)" : "var(--bg-glass)",
                      color: isMe ? "#fff" : "var(--fg-primary)",
                      fontSize: 13,
                      lineHeight: 1.45,
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                    {timeAgo(msg.created_at)}
                  </span>
                  {isMe &&
                    (msg.read ? (
                      <CheckCheck size={11} color="var(--accent-bright)" />
                    ) : (
                      <Check size={11} color="var(--fg-muted)" />
                    ))}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image URL preview */}
      {showImageInput && imageUrl && (
        <div
          style={{
            padding: "0 16px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <img
            src={imageUrl}
            alt="preview"
            style={{
              height: 48,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
            }}
          />
          <button
            onClick={() => {
              setImageUrl("");
              setShowImageInput(false);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              fontSize: 11,
            }}
          >
            {t("Remove", "削除")}
          </button>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        {/* Image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            padding: 6,
            display: "flex",
            flexShrink: 0,
          }}
          title={t("Attach image", "画像を添付")}
        >
          <Image size={18} />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("Message…", "メッセージ…")}
          rows={1}
          style={{
            flex: 1,
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: 13,
            color: "var(--fg-primary)",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            lineHeight: 1.4,
          }}
        />

        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !imageUrl)}
          className="btn-primary"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
            opacity: sending || (!text.trim() && !imageUrl) ? 0.5 : 1,
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── DMDrawer (main export) ────────────────────────────────────────────────
interface DMDrawerProps {
  open: boolean;
  onClose: () => void;
  initialContactId?: string | null; // optional: open directly into a conversation
}

export default function DMDrawer({
  open,
  onClose,
  initialContactId,
}: DMDrawerProps) {
  const { user } = useApp();
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) setSelectedContact(null);
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(360px, 100vw)",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--fg-primary)",
            }}
          >
            {t("Messages", "メッセージ")}
          </p>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!user ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            {t(
              "Log in to send messages.",
              "メッセージを送るにはログインしてください。",
            )}
          </div>
        ) : selectedContact ? (
          <ConversationView
            currentUserId={user.id}
            otherUser={selectedContact}
            onBack={() => setSelectedContact(null)}
          />
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <ContactList
              currentUserId={user.id}
              onSelect={setSelectedContact}
              initialContactId={initialContactId}
            />
          </div>
        )}
      </div>
    </>
  );
}
