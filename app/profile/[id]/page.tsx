"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  CalendarDays,
  Trophy,
  Users,
  Edit3,
  Save,
  X,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface JoinedEvent {
  id: string;
  title: string;
  title_ja: string;
  date: string;
  image_url: string | null;
  locations: { name: string; color: string } | null;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, userRole } = useApp();
  const supabase = createClient();

  const profileId = params.id as string;
  const isOwn = user?.id === profileId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<JoinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // Profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      setProfile(prof);
      setEditName(prof?.name ?? "");

      // Joined events
      const { data: parts } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", profileId);

      if (parts && parts.length > 0) {
        const ids = parts.map((p) => p.event_id);
        const { data: evts } = await supabase
          .from("events")
          .select(
            "id, title, title_ja, date, image_url, locations(name, color)",
          )
          .in("id", ids)
          .order("date", { ascending: false });
        setJoinedEvents((evts ?? []) as JoinedEvent[]);
      }

      setLoading(false);
    };
    fetchAll();
  }, [profileId]);

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ name: editName })
      .eq("id", profileId);
    setProfile((prev) => (prev ? { ...prev, name: editName } : prev));
    setEditing(false);
    setSaving(false);
  };

  const roleColor: Record<string, string> = {
    super_admin: "var(--accent2)",
    admin: "var(--accent-bright)",
    member: "var(--green)",
  };

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    member: "Member / メンバー",
  };

  const avatarUrl =
    profile?.avatar_url ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name ?? profileId}`;

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100svh",
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--fg-muted)", fontSize: 14 }}>
          Loading... / 読み込み中...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: "100svh",
          background: "var(--bg-base)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <p style={{ color: "var(--fg-muted)", fontSize: 14 }}>
          User not found / ユーザーが見つかりません
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "8px 16px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Back to Home / ホームへ
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg-base)",
        padding: "var(--gap)",
      }}
    >
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--fg-muted)",
          fontSize: 13,
          padding: "4px 0",
        }}
      >
        <ArrowLeft size={14} /> Back / 戻る
      </button>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap)",
        }}
      >
        {/* ── Profile Card ── */}
        <div className="float-card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={avatarUrl}
                alt={profile.name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  border: "3px solid var(--accent)",
                  boxShadow: "0 0 20px var(--accent-glow)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--green)",
                  border: "2px solid var(--bg-card)",
                  boxShadow: "0 0 6px var(--green-glow)",
                }}
              />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border-hover)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--fg-primary)",
                      padding: "4px 10px",
                      outline: "none",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: "var(--accent)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    <Save size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditName(profile.name);
                    }}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--fg-primary)",
                    }}
                  >
                    {profile.name}
                  </h1>
                  {isOwn && (
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: "var(--bg-glass)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--fg-muted)",
                      }}
                    >
                      <Edit3 size={11} />
                    </button>
                  )}
                </div>
              )}

              {/* Role badge */}
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 99,
                  marginBottom: 8,
                  background: `${roleColor[profile.role] ?? "var(--fg-muted)"}20`,
                  color: roleColor[profile.role] ?? "var(--fg-muted)",
                  border: `1px solid ${roleColor[profile.role] ?? "var(--fg-muted)"}40`,
                }}
              >
                {roleLabel[profile.role] ?? profile.role}
              </span>

              <p style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                Joined / 参加日: {joinDate}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 20,
              padding: "14px 0",
              borderTop: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                icon: <CalendarDays size={14} />,
                value: joinedEvents.length,
                label: "Events Joined / 参加イベント",
              },
              {
                icon: <Trophy size={14} />,
                value: "—",
                label: "Arcade Score / ゲームスコア",
              },
              {
                icon: <Users size={14} />,
                value: "—",
                label: "Achievements / 実績",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  flex: 1,
                  minWidth: 140,
                }}
              >
                <div style={{ color: "var(--accent-bright)" }}>{stat.icon}</div>
                <div>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--fg-primary)",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Joined Events ── */}
        <div className="float-card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <CalendarDays size={16} style={{ color: "var(--accent-bright)" }} />
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
              }}
            >
              Events Joined / 参加イベント
            </h2>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 99,
                background: "rgba(139,92,246,0.12)",
                color: "var(--accent-bright)",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              {joinedEvents.length}
            </span>
          </div>

          {joinedEvents.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No events joined yet. / まだイベントに参加していません。
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {joinedEvents.map((evt) => {
                const dateObj = new Date(evt.date);
                const dateStr = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <div
                    key={evt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      borderLeft: `3px solid ${evt.locations?.color ?? "var(--accent)"}`,
                    }}
                  >
                    {evt.image_url && (
                      <img
                        src={evt.image_url}
                        alt={evt.title}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--fg-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {evt.title}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                        {evt.title_ja} · {dateStr}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 99,
                        flexShrink: 0,
                        background: `${evt.locations?.color ?? "var(--accent)"}20`,
                        color: evt.locations?.color ?? "var(--accent-bright)",
                        border: `1px solid ${evt.locations?.color ?? "var(--accent)"}40`,
                      }}
                    >
                      {evt.locations?.name ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Arcade Scores — placeholder for Eric ── */}
        <div className="float-card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Trophy size={16} style={{ color: "var(--yellow)" }} />
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
              }}
            >
              Arcade / アーケード
            </h2>
          </div>
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-muted)",
                marginBottom: 4,
              }}
            >
              🎮 Arcade scores coming soon
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              ゲームスコア機能は開発中です。
            </p>
          </div>
        </div>

        {/* ── Achievements — placeholder ── */}
        <div className="float-card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16 }}>⭐</span>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
              }}
            >
              Achievements / 実績
            </h2>
          </div>
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-muted)",
                marginBottom: 4,
              }}
            >
              ⭐ Achievements coming soon
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              実績機能は開発中です。
            </p>
          </div>
        </div>

        {/* ── Community Posts — placeholder ── */}
        <div className="float-card" style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16 }}>💬</span>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
              }}
            >
              Posts / 投稿
            </h2>
          </div>
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-muted)",
                marginBottom: 4,
              }}
            >
              💬 Community posts coming soon
            </p>
            <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
              コミュニティ投稿機能は開発中です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
