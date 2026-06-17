"use client";

import { useApp } from "@/context/AppContext";
import { LogIn, LogOut, Gamepad2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePresence } from "@/hooks/usePresence";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRealtimeNanaInvite } from "@/hooks/useRealtimeNanaInvite";
import { useRealtimeSnakeInvite } from "@/hooks/useRealtimeSnakeInvite";
import { buildNanaInviteAdapter } from "@/lib/arcade/nana-invite-adapter";
import { buildSnakeInviteAdapter } from "@/lib/arcade/snake-invite-adapter";

interface Contact {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface RightSidebarProps {
  onOpenDM?: (contactId: string) => void;
  onInviteAccepted?: (gameId: "nana" | "snake", roomId: string) => void;
}

const INVITABLE_GAMES: { id: "nana" | "snake"; label: string; emoji: string }[] = [
  { id: "nana", label: "Nana", emoji: "🐱" },
  { id: "snake", label: "Snake", emoji: "🐍" },
];

export default function RightSidebar({ onOpenDM, onInviteAccepted }: RightSidebarProps = {}) {
  const {
    isLoggedIn,
    openAuthModal,
    logout,
    user,
    pendingInviteFlow,
    startGameInvite,
    cancelGameInvite,
    clearPendingInviteFlow,
  } = useApp();
  const router = useRouter();
  const { isOnline } = usePresence(user?.id ?? null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [openDropdownContactId, setOpenDropdownContactId] = useState<string | null>(null);
  const supabase = createClient();

  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Member";

  const avatarUrl =
    user?.user_metadata?.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  useEffect(() => {
    if (document.getElementById("dm-pulse-style")) return;
    const style = document.createElement("style");
    style.id = "dm-pulse-style";
    style.textContent = `@keyframes dmPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function fetchUnread() {
      const { data: unread } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", userId)
        .eq("read", false);
      const map: Record<string, number> = {};
      (unread ?? []).forEach((m: { sender_id: string }) => {
        map[m.sender_id] = (map[m.sender_id] ?? 0) + 1;
      });
      setUnreadMap(map);
    }

    const fetchContacts = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .neq("id", userId)
        .order("name");
      setContacts(data ?? []);
    };

    fetchContacts();
    fetchUnread();

    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const getAvatar = (contact: Contact) =>
    contact.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name ?? contact.id}`;

  function handleContactClick(contactId: string) {
    setUnreadMap((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
    onOpenDM?.(contactId);
  }

  const { broadcastNanaInvite } = useRealtimeNanaInvite({
    userId: user?.id,
    onInviteReceived: () => {},
  });
  const { broadcastSnakeInvite } = useRealtimeSnakeInvite({
    userId: user?.id,
    onInviteReceived: () => {},
  });

  useEffect(() => {
    if (pendingInviteFlow?.status === "opponent_joined") {
      onInviteAccepted?.(pendingInviteFlow.gameId, pendingInviteFlow.roomId);
      clearPendingInviteFlow();
    }
  }, [pendingInviteFlow, onInviteAccepted, clearPendingInviteFlow]);

  useEffect(() => {
    if (pendingInviteFlow?.status !== "error") return;
    const timer = setTimeout(() => clearPendingInviteFlow(), 4000);
    return () => clearTimeout(timer);
  }, [pendingInviteFlow?.status, clearPendingInviteFlow]);

  const handleSelectGame = useCallback(
    (gameId: "nana" | "snake", targetUserId: string) => {
      setOpenDropdownContactId(null);
      if (!user?.id) return;

      const adapter =
        gameId === "nana"
          ? buildNanaInviteAdapter({
              hostUserId: user.id,
              hostUserName: displayName,
              broadcastNanaInvite,
            })
          : buildSnakeInviteAdapter({
              hostUserId: user.id,
              hostUserName: displayName,
              broadcastSnakeInvite,
            });

      startGameInvite(gameId, targetUserId, adapter);
    },
    [user?.id, displayName, broadcastNanaInvite, broadcastSnakeInvite, startGameInvite],
  );

  function getInviteLabel(gameId: string) {
    if (gameId === "nana") return "Nana";
    if (gameId === "snake") return "Snake";
    return gameId.charAt(0).toUpperCase() + gameId.slice(1);
  }

  if (!isLoggedIn) {
    return (
      <aside
        style={{
          width: "var(--right-sidebar-width)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap)",
        }}
      >
        <div
          className="float-card"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 20px",
            gap: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              boxShadow: "0 8px 32px var(--accent-glow)",
            }}
          >
            👋
          </div>
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
                marginBottom: 6,
              }}
            >
              Join the Community
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
              }}
            >
              Log in to join events, view participants, and connect with
              members.
              <br />
              <span style={{ fontSize: 11 }}>
                ログインしてイベントに参加しましょう。
              </span>
            </p>
          </div>
          <button
            onClick={() =>
              openAuthModal("Login", { type: "JOIN_EVENT", eventId: "" })
            }
            className="btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <LogIn size={14} /> Log In / ログイン
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside
        style={{
          width: "var(--right-sidebar-width)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap)",
          overflowY: "auto",
        }}
      >
        <div className="float-card" style={{ padding: 16, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={avatarUrl}
                alt={displayName}
                onClick={() => user?.id && router.push(`/profile/${user.id}`)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "2px solid var(--accent)",
                  boxShadow: "0 0 12px var(--accent-glow)",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 1,
                  right: 1,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--green)",
                  border: "2px solid var(--bg-card)",
                  boxShadow: "0 0 6px var(--green-glow)",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                onClick={() => user?.id && router.push(`/profile/${user.id}`)}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--fg-primary)",
                  marginBottom: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {displayName}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout / ログアウト"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--fg-muted)",
                flexShrink: 0,
              }}
            >
              <LogOut size={12} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--green)" }}>● Online</p>
        </div>

        {pendingInviteFlow && (
          <div
            className="float-card"
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              border:
                pendingInviteFlow.status === "error"
                  ? "1px solid #f87171"
                  : "1px solid var(--accent)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--fg-primary)", flex: 1 }}>
              {pendingInviteFlow.status === "creating_room" &&
                "Setting up room… / 部屋を準備中…"}
              {pendingInviteFlow.status === "waiting_for_accept" &&
                "⏳ Waiting for them to accept… / 相手の応答を待っています…"}
              {pendingInviteFlow.status === "opponent_joined" &&
                "✅ Joined! Starting… / 参加しました！開始します…"}
              {pendingInviteFlow.status === "error" &&
                `⚠️ ${pendingInviteFlow.errorMessage ?? "Invite failed"}`}
            </span>
            {pendingInviteFlow.status !== "opponent_joined" &&
              pendingInviteFlow.status !== "error" && (
                <button
                  onClick={cancelGameInvite}
                  title="Cancel / キャンセル"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--fg-muted)",
                    flexShrink: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
          </div>
        )}

        <div className="float-card" style={{ padding: "14px 0", flex: 1 }}>
          <p className="label-xs" style={{ padding: "0 16px 10px" }}>
            Members / メンバー ({contacts.length})
          </p>

          {contacts.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                textAlign: "center",
                padding: "20px 16px",
              }}
            >
              No other members yet.
              <br />
              <span style={{ fontSize: 11 }}>他のメンバーはまだいません。</span>
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {contacts.map((contact) => {
                const online = isOnline(contact.id);
                const dropdownOpen = openDropdownContactId === contact.id;
                const inviteInFlightForThisContact =
                  pendingInviteFlow?.targetUserId === contact.id;

                return (
                  <div
                    key={contact.id}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 16px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-glass)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      onClick={() => handleContactClick(contact.id)}
                      style={{
                        position: "relative",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={getAvatar(contact)}
                        alt={contact.name ?? "Member"}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: online
                            ? "var(--green)"
                            : "var(--fg-muted)",
                          border: "2px solid var(--bg-card)",
                          boxShadow: online
                            ? "0 0 6px var(--green-glow)"
                            : "none",
                        }}
                      />
                    </div>

                    <div
                      onClick={() => handleContactClick(contact.id)}
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--fg-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {contact.name ?? "Member"}
                      </p>
                      {online && (
                        <p style={{ fontSize: 10, color: "var(--green)" }}>
                          ● Online
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {(unreadMap[contact.id] ?? 0) > 0 && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "var(--accent2)",
                              marginRight: 4,
                              flexShrink: 0,
                              animation: "dmPulse 1.2s ease-in-out infinite",
                            }}
                          />
                        )}
                        <button
                          onClick={() => handleContactClick(contact.id)}
                          title="Direct Message"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--fg-muted)",
                          }}
                        >
                          💬
                        </button>
                      </div>

                      {online && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inviteInFlightForThisContact) return;
                            setOpenDropdownContactId(dropdownOpen ? null : contact.id);
                          }}
                          title="Invite to game / ゲームに招待"
                          disabled={inviteInFlightForThisContact}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 7px",
                            borderRadius: 4,
                            border: "1px solid var(--accent)",
                            background: dropdownOpen
                              ? "rgba(139,92,246,0.25)"
                              : "rgba(139,92,246,0.12)",
                            color: "var(--accent-bright)",
                            cursor: inviteInFlightForThisContact ? "default" : "pointer",
                            whiteSpace: "nowrap",
                            opacity: inviteInFlightForThisContact ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {inviteInFlightForThisContact ? "⏳" : <Gamepad2 size={11} />}
                        </button>
                      )}
                    </div>

                    {dropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 16,
                          zIndex: 20,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                          padding: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          minWidth: 120,
                        }}
                      >
                        {INVITABLE_GAMES.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => handleSelectGame(game.id, contact.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 10px",
                              background: "none",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 12,
                              color: "var(--fg-primary)",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "var(--bg-glass)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "none")
                            }
                          >
                            <span>{game.emoji}</span>
                            <span>{game.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
