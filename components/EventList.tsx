"use client";

import { events } from "@/data/events";
import EventCard from "./EventCard";
import EmptyState from "./EmptyState";

interface Props {
  selectedLocation: string;
  selectedDate: string;
}

export default function EventList({ selectedLocation, selectedDate }: Props) {
  const filtered = events.filter((e) => {
    const eventDateStr = e.date.toISOString().split("T")[0];
    const matchDate = eventDateStr === selectedDate;
    const matchLocation = e.locationId === selectedLocation;
    return matchDate && matchLocation;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState message="Try selecting a different date or venue. / 他の日付や会場をお試しください。" />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {filtered.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
