"use client";

import { useApp } from "@/context/AppContext";
import EventList from "./EventList";
import { locations } from "@/data/locations";
import { events } from "@/data/events";
import { LayoutList, LayoutGrid } from "lucide-react";

interface Props {
  selectedLocation: string;
  selectedDate: string;
}

export default function MainContent({ selectedLocation, selectedDate }: Props) {
  const { columnLayout, setColumnLayout } = useApp();
  const location = locations.find((l) => l.id === selectedLocation);

  const count = events.filter((e) => {
    const dateStr = e.date.toISOString().split("T")[0];
    return dateStr === selectedDate && e.locationId === selectedLocation;
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
        overflow: "hidden",
        minWidth: 0,
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
            Events / イベント
          </h2>
          <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
            {location?.name ?? selectedLocation} · {dateLabel}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Event count badge */}
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
            {count} {count === 1 ? "event" : "events"}
          </span>

          {/* Layout toggle — desktop only */}
          <div
            className="hidden lg:flex"
            style={{
              display: "flex",
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
                {col === 1 ? (
                  <LayoutList size={13} />
                ) : (
                  <LayoutGrid size={13} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable event list */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
        <EventList
          selectedLocation={selectedLocation}
          selectedDate={selectedDate}
        />
      </div>
    </main>
  );
}
