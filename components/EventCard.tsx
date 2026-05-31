"use client";

import { Event } from "@/data/events";
import { useApp } from "@/context/AppContext";
import { MapPin, Calendar, Users, Tag, MoreHorizontal } from "lucide-react";
import { locations } from "@/data/locations";
import { useState } from "react";

interface Props {
  event: Event;
  compact?: boolean;
}

export default function EventCard({ event, compact = false }: Props) {
  const { isLoggedIn, openAuthModal, theme } = useApp();
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(event.participantsCount);
  const [hovered, setHovered] = useState(false);

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
    if (!isLoggedIn)
      openAuthModal("View Participants", {
        type: "VIEW_PARTICIPANTS",
        eventId: event.id,
      });
  };

  const dateStr = event.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hovered ? "var(--border-glow)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: hovered
          ? "var(--shadow-md), 0 0 40px var(--accent-glow)"
          : "var(--shadow-card)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
      }}
    >
      {/* Glow edge top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: 1,
          background: hovered
            ? "linear-gradient(90deg, transparent, var(--accent-bright), transparent)"
            : "transparent",
          transition: "all 0.3s",
          zIndex: 2,
        }}
      />

      {/* Image — hidden in compact mode */}
      {!compact && (
        <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
          <img
            src={event.image}
            alt={event.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.5s ease",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80";
            }}
          />
          {/* Image overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(10,10,15,0.7) 0%, transparent 60%)",
            }}
          />
          {/* Tags on image */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 12,
              display: "flex",
              gap: 5,
              flexWrap: "wrap",
            }}
          >
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 99,
                  background: "rgba(139,92,246,0.3)",
                  backdropFilter: "blur(8px)",
                  color: "#e0d4ff",
                  border: "1px solid rgba(139,92,246,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Tag size={8} /> {tag}
              </span>
            ))}
          </div>
          {/* More menu */}
          <button
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>
      )}

      <div style={{ padding: compact ? "12px" : "14px" }}>
        {/* Compact mode: tags inline */}
        {compact && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 99,
                  background: "rgba(139,92,246,0.15)",
                  color: "var(--accent-bright)",
                  border: "1px solid rgba(139,92,246,0.25)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          style={{
            fontSize: compact ? 13 : 15,
            fontWeight: 700,
            color: "var(--fg-primary)",
            marginBottom: 8,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {event.title}
        </h3>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: compact ? 10 : 8,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--fg-muted)",
            }}
          >
            <Calendar size={11} style={{ color: "var(--accent-bright)" }} />{" "}
            {dateStr}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--fg-muted)",
            }}
          >
            <MapPin size={11} style={{ color: "var(--accent2)" }} />{" "}
            {location?.name}
          </span>
          <button
            onClick={handleViewParticipants}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: isLoggedIn ? "var(--green)" : "var(--fg-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Users size={11} /> {count}
          </button>
        </div>

        {/* Description — hidden in compact */}
        {!compact && (
          <p
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              marginBottom: 14,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </p>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          style={{
            width: "100%",
            padding: compact ? "7px" : "9px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: compact ? 12 : 13,
            transition: "all 0.2s ease",
            background: joined
              ? "rgba(52,211,153,0.1)"
              : "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: joined ? "var(--green)" : "#fff",
            boxShadow: joined ? "none" : "0 4px 16px var(--accent-glow)",
          }}
        >
          {joined ? "✓ Joined" : isLoggedIn ? "Join Event" : "🔒 Login to Join"}
        </button>
      </div>
    </article>
  );
}
