"use client";

// [MAX] EventCard.tsx
// Integrated: Jane's CommentSection (Sprint 1)
// Last updated: 2026-06-15

import { useEffect, useState } from "react";
import { useRealtimeParticipants } from "@/hooks/useRealtimeParticipants";
import { useApp } from "@/context/AppContext";
import { MapPin, Calendar, Users, Tag, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CommentSection from "@/components/CommentSection";

interface DBEvent {
  id: string;
  title: string;
  title_ja: string;
  description: string;
  description_ja: string;
  date: string;
  location_id: string;
  image_url: string | null;
  tags: string[];
  tags_ja: string[];
  participant_count: number;
  category_id: string | null;
  category?: {
    name: string;
    name_ja: string;
    color: string;
  } | null;
  capacity: number | null;
  capacity_enabled: boolean | null;
}

interface DBLocation {
  id: string;
  name: string;
  name_ja: string;
  color: string;
  color_bg: string;
}

interface Props {
  event: DBEvent;
  compact?: boolean;
  locationColor?: string;
  locationColorBg?: string;
}

export default function EventCard({
  event,
  compact = false,
  locationColor,
  locationColorBg,
}: Props) {
  const { isLoggedIn, openAuthModal, user } = useApp();
  const [hovered, setHovered] = useState(false);
  const [location, setLocation] = useState<DBLocation | null>(null);
  const supabase = createClient();
  const {
    count,
    isJoined: joined,
    isLoading: checking,
    join: realtimeJoin,
    leave: realtimeLeave,
  } = useRealtimeParticipants(event.id, user?.id ?? null);

  useEffect(() => {
    const fetchLocation = async () => {
      const { data } = await supabase
        .from("locations")
        .select("id, name, name_ja, color, color_bg")
        .eq("id", event.location_id)
        .single();
      setLocation(data);
    };
    fetchLocation();
  }, [event.location_id]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      openAuthModal("Join Event", { type: "JOIN_EVENT", eventId: event.id });
      return;
    }
    if (joined || checking) return;
    await realtimeJoin();
  };

  const handleLeave = async () => {
    if (!user?.id) return;
    await realtimeLeave();
  };

  const handleViewParticipants = () => {
    if (!isLoggedIn)
      openAuthModal("View Participants", {
        type: "VIEW_PARTICIPANTS",
        eventId: event.id,
      });
  };

  const isFull =
    event.capacity_enabled &&
    event.capacity !== null &&
    count >= event.capacity;

  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const dateJa = dateObj.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const locColor = locationColor ?? location?.color ?? "#f472b6";
  const locColorBg =
    locationColorBg ?? location?.color_bg ?? "rgba(244,114,182,0.12)";

  const joinLabel = () => {
    if (isFull && !joined) return "Full / 満員";
    if (!isLoggedIn) return "🔒 Login to Join / ログインして参加";
    if (checking) return "...";
    if (joined) return "✕ Leave Event / 参加取消";
    return "Join Event / 参加する";
  };

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

      {!compact && (
        <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
          <img
            src={
              event.image_url ??
              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80"
            }
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
            {event.category && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 99,
                  marginBottom: 6,
                  background: `${event.category.color}20`,
                  border: `1px solid ${event.category.color}40`,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: event.category.color,
                  }}
                >
                  {event.category.name} / {event.category.name_ja}
                </span>
              </div>
            )}

            {(event.tags ?? []).slice(0, 2).map((tag, i) => (
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
                <span style={{ opacity: 0.6, fontSize: 9 }}>
                  / {(event.tags_ja ?? [])[i]}
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
        {compact && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {(event.tags ?? []).slice(0, 2).map((tag, i) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 99,
                  background: "rgba(139,92,246,0.15)",
                  color: "var(--accent-bright)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Tag size={8} /> {tag}
                <span style={{ opacity: 0.6, fontSize: 9 }}>
                  / {(event.tags_ja ?? [])[i]}
                </span>
              </span>
            ))}
          </div>
        )}

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
          {event.title_ja}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-start",
            marginBottom: compact ? 10 : 12,
          }}
        >
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

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: locColorBg,
              border: `1px solid ${locColor}50`,
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
                background: `${locColor}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={12} style={{ color: locColor }} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: locColor,
                  lineHeight: 1.2,
                }}
              >
                {location?.name ?? "—"}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  lineHeight: 1.2,
                }}
              >
                {location?.name_ja ?? ""}
              </p>
            </div>
          </div>
        </div>

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
            {event.capacity_enabled && event.capacity ? (
              <span
                style={{ color: isFull ? "var(--red)" : "var(--fg-muted)" }}
              >
                {count} / {event.capacity} participants / 参加者
              </span>
            ) : (
              <>
                {count} participants / 参加者
                {!isLoggedIn && (
                  <span style={{ color: "var(--fg-muted)", fontSize: 10 }}>
                    {" "}
                    🔒
                  </span>
                )}
              </>
            )}
          </span>
        </button>

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
            {event.description_ja}
          </p>
        )}

        <button
          onClick={joined ? handleLeave : isFull ? undefined : handleJoin}
          disabled={checking || (!!isFull && !joined)}
          style={{
            width: "100%",
            padding: compact ? "7px" : "10px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: checking
              ? "wait"
              : isFull && !joined
                ? "not-allowed"
                : "pointer",
            fontWeight: 600,
            fontSize: compact ? 12 : 13,
            transition: "all 0.2s ease",
            background: joined
              ? "rgba(248,113,113,0.1)"
              : isFull
                ? "var(--bg-glass)"
                : checking
                  ? "var(--bg-glass)"
                  : "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: joined
              ? "var(--red)"
              : isFull
                ? "var(--fg-muted)"
                : checking
                  ? "var(--fg-muted)"
                  : "#fff",
            boxShadow:
              joined || checking || isFull
                ? "none"
                : "0 4px 16px var(--accent-glow)",
            opacity: checking || (isFull && !joined) ? 0.5 : 1,
          }}
        >
          {joinLabel()}
        </button>

        {/* [MAX] CommentSection — Jane's component, wired in Sprint 1 */}
        {!compact && <CommentSection eventId={event.id} />}
      </div>
    </article>
  );
}
