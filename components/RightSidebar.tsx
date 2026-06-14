"use client";

import { useApp } from "@/context/AppContext";
import { contactList } from "@/data/users";
import { LogIn, LogOut } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { useRouter } from "next/navigation";
import { usePresence } from "@/hooks/usePresence";

export default function RightSidebar() {
  const { isLoggedIn, openAuthModal, logout, user } = useApp();
  const router = useRouter();

  // ── Presence — use shared hook, do NOT duplicate channel logic ────────────
  const { isOnline } = usePresence(user?.id ?? null);

  const displayName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Member";

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
            <AvatarUpload
              userId={user?.id ?? ""}
              currentUrl={user?.user_metadata?.avatar_url ?? null}
              displayName={displayName}
              size={44}
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
                pointerEvents: "none",
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

      <div className="float-card" style={{ padding: "14px 0", flex: 1 }}>
        <p className="label-xs" style={{ padding: "0 16px 10px" }}>
          Contacts / コンタクト
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {contactList.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-glass)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={u.avatar}
                  alt={u.name}
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
                    background: isOnline(u.id)
                      ? "var(--green)"
                      : "var(--fg-muted)",
                    border: "2px solid var(--bg-card)",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--fg-secondary)",
                }}
              >
                {u.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
