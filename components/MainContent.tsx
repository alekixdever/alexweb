"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import EventList from "./EventList";
import CommunityHub from "./CommunityHub";
import {
  LayoutList,
  LayoutGrid,
  CalendarDays,
  Users,
  Search,
  X,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

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
  const { columnLayout, setColumnLayout } = useApp();
  const [activeTab, setActiveTab] = useState<"events" | "community">("events");
  const [searchQuery, setSearchQuery] = useState("");

  const isAll = selectedLocation === "all";
  const locationName = selectedLocation === "all" ? "All Venues / 全会場" : "";

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
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--fg-primary)",
            }}
          >
            {isAll ? "All Venues / 全会場" : locationName || selectedLocation}
          </h2>
          <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
            {dateLabel}
          </p>
        </div>

        {/* Notification Bell + Layout toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationBell />

          {/* Layout toggle — desktop only, events tab only */}
          {activeTab === "events" && (
            <div
              className="hidden lg:flex"
              style={{
                gap: 2,
                padding: 3,
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
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
                  {col === 1 ? (
                    <LayoutList size={13} />
                  ) : (
                    <LayoutGrid size={13} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* [MAX] Search bar — events tab only, Sprint 3 */}
      {activeTab === "events" && (
        <div
          style={{
            position: "relative",
            marginBottom: "var(--gap)",
            flexShrink: 0,
          }}
        >
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events… / イベントを検索… (title, tags)"
            style={{
              width: "100%",
              padding: "9px 32px 9px 32px",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--fg-primary)",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-muted)",
                display: "flex",
                alignItems: "center",
                padding: 2,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

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
            searchQuery={searchQuery}
          />
        ) : (
          <CommunityHub />
        )}
      </div>
    </main>
  );
}
