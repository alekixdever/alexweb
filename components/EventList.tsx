"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import EventCard from "./EventCard";
import EmptyState from "./EmptyState";
import { MapPin } from "lucide-react";

const PAGE_SIZE = 10;

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
  capacity: number | null;
  capacity_enabled: boolean | null;
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
  searchQuery?: string;
}

export default function EventList({
  selectedLocation,
  selectedDate,
  selectedCategory,
  searchQuery = "",
}: Props) {
  const { columnLayout } = useApp();
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [locations, setLocations] = useState<DBLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const supabase = createClient();
  const isAll = selectedLocation === "all";

  const fetchData = useCallback(async (currentLimit: number) => {
    // Fetch locations
    const { data: locData } = await supabase
      .from("locations")
      .select("*")
      .order("name");
    setLocations(locData ?? []);

    // Date from: selectedDate or today
    const today = new Date().toISOString().split("T")[0];
    const dateFrom = selectedDate
      ? `${selectedDate}T00:00:00`
      : `${today}T00:00:00`;

    // Build events query — fetch limit+1 to detect hasMore
    let query = supabase
      .from("events")
      .select("*, event_participants(count), activity_categories(name, name_ja, color)")
      .gte("date", dateFrom)
      .order("date")
      .limit(currentLimit + 1);

    if (!isAll) query = query.eq("location_id", selectedLocation);
    if (selectedCategory !== "all") query = query.eq("category_id", selectedCategory);

    const { data: evtData } = await query;
    const raw = evtData ?? [];

    setHasMore(raw.length > currentLimit);
    const sliced = raw.slice(0, currentLimit);

    const normalized = sliced.map((e) => ({
      ...e,
      participant_count: Array.isArray(e.event_participants)
        ? (e.event_participants[0]?.count ?? 0)
        : 0,
      category: e.activity_categories ?? null,
    }));

    setEvents(normalized);
  }, [selectedLocation, selectedDate, selectedCategory, isAll]);

  // Reset and reload when filters change
  useEffect(() => {
    setLoading(true);
    setLimit(PAGE_SIZE);
    fetchData(PAGE_SIZE).finally(() => setLoading(false));
  }, [selectedLocation, selectedDate, selectedCategory]);

  // Load more
  async function handleShowMore() {
    const newLimit = limit + PAGE_SIZE;
    setLoadingMore(true);
    setLimit(newLimit);
    await fetchData(newLimit);
    setLoadingMore(false);
  }

  // Client-side search filter
  const q = searchQuery.trim().toLowerCase();
  const filteredEvents = q
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.title_ja.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.description_ja?.toLowerCase().includes(q) ||
          (e.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (e.tags_ja ?? []).some((t) => t.toLowerCase().includes(q)),
      )
    : events;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
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

  if (filteredEvents.length === 0) {
    return (
      <EmptyState
        message={
          q
            ? `No results for "${searchQuery}" / 「${searchQuery}」の結果はありません`
            : "No upcoming events. / 今後のイベントはありません。"
        }
      />
    );
  }

  // Show More button
  const ShowMoreBtn = () =>
    hasMore ? (
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={handleShowMore}
          disabled={loadingMore}
          className="btn-secondary"
          style={{ minWidth: 160 }}
        >
          {loadingMore ? "Loading… / 読み込み中…" : "Show More / もっと見る"}
        </button>
      </div>
    ) : null;

  // All venues — group by location
  if (isAll) {
    const grouped = locations
      .map((loc) => ({
        location: loc,
        events: filteredEvents.filter((e) => e.location_id === loc.id),
      }))
      .filter((g) => g.events.length > 0);

    if (grouped.length === 0) {
      return (
        <EmptyState
          message={
            q
              ? `No results for "${searchQuery}" / 「${searchQuery}」の結果はありません`
              : "No upcoming events. / 今後のイベントはありません。"
          }
        />
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 16 }}>
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
                <p style={{ fontSize: 13, fontWeight: 700, color: location.color }}>
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
                gridTemplateColumns: columnLayout === 3 ? "repeat(3, 1fr)" : undefined,
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
        <ShowMoreBtn />
      </div>
    );
  }

  // Single location
  const loc = locations.find((l) => l.id === selectedLocation);
  return (
    <div style={{ paddingBottom: 16 }}>
      <div
        style={{
          display: columnLayout === 3 ? "grid" : "flex",
          flexDirection: columnLayout === 3 ? undefined : "column",
          gridTemplateColumns: columnLayout === 3 ? "repeat(3, 1fr)" : undefined,
          gap: "var(--gap)",
        }}
      >
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            compact={columnLayout === 3}
            locationColor={loc?.color}
            locationColorBg={loc?.color_bg}
          />
        ))}
      </div>
      <ShowMoreBtn />
    </div>
  );
}
