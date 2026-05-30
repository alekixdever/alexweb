"use client";

import { useApp } from "@/context/AppContext";

export default function AuthModal() {
  const {
    authModalOpen,
    authModalAction,
    pendingAction,
    closeAuthModal,
    login,
  } = useApp();

  if (!authModalOpen) return null;

  const actionLabel: Record<string, string> = {
    "Join Event": "join this event / このイベントに参加する",
    "View Participants": "view participants / 参加者を見る",
    "Leave a Comment": "leave a comment / コメントする",
    Login: "access your profile / プロフィールを見る",
  };

  const label = actionLabel[authModalAction] ?? authModalAction;

  return (
    <div
      onClick={closeAuthModal}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          borderRadius: 16,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>
          🔐
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--foreground)",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Login Required / ログインが必要です
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Please log in to{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {label}
          </span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={login}
            style={{
              padding: "11px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Mock Login (Prototype)
          </button>
          <button
            onClick={closeAuthModal}
            style={{
              padding: "11px",
              background: "transparent",
              color: "var(--muted)",
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel / キャンセル
          </button>
        </div>

        {pendingAction && (
          <p
            style={{
              fontSize: 11,
              color: "var(--muted)",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            After login, your action will be completed automatically.
          </p>
        )}
      </div>
    </div>
  );
}
