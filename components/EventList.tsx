"use client";

import { events } from "@/data/events";
import { locations } from "@/data/locations";
import { useApp } from "@/context/AppContext";
import EventCard from "./EventCard";
import EmptyState from "./EmptyState";
import { MapPin } from "lucide-react";

interface Props {
  selectedLocation: string;
  selectedDate: string;
  selectedCategory: string;
}

export default function EventList({
  selectedLocation,
  selectedDate,
  selectedCategory,
}: Props) {
  const { columnLayout } = useApp();
  const isAll = selectedLocation === "all";

  // Filter by date, optionally by location
  const filtered = events
    .filter((e) => {
      const dateStr = e.date.toISOString().split("T")[0];
      const matchDate = dateStr === selectedDate;
      const matchLocation = isAll ? true : e.locationId === selectedLocation;
      return matchDate && matchLocation;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (filtered.length === 0) {
    return (
      <EmptyState message="Try selecting a different date or venue. / 他の日付や会場をお試しください。" />
    );
  }

  // Group by location when All Venues
  if (isAll) {
    const grouped = locations
      .map((loc) => ({
        location: loc,
        events: filtered.filter((e) => e.locationId === loc.id),
      }))
      .filter((g) => g.events.length > 0);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          paddingBottom: 16,
        }}
      >
        {grouped.map(({ location, events: locEvents }) => (
          <div key={location.id}>
            {/* Location header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                padding: "8px 12px",
                background: location.colorBg,
                border: `1px solid ${location.color}30`,
                borderLeft: `3px solid ${location.color}`,
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: `${location.color}20`,
                  border: `1px solid ${location.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={13} style={{ color: location.color }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: location.color,
                    lineHeight: 1.2,
                  }}
                >
                  {location.name}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--fg-muted)",
                    lineHeight: 1.2,
                  }}
                >
                  {location.nameJa} · {location.region} · {locEvents.length}{" "}
                  {locEvents.length === 1 ? "event" : "events"}
                </p>
              </div>
            </div>

            {/* Events grid */}
            <div
              style={{
                display: columnLayout === 3 ? "grid" : "flex",
                flexDirection: columnLayout === 3 ? undefined : "column",
                gridTemplateColumns:
                  columnLayout === 3 ? "repeat(3, 1fr)" : undefined,
                gap: "var(--gap)",
              }}
            >
              {locEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact={columnLayout === 3}
                  locationColor={location.color}
                  locationColorBg={location.colorBg}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single location view
  const loc = locations.find((l) => l.id === selectedLocation);
  return (
    <div
      style={{
        display: columnLayout === 3 ? "grid" : "flex",
        flexDirection: columnLayout === 3 ? undefined : "column",
        gridTemplateColumns: columnLayout === 3 ? "repeat(3, 1fr)" : undefined,
        gap: "var(--gap)",
        paddingBottom: 16,
      }}
    >
      {filtered.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          compact={columnLayout === 3}
          locationColor={loc?.color}
          locationColorBg={loc?.colorBg}
        />
      ))}
    </div>
  );
}
