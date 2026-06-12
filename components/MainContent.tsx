"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import EventList from "./EventList";
import { locations } from "@/data/locations";
import { events } from "@/data/events";
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
  const { columnLayout, setColumnLayout } = useApp();
  const [activeTab, setActiveTab] = useState<"events" | "community">("events");

  const isAll = selectedLocation === "all";
  const location = locations.find((l) => l.id === selectedLocation);

  const count = events.filter((e) => {
    const dateStr = e.date.toISOString().split("T")[0];
    const matchDate = dateStr === selectedDate;
    const matchLocation = isAll ? true : e.locationId === selectedLocation;
    return matchDate && matchLocation;
  }).length;

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
            {isAll ? "All Venues / 全会場" : location?.name}
          </h2>
          <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
            {dateLabel}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 99,
              background:
                count > 0 ? "rgba(52,211,153,0.1)" : "var(--bg-glass)",
              color: count > 0 ? "var(--green)" : "var(--fg-muted)",
              border: `1px solid ${count > 0 ? "rgba(52,211,153,0.25)" : "var(--border)"}`,
            }}
          >
            {count} {count === 1 ? "event / 件" : "events / 件"}
          </span>

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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                marginBottom: 16,
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              💬
            </div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--fg-secondary)",
                marginBottom: 8,
              }}
            >
              Community / コミュニティ
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-muted)" }}>
              Coming soon — Post area is under development.
              <br />
              <span style={{ fontSize: 11 }}>
                コミュニティ機能は開発中です。
              </span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
