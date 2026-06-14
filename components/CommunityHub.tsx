"use client";

// components/CommunityHub.tsx
// Phase 5 — Community tab skeleton
// Tabs: Feed | Arcade | Ranking | Discussion | Achievements
// Mobile: icon only | Desktop: icon + label
import ArcadeLobby from "./arcade/ArcadeLobby";
import { useState } from "react";
import { Rss, Gamepad2, Trophy, MessageSquare, Star } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type CommunityTab =
  | "feed"
  | "arcade"
  | "ranking"
  | "discussion"
  | "achievements";

interface TabConfig {
  id: CommunityTab;
  icon: React.ReactNode;
  label: string;
  label_ja: string;
}

// ── Tab config ─────────────────────────────────────────────────────────────
const TABS: TabConfig[] = [
  {
    id: "feed",
    icon: <Rss size={16} />,
    label: "Feed",
    label_ja: "フィード",
  },
  {
    id: "arcade",
    icon: <Gamepad2 size={16} />,
    label: "Arcade",
    label_ja: "アーケード",
  },
  {
    id: "ranking",
    icon: <Trophy size={16} />,
    label: "Ranking",
    label_ja: "ランキング",
  },
  {
    id: "discussion",
    icon: <MessageSquare size={16} />,
    label: "Discussion",
    label_ja: "ディスカッション",
  },
  {
    id: "achievements",
    icon: <Star size={16} />,
    label: "Achievements",
    label_ja: "実績",
  },
];

// ── Placeholder ────────────────────────────────────────────────────────────
function TabPlaceholder({ tab }: { tab: TabConfig }) {
  return (
    <div
      className="float-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "48px 24px",
        minHeight: 240,
        borderRadius: "var(--radius)",
        color: "var(--fg-muted)",
        textAlign: "center",
      }}
    >
      <div style={{ color: "var(--accent)", opacity: 0.5 }}>
        {/* Larger icon for empty state */}
        {tab.id === "feed" && <Rss size={40} />}
        {tab.id === "arcade" && <Gamepad2 size={40} />}
        {tab.id === "ranking" && <Trophy size={40} />}
        {tab.id === "discussion" && <MessageSquare size={40} />}
        {tab.id === "achievements" && <Star size={40} />}
      </div>
      <p className="label-xs" style={{ letterSpacing: "0.1em" }}>
        {tab.label} / {tab.label_ja}
      </p>
      <p style={{ fontSize: 13, color: "var(--fg-muted)", maxWidth: 240 }}>
        Coming soon / 近日公開
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CommunityHub() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div
        className="float-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 8px",
          borderRadius: "var(--radius)",
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent-bright)" : "var(--fg-muted)",
                background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              {/* Icon always visible */}
              <span style={{ display: "flex", alignItems: "center" }}>
                {tab.icon}
              </span>

              {/* Label: hidden on mobile, shown on desktop */}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {activeTab === "arcade" ? (
        <ArcadeLobby />
      ) : (
        <TabPlaceholder tab={currentTab} />
      )}
    </div>
  );
}
