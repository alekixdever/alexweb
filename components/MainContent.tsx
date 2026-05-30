"use client";

import EventList from "./EventList";
import { locations } from "@/data/locations";
import { events } from "@/data/events";

interface Props {
  selectedLocation: string;
  selectedDate: string;
}

export default function MainContent({ selectedLocation, selectedDate }: Props) {
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
        overflowY: "auto",
        padding: "20px",
        minWidth: 0,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            Events / イベント
          </h2>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {location?.name ?? selectedLocation} · {dateLabel}
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 20,
            background:
              count > 0 ? "rgba(78,204,163,0.12)" : "rgba(136,136,168,0.12)",
            color: count > 0 ? "var(--green)" : "var(--muted)",
            border: `1px solid ${count > 0 ? "rgba(78,204,163,0.25)" : "rgba(136,136,168,0.2)"}`,
            alignSelf: "flex-start",
            whiteSpace: "nowrap",
          }}
        >
          {count} {count === 1 ? "event" : "events"}
        </span>
      </div>

      <EventList
        selectedLocation={selectedLocation}
        selectedDate={selectedDate}
      />
    </main>
  );
}
