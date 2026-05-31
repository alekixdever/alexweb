"use client";

import { useApp } from "@/context/AppContext";
import { X, Sparkles } from "lucide-react";

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
        background: "rgba(5,5,10,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg-layer2)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--radius-lg)",
          padding: "32px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px var(--accent-glow)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow inside modal */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
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
          }}
        >
          <X size={13} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            margin: "0 auto 16px",
            background:
              "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px var(--accent-glow)",
            position: "relative",
          }}
        >
          <Sparkles size={24} color="#fff" />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--fg-primary)",
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Login Required
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          ログインが必要です
        </p>

        {/* Action description */}
        <div
          style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--fg-secondary)",
              lineHeight: 1.5,
            }}
          >
            Please log in to{" "}
            <span style={{ color: "var(--accent-bright)", fontWeight: 600 }}>
              {label}
            </span>
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={login}
            style={{
              padding: "12px",
              width: "100%",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 20px var(--accent-glow)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 6px 28px var(--accent-glow)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 20px var(--accent-glow)")
            }
          >
            Mock Login (Prototype)
          </button>
          <button
            onClick={closeAuthModal}
            className="btn-secondary"
            style={{ padding: "12px", width: "100%", textAlign: "center" }}
          >
            Cancel / キャンセル
          </button>
        </div>

        {pendingAction && (
          <p
            style={{
              fontSize: 11,
              color: "var(--fg-muted)",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            After login, your action will complete automatically.
          </p>
        )}
      </div>
    </div>
  );
}
