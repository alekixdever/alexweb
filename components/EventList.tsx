"use client";

import { events } from "@/data/events";
import { useApp } from "@/context/AppContext";
import EventCard from "./EventCard";
import EmptyState from "./EmptyState";

interface Props {
  selectedLocation: string;
  selectedDate: string;
}

export default function EventList({ selectedLocation, selectedDate }: Props) {
  const { columnLayout } = useApp();

  const filtered = events.filter((e) => {
    const dateStr = e.date.toISOString().split("T")[0];
    return dateStr === selectedDate && e.locationId === selectedLocation;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState message="Try selecting a different date or venue. / 他の日付や会場をお試しください。" />
    );
  }

  const isGrid = columnLayout === 3;

  return (
    <div
      style={{
        display: isGrid ? "grid" : "flex",
        flexDirection: isGrid ? undefined : "column",
        gridTemplateColumns: isGrid ? "repeat(3, 1fr)" : undefined,
        gap: "var(--gap)",
        paddingBottom: 16,
      }}
    >
      {filtered.map((event) => (
        <EventCard key={event.id} event={event} compact={isGrid} />
      ))}
    </div>
  );
}
