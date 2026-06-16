"use client";

import { useApp } from "@/context/AppContext";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePresence } from "@/hooks/usePresence";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import DMDrawer from "@/components/DMDrawer";

interface Contact {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function RightSidebar() {
  const {
    isLoggedIn,
    openAuthModal,
    logout,
    user,
    nanaRoomId,
    nanaInviteContact,
  } = useApp();
  const router = useRouter();
  const { isOnline } = usePresence(user?.id ?? null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dmOpen, setDmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const supabase = createClient();

  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Member";

  const avatarUrl =
    user?.user_metadata?.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  useEffect(() => {
    if (!user?.id) return;
    const fetchContacts = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .neq("id", user.id)
        .order("name");
      setContacts(data ?? []);
    };
    fetchContacts();
  }, [user?.id]);

  const getAvatar = (contact: Contact) =>
    contact.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name ?? contact.id}`;

  function handleContactClick(contactId: string) {
    setSelectedUserId(contactId);
    setDmOpen(true);
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
        {/* Profile card */}
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

        {/* Contacts card */}
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
                return (
                  <div
                    key={contact.id}
                    style={{
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
                    {/* Avatar */}
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

                    {/* Name */}
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

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      {/* DM button */}
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

                      {/* Nana invite button — only when room is active */}
                      {nanaRoomId && nanaInviteContact && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nanaInviteContact(contact.id);
                          }}
                          title="Invite to Nana / ナナに招待"
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid var(--accent)",
                            background: "rgba(139,92,246,0.12)",
                            color: "var(--accent-bright)",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(139,92,246,0.25)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(139,92,246,0.12)")
                          }
                        >
                          Nana
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* DM Drawer */}
      {user?.id && (
        <DMDrawer
          open={dmOpen}
          onClose={() => {
            setDmOpen(false);
            setSelectedUserId(null);
          }}
          initialContactId={selectedUserId}
        />
      )}
    </>
  );
}
