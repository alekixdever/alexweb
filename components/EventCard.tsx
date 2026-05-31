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
  const { isLoggedIn, openAuthModal } = useApp();
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
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const dateJa = event.date.toLocaleDateString("ja-JP", {
    month: "long",
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
      {/* Top glow edge */}
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

      {/* Image — hidden in compact */}
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(10,10,15,0.75) 0%, transparent 60%)",
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
            {event.tags.slice(0, 2).map((tag, i) => (
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
                <Tag size={8} />
                {tag}
                <span style={{ opacity: 0.6, fontSize: 9 }}>
                  / {event.tagsJa[i]}
                </span>
              </span>
            ))}
          </div>

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
        {/* Compact tags */}
        {compact && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {event.tags.slice(0, 2).map((tag, i) => (
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
                {tag} / {event.tagsJa[i]}
              </span>
            ))}
          </div>
        )}

        {/* Title — bilingual */}
        <h3
          style={{
            fontSize: compact ? 13 : 15,
            fontWeight: 700,
            color: "var(--fg-primary)",
            marginBottom: 4,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {event.title}
        </h3>
        <p
          style={{
            fontSize: 11,
            color: "var(--fg-muted)",
            marginBottom: 10,
            lineHeight: 1.4,
          }}
        >
          {event.titleJa}
        </p>

        {/* ── Date + Location pills — prominent ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-start",
            marginBottom: compact ? 10 : 12,
          }}
        >
          {/* Date pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 10px",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                flexShrink: 0,
                background: "rgba(139,92,246,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={12} style={{ color: "var(--accent-bright)" }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent-bright)",
                  lineHeight: 1.2,
                }}
              >
                {dateStr}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  lineHeight: 1.2,
                }}
              >
                {dateJa}
              </p>
            </div>
          </div>

          {/* Location pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(236,72,153,0.08)",
              border: "1px solid rgba(236,72,153,0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 10px",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                flexShrink: 0,
                background: "rgba(236,72,153,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={12} style={{ color: "var(--accent2)" }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent2)",
                  lineHeight: 1.2,
                }}
              >
                {location?.name}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  lineHeight: 1.2,
                }}
              >
                {location?.nameJa}
              </p>
            </div>
          </div>
        </div>

        {/* Participants */}
        {/* Participants */}
        <button
          onClick={handleViewParticipants}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            marginBottom: compact ? 10 : 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {/* Avatar stack */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {Array.from({ length: Math.min(3, count) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "2px solid var(--bg-card)",
                  marginLeft: i === 0 ? 0 : -6,
                  background: [
                    "linear-gradient(135deg, var(--accent), var(--accent2))",
                    "linear-gradient(135deg, var(--green), var(--accent))",
                    "linear-gradient(135deg, var(--accent2), var(--yellow))",
                  ][i],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "#fff",
                  fontWeight: 700,
                  zIndex: 3 - i,
                  position: "relative",
                }}
              >
                {["A", "B", "C"][i]}
              </div>
            ))}
            {count > 3 && (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "2px solid var(--bg-card)",
                  marginLeft: -6,
                  background: "var(--bg-glass)",
                  border: "2px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "var(--fg-muted)",
                  fontWeight: 700,
                  position: "relative",
                  zIndex: 0,
                }}
              >
                +{count - 3}
              </div>
            )}
          </div>
          <span
            style={{ color: isLoggedIn ? "var(--green)" : "var(--fg-muted)" }}
          >
            {count} participants / 参加者
            {!isLoggedIn && (
              <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>
                {" "}
                🔒
              </span>
            )}
          </span>
        </button>

        {/* Description — hidden in compact */}
        {!compact && (
          <p
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.description}
          </p>
        )}
        {!compact && (
          <p
            style={{
              fontSize: 11,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              marginBottom: 14,
              opacity: 0.7,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.descriptionJa}
          </p>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          style={{
            width: "100%",
            padding: compact ? "7px" : "10px",
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
          {joined
            ? "✓ Joined / 参加済み"
            : isLoggedIn
              ? "Join Event / 参加する"
              : "🔒 Login to Join / ログインして参加"}
        </button>
      </div>
    </article>
  );
}
