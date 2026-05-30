"use client";

import { Event } from "@/data/events";
import { useApp } from "@/context/AppContext";
import { MapPin, Calendar, Users, Tag } from "lucide-react";
import { locations } from "@/data/locations";
import { useState } from "react";

interface Props {
  event: Event;
}

export default function EventCard({ event }: Props) {
  const { isLoggedIn, openAuthModal, theme } = useApp();
  const isLight = theme === "light";
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(event.participantsCount);

  const location = locations.find((l) => l.id === event.locationId);

  const handleJoin = () => {
    if (!isLoggedIn) {
      openAuthModal("Join Event", { type: "JOIN_EVENT", eventId: event.id });
      return;
    }
    if (!joined) {
      setJoined(true);
      setCount((c) => c + 1);
    }
  };

  const handleViewParticipants = () => {
    if (!isLoggedIn) {
      openAuthModal("View Participants", {
        type: "VIEW_PARTICIPANTS",
        eventId: event.id,
      });
    }
  };

  const dateStr = event.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  return (
    <article
      style={{
        background: isLight ? "rgba(255,255,255,0.9)" : "var(--card)",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: isLight ? "0 4px 24px var(--shadow)" : "none",
        transition: "all 0.3s",
      }}
    >
      {/* Image */}
      <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
        <img
          src={event.image}
          alt={event.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80";
          }}
        />
      </div>

      <div style={{ padding: "16px" }}>
        {/* Title */}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 8,
          }}
        >
          {event.title}
        </h3>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <Calendar size={12} /> {dateStr}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <MapPin size={12} /> {location?.name}
          </span>
          <button
            onClick={handleViewParticipants}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: isLoggedIn ? "var(--green)" : "var(--muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Users size={12} /> {count} participants
          </button>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          {event.description}
        </p>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {event.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 20,
                background: isLight
                  ? "rgba(0,184,148,0.08)"
                  : "rgba(78,204,163,0.12)",
                color: "var(--green)",
                border: "1px solid rgba(78,204,163,0.2)",
              }}
            >
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>

        {/* Join button */}
        <button
          onClick={handleJoin}
          style={{
            width: "100%",
            padding: "9px",
            borderRadius: 8,
            border: joined
              ? "1px solid rgba(78,204,163,0.3)"
              : "1px solid transparent",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            transition: "all 0.2s",
            background: joined ? "rgba(78,204,163,0.15)" : "var(--accent)",
            color: joined ? "var(--green)" : "#fff",
            boxShadow: !joined && isLight ? "0 4px 12px var(--shadow)" : "none",
          }}
        >
          {joined ? "✓ Joined" : isLoggedIn ? "Join Event" : "🔒 Login to Join"}
        </button>
      </div>
    </article>
  );
}
