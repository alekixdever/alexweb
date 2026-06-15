// components/NotificationBell.tsx
// [JANE] — Realtime & Presence
"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import type { Notification } from "@/hooks/useRealtimeNotifications";

const lang =
  typeof navigator !== "undefined" && navigator.language.startsWith("ja")
    ? "ja"
    : "en";

const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("Just now", "たった今");
  if (mins < 60) return t(`${mins}m ago`, `${mins}分前`);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t(`${hrs}h ago`, `${hrs}時間前`);
  const days = Math.floor(hrs / 24);
  return t(`${days}d ago`, `${days}日前`);
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const message =
    lang === "ja" ? notification.message_ja : notification.message;

  function handleClick() {
    if (!notification.read) onRead(notification.id);
    if (notification.link) window.location.href = notification.link;
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        background: notification.read ? "transparent" : "rgba(139,92,246,0.07)",
        cursor: notification.link ? "pointer" : "default",
        transition: "background 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span
          style={{ fontSize: 13, color: "var(--fg-primary)", lineHeight: 1.4 }}
        >
          {message}
        </span>
        {!notification.read && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
              marginTop: 4,
            }}
          />
        )}
      </div>
      <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
        {timeAgo(notification.created_at)}
      </span>
    </div>
  );
}

export default function NotificationBell() {
  const { user } = useApp();
  const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(
    user?.id,
  );
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (!user)
    return (
      <button
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "var(--fg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        disabled
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
    );

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "var(--fg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={t("Notifications", "通知")}
      >
        {/* Bell icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 99,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="float-card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 420,
            overflowY: "auto",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
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
              {t("Notifications", "通知")}
            </span>
            {unreadCount > 0 && (
              <span className="label-xs">
                {unreadCount} {t("unread", "未読")}
              </span>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: "24px 14px", textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                {t("No notifications yet.", "通知はまだありません。")}
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
