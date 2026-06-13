"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import EventCard from "./EventCard";
import EmptyState from "./EmptyState";
import { MapPin } from "lucide-react";

interface DBEvent {
  id: string;
  title: string;
  title_ja: string;
  description: string;
  description_ja: string;
  date: string;
  location_id: string;
  creator_id: string;
  category_id: string | null;
  image_url: string | null;
  tags: string[];
  tags_ja: string[];
  participant_count: number;
}

interface DBLocation {
  id: string;
  name: string;
  name_ja: string;
  region: string;
  color: string;
  color_bg: string;
}

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
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [locations, setLocations] = useState<DBLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const isAll = selectedLocation === "all";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch locations
      const { data: locData } = await supabase
        .from("locations")
        .select("*")
        .order("name");
      setLocations(locData ?? []);

      // Build events query
      let query = supabase
        .from("events")
        .select("*, event_participants(count)")
        .order("date");

      if (!isAll) {
        query = query.eq("location_id", selectedLocation);
      }

      if (selectedDate) {
        const start = `${selectedDate}T00:00:00`;
        const end = `${selectedDate}T23:59:59`;
        query = query.gte("date", start).lte("date", end);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data: evtData } = await query;

      // Normalize participant_count
      const normalized = (evtData ?? []).map((e) => ({
        ...e,
        participant_count: Array.isArray(e.event_participants)
          ? (e.event_participants[0]?.count ?? 0)
          : 0,
      }));

      setEvents(normalized);
      setLoading(false);
    };

    fetchData();
  }, [selectedLocation, selectedDate, selectedCategory]);

  if (loading) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 280,
              borderRadius: "var(--radius)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState message="Try selecting a different date or venue. / 他の日付や会場をお試しください。" />
    );
  }

  // All venues — group by location
  if (isAll) {
    const grouped = locations
      .map((loc) => ({
        location: loc,
        events: events.filter((e) => e.location_id === loc.id),
      }))
      .filter((g) => g.events.length > 0);

    if (grouped.length === 0) {
      return (
        <EmptyState message="Try selecting a different date or venue. / 他の日付や会場をお試しください。" />
      );
    }

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
                background: location.color_bg,
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
                  }}
                >
                  {location.name}
                </p>
                <p style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                  {location.name_ja} · {location.region} · {locEvents.length}{" "}
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
                  locationColorBg={location.color_bg}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single location
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
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          compact={columnLayout === 3}
          locationColor={loc?.color}
          locationColorBg={loc?.color_bg}
        />
      ))}
    </div>
  );
}
