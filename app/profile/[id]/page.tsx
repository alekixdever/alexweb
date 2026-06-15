"use client";

import AvatarUpload from "@/components/AvatarUpload";
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

// [ERIC] Arcade types
interface ArcadeRanking {
  game_id: string;
  best_score: number;
  accuracy: number | null;
  updated_at: string;
}

interface Achievement {
  achievement_key: string;
  unlocked_at: string;
}

const ACHIEVEMENT_META: Record<
  string,
  { label: string; label_ja: string; icon: string }
> = {
  first_game: { label: "First Game", label_ja: "初プレイ", icon: "🎮" },
  stroop_master: {
    label: "Stroop Master",
    label_ja: "ストループ達人",
    icon: "🧠",
  },
  nana_champion: { label: "Nana Champion", label_ja: "ナナ王者", icon: "🃏" },
  high_accuracy: { label: "High Accuracy", label_ja: "高精度", icon: "🎯" },
  speed_demon: { label: "Speed Demon", label_ja: "スピード狂", icon: "⚡" },
  event_joiner: {
    label: "Event Joiner",
    label_ja: "イベント参加者",
    icon: "🎉",
  },
  social_butterfly: {
    label: "Social Butterfly",
    label_ja: "社交家",
    icon: "🦋",
  },
};

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

  // [ERIC] Arcade + Achievements state
  const [arcadeRankings, setArcadeRankings] = useState<ArcadeRanking[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

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
        setJoinedEvents((evts ?? []) as unknown as JoinedEvent[]);
      }

      // [ERIC] Arcade rankings
      const { data: rankings } = await supabase
        .from("arcade_rankings")
        .select("game_id, best_score, accuracy, updated_at")
        .eq("user_id", profileId)
        .order("best_score", { ascending: false });
      setArcadeRankings(rankings ?? []);

      // [ERIC] Achievements
      const { data: achvs } = await supabase
        .from("achievements")
        .select("achievement_key, unlocked_at")
        .eq("user_id", profileId)
        .order("unlocked_at", { ascending: false });
      setAchievements(achvs ?? []);

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
            {/* Avatar / アバター */}
            {isOwn ? (
              <AvatarUpload
                userId={profile.id}
                currentUrl={profile.avatar_url}
                displayName={profile.name}
                size={80}
                onUploadComplete={(newUrl) =>
                  setProfile((prev) =>
                    prev ? { ...prev, avatar_url: newUrl } : prev,
                  )
                }
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid var(--border)",
                  flexShrink: 0,
                  background: "var(--bg-layer2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name ?? "avatar"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 32 }}>👤</span>
                )}
              </div>
            )}

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
                value:
                  arcadeRankings.length > 0
                    ? Math.max(
                        ...arcadeRankings.map((r) => r.best_score),
                      ).toLocaleString()
                    : "—",
                label: "Best Score / ベストスコア",
              },
              {
                icon: <Users size={14} />,
                value: achievements.length,
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

        {/* ── [ERIC] Arcade Scores ── */}
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
            {arcadeRankings.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "rgba(251,191,36,0.12)",
                  color: "var(--yellow)",
                  border: "1px solid rgba(251,191,36,0.25)",
                }}
              >
                {arcadeRankings.length} game
                {arcadeRankings.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {arcadeRankings.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No games played yet. / まだゲームをプレイしていません。
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {arcadeRankings.map((r) => (
                <div
                  key={r.game_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--fg-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {r.game_id === "stroop"
                        ? "🧠 Stroop"
                        : r.game_id === "nana"
                          ? "🃏 Nana"
                          : r.game_id}
                    </p>
                    {r.accuracy != null && (
                      <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                        Accuracy / 精度: {r.accuracy.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: "var(--yellow)",
                        lineHeight: 1,
                      }}
                    >
                      {r.best_score.toLocaleString()}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--fg-muted)",
                        marginTop: 2,
                      }}
                    >
                      Best / ベスト
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── [ERIC] Achievements ── */}
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
              {achievements.length}
            </span>
          </div>

          {achievements.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--fg-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No achievements yet. / まだ実績がありません。
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {achievements.map((a) => {
                const meta = ACHIEVEMENT_META[a.achievement_key] ?? {
                  label: a.achievement_key,
                  label_ja: a.achievement_key,
                  icon: "🏅",
                };
                return (
                  <div
                    key={a.achievement_key}
                    title={`Unlocked: ${new Date(a.unlocked_at).toLocaleDateString()}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "var(--accent-glow)",
                      border: "1px solid var(--border-hover)",
                      cursor: "default",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--accent-bright)",
                      }}
                    >
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                      / {meta.label_ja}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
