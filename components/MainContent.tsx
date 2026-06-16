"use client";

import { useApp } from "@/context/AppContext";
import EventList from "./EventList";
import CommunityHub from "./CommunityHub";
import { useEffect, useState } from "react";
import { LayoutList, LayoutGrid, CalendarDays, Users } from "lucide-react";

interface Props {
  selectedLocation: string;
  selectedDate: string;
  selectedCategory: string;
}

export default function MainContent({
  selectedLocation,
  selectedDate,
  selectedCategory,
}: Props) {
  const { columnLayout, setColumnLayout, setRightDrawer } = useApp();
  const [activeTab, setActiveTab] = useState<"events" | "community">("events");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    },
  );

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--gap)",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{dateLabel}</p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--accent-bright)",
              letterSpacing: "0.05em",
              fontVariantNumeric: "tabular-nums",
              marginTop: 2,
            }}
          >
            {timeStr}
          </p>
        </div>

        {/* Desktop: layout toggle (events tab only) */}
        {activeTab === "events" && (
          <div
            className="hidden lg:flex"
            style={{
              gap: 2,
              padding: 3,
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {([1, 3] as const).map((col) => (
              <button
                key={col}
                onClick={() => setColumnLayout(col)}
                title={col === 1 ? "Single column" : "Three columns"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background:
                    columnLayout === col ? "var(--accent)" : "transparent",
                  color: columnLayout === col ? "#fff" : "var(--fg-muted)",
                  transition: "all 0.2s",
                }}
              >
                {col === 1 ? <LayoutList size={13} /> : <LayoutGrid size={13} />}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: contacts button */}
        <button
          className="lg:hidden"
          onClick={() => setRightDrawer(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-glass)",
            cursor: "pointer",
            color: "var(--fg-secondary)",
            flexShrink: 0,
          }}
        >
          <Users size={15} />
        </button>
      </div>

      {/* Main content tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: "var(--gap)",
          padding: "4px",
          background: "var(--bg-glass)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          flexShrink: 0,
        }}
      >
        {(
          [
            {
              id: "events",
              label: "Events",
              labelJa: "イベント",
              icon: <CalendarDays size={13} />,
            },
            {
              id: "community",
              label: "Community",
              labelJa: "コミュニティ",
              icon: <Users size={13} />,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px",
              background:
                activeTab === tab.id ? "var(--accent)" : "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: activeTab === tab.id ? "#fff" : "var(--fg-muted)",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>/ {tab.labelJa}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ overflowY: "auto", paddingBottom: 80 }}>
        {activeTab === "events" ? (
          <EventList
            selectedLocation={selectedLocation}
            selectedDate={selectedDate}
            selectedCategory={selectedCategory}
          />
        ) : (
          <CommunityHub />
        )}
      </div>
    </main>
  );
}
