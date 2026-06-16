// components/arcade/nana/NanaInviteToast.tsx
"use client";

import { useEffect, useRef } from "react";

interface NanaInviteToastProps {
  fromUserName: string;
  onAccept: () => void;
  onDecline: () => void;
  soundEnabled: boolean;
}

// 短促的邀請音效（Web Audio API，無需外部檔案）
function playInviteSound() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.15, 0.3];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.12);
    });
  } catch {
    // AudioContext 不可用時靜默失敗
  }
}

export default function NanaInviteToast({
  fromUserName,
  onAccept,
  onDecline,
  soundEnabled,
}: NanaInviteToastProps) {
  const played = useRef(false);

  useEffect(() => {
    if (soundEnabled && !played.current) {
      played.current = true;
      playInviteSound();
    }
  }, [soundEnabled]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 9999,
        background: "var(--surface-2)",
        border: "1px solid var(--accent)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        minWidth: 280,
        animation: "slideUp 0.2s ease",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--fg-primary)",
            margin: 0,
          }}
        >
          🎮 Nana Invite / ナナの招待
        </p>
        <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: 0 }}>
          <span style={{ color: "var(--accent-bright)", fontWeight: 600 }}>
            {fromUserName}
          </span>{" "}
          invited you to play / が招待しています
        </p>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn-primary"
          onClick={onAccept}
          style={{ flex: 1, fontSize: 12, padding: "6px 0" }}
        >
          Accept / 参加
        </button>
        <button
          className="btn-secondary"
          onClick={onDecline}
          style={{ flex: 1, fontSize: 12, padding: "6px 0" }}
        >
          Decline / 断る
        </button>
      </div>
    </div>
  );
}
