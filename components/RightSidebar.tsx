"use client";

import { useApp } from "@/context/AppContext";
import { mockUser, contactList } from "@/data/users";
import { LogIn } from "lucide-react";

export default function RightSidebar() {
  const { isLoggedIn, openAuthModal, theme } = useApp();
  const isLight = theme === "light";

  const asideStyle = {
    width: "var(--right-sidebar-width)",
    background: isLight ? "rgba(255,255,255,0.75)" : "var(--card)",
    backdropFilter: isLight ? "blur(12px)" : "none",
    WebkitBackdropFilter: isLight ? "blur(12px)" : "none",
    borderLeft: "1px solid var(--card-border)",
    boxShadow: isLight ? "-2px 0 20px var(--shadow)" : "none",
    flexShrink: 0,
    transition: "all 0.3s",
  };

  if (!isLoggedIn) {
    return (
      <aside
        style={{
          ...asideStyle,
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 32 }}>👋</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--foreground)",
            textAlign: "center",
          }}
        >
          Join the Community
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Log in to join events, view participants, and connect with other
          members. / ログインしてイベントに参加しましょう。
        </p>
        <button
          onClick={() =>
            openAuthModal("Login", { type: "JOIN_EVENT", eventId: "" })
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            width: "100%",
            justifyContent: "center",
            boxShadow: isLight ? "0 4px 12px var(--shadow)" : "none",
          }}
        >
          <LogIn size={14} /> Log In / ログイン
        </button>
      </aside>
    );
  }

  return (
    <aside style={{ ...asideStyle, padding: "16px", overflowY: "auto" }}>
      {/* Profile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          padding: "12px",
          background: isLight ? "rgba(108,92,231,0.06)" : "var(--background)",
          borderRadius: 10,
          border: isLight ? "1px solid rgba(108,92,231,0.12)" : "none",
        }}
      >
        <img
          src={mockUser.avatar}
          alt={mockUser.name}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid var(--accent)",
          }}
        />
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            {mockUser.name}
          </p>
          <p style={{ fontSize: 11, color: "var(--green)" }}>● Online</p>
        </div>
      </div>

      {/* Contacts */}
      <p
        style={{
          fontSize: 11,
          color: "var(--muted)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Contacts / コンタクト
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {contactList.map((user) => (
          <div
            key={user.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = isLight
                ? "rgba(108,92,231,0.06)"
                : "var(--background)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            <span style={{ fontSize: 13, color: "var(--foreground)" }}>
              {user.name}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "var(--green)",
              }}
            >
              ●
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
