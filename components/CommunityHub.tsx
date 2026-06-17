"use client";

// components/CommunityHub.tsx
// Phase 5 — Community tab skeleton
// Tabs: Feed | Arcade | Ranking | Discussion | Achievements
// Mobile: icon only | Desktop: icon + label
//
// [JANE] 2026-06-15 — Added RankingTab (reads arcade_rankings via Supabase)
// [JANE] 2026-06-15 — Added DiscussionTab (event list → CommentSection)
// [JANE] 2026-06-16 — Wired AchievementsTab (Eric's component) into Achievements panel
// [MAX]  2026-06-17 — Added incomingInvite prop threading → ArcadeLobby
// ⚠️ arcade_rankings table owned by [ERIC] — read-only access here
import ArcadeLobby from "./arcade/ArcadeLobby";
import CommentSection from "./CommentSection";
import { useState, useEffect } from "react";
import {
  Rss,
  Gamepad2,
  Trophy,
  MessageSquare,
  Star,
  Medal,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Feed from "./Feed";
import AchievementsTab from "@/components/arcade/AchievementsTab";

// ── Types ──────────────────────────────────────────────────────────────────
type CommunityTab =
  | "feed"
  | "arcade"
  | "ranking"
  | "discussion"
  | "achievements";

interface TabConfig {
  id: CommunityTab;
  icon: React.ReactNode;
  label: string;
  label_ja: string;
}

interface CommunityHubProps {
  incomingInvite?: { gameId: "nana" | "snake"; roomId: string } | null;
  onIncomingInviteConsumed?: () => void;
}

// ── Tab config ─────────────────────────────────────────────────────────────
const TABS: TabConfig[] = [
  {
    id: "feed",
    icon: <Rss size={16} />,
    label: "Feed",
    label_ja: "フィード",
  },
  {
    id: "arcade",
    icon: <Gamepad2 size={16} />,
    label: "Arcade",
    label_ja: "アーケード",
  },
  {
    id: "ranking",
    icon: <Trophy size={16} />,
    label: "Ranking",
    label_ja: "ランキング",
  },
  {
    id: "discussion",
    icon: <MessageSquare size={16} />,
    label: "Discussion",
    label_ja: "ディスカッション",
  },
  {
    id: "achievements",
    icon: <Star size={16} />,
    label: "Achievements",
    label_ja: "実績",
  },
];

// ── Types: Ranking ─────────────────────────────────────────────────────────
interface RankingRow {
  user_id: string;
  game_id: string;
  best_score: number;
  accuracy: number | null;
  updated_at: string;
  profiles?: { name: string; avatar_url?: string | null };
}

type GameFilter = "all" | "stroop" | "nana";

// ── RankingTab ─────────────────────────────────────────────────────────────
// [JANE] Reads arcade_rankings (owned by Eric) — read-only, no writes here
function RankingTab() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GameFilter>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const query = supabase
        .from("arcade_rankings")
        .select("*, profiles(name, avatar_url)")
        .order("best_score", { ascending: false })
        .limit(20);

      if (filter !== "all") query.eq("game_id", filter);

      const { data, error } = await query;
      if (!error && data) setRows(data as RankingRow[]);
      setLoading(false);
    }
    load();
  }, [filter]);

  const GAME_LABELS: Record<string, string> = {
    stroop: "Stroop",
    nana: "Nana",
  };

  const MEDAL_COLORS = ["var(--yellow)", "var(--fg-secondary)", "#cd7f32"];

  return (
    <div
      className="float-card"
      style={{ padding: 20, borderRadius: "var(--radius)" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <p className="label-xs">Ranking / ランキング</p>
          <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
            Top scores across all games / 全ゲームのトップスコア
          </p>
        </div>

        {/* Game filter pills */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "stroop", "nana"] as GameFilter[]).map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              style={{
                fontSize: 11,
                fontWeight: filter === g ? 600 : 400,
                padding: "4px 10px",
                borderRadius: 99,
                border: "1px solid",
                borderColor: filter === g ? "var(--accent)" : "var(--border)",
                background:
                  filter === g ? "rgba(139,92,246,0.12)" : "transparent",
                color:
                  filter === g ? "var(--accent-bright)" : "var(--fg-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {g === "all" ? "All / 全て" : GAME_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "var(--fg-muted)",
            fontSize: 13,
          }}
        >
          Loading… / 読み込み中…
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "var(--fg-muted)",
            fontSize: 13,
          }}
        >
          <Trophy size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>
            No scores yet. Play a game! /
            まだスコアはありません。ゲームを遊ぼう！
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 80px 64px 64px",
              gap: 8,
              padding: "0 8px 6px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {[
              "#",
              "Player / プレイヤー",
              "Game / ゲーム",
              "Score / スコア",
              "Acc / 正確",
            ].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {rows.map((row, i) => {
            const name = row.profiles?.name ?? "Member";
            const initials = name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const medalColor = MEDAL_COLORS[i] ?? null;

            return (
              <div
                key={`${row.user_id}-${row.game_id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 80px 64px 64px",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  background: i === 0 ? "rgba(251,191,36,0.06)" : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "var(--bg-glass)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    i === 0 ? "rgba(251,191,36,0.06)" : "transparent";
                }}
              >
                {/* Rank */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: medalColor ?? "var(--fg-muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {i < 3 ? <Medal size={14} color={medalColor!} /> : i + 1}
                </span>

                {/* Player */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {row.profiles?.avatar_url ? (
                    <img
                      src={row.profiles.avatar_url}
                      alt={name}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--accent-glow)",
                        border: "1px solid var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        color: "var(--accent-bright)",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--fg-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </span>
                </div>

                {/* Game */}
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    fontWeight: 500,
                  }}
                >
                  {GAME_LABELS[row.game_id] ?? row.game_id}
                </span>

                {/* Score */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--accent-bright)",
                    textAlign: "right",
                  }}
                >
                  {row.best_score.toLocaleString()}
                </span>

                {/* Accuracy */}
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--green)",
                    textAlign: "right",
                  }}
                >
                  {row.accuracy != null ? `${row.accuracy}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Types: Discussion ──────────────────────────────────────────────────────
interface DiscussionEvent {
  id: string;
  title: string;
  title_ja: string;
  date: string;
  comment_count: number;
}

// ── DiscussionTab ──────────────────────────────────────────────────────────
// [JANE] Two-panel: event list → CommentSection (useRealtimeComments)
// Reads: events table (read-only), comments table via CommentSection/hook
function DiscussionTab() {
  const [events, setEvents] = useState<DiscussionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiscussionEvent | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const { data } = await supabase
        .from("events")
        .select("id, title, title_ja, date, comments(count)")
        .order("date", { ascending: false })
        .limit(30);

      if (data) {
        const rows: DiscussionEvent[] = data.map((e: any) => ({
          id: e.id,
          title: e.title,
          title_ja: e.title_ja,
          date: e.date,
          comment_count: e.comments?.[0]?.count ?? 0,
        }));
        setEvents(rows);
      }
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }

  // ── Panel: Event list ────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div
        className="float-card"
        style={{ padding: 20, borderRadius: "var(--radius)" }}
      >
        <div style={{ marginBottom: 16 }}>
          <p className="label-xs">Discussion / ディスカッション</p>
          <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
            Select an event to discuss / イベントを選んでコメントする
          </p>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            Loading… / 読み込み中…
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--fg-muted)",
              fontSize: 13,
            }}
          >
            <MessageSquare
              size={32}
              style={{ opacity: 0.3, marginBottom: 8 }}
            />
            <p>No events yet. / イベントはまだありません。</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelected(ev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "var(--bg-glass)";
                  el.style.borderColor = "var(--border-hover)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "transparent";
                  el.style.borderColor = "var(--border)";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--accent-glow)",
                    border: "1px solid var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CalendarDays size={16} color="var(--accent-bright)" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--fg-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 2,
                    }}
                  >
                    {ev.title}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                    {ev.title_ja} · {formatDate(ev.date)}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={12} />
                  <span>{ev.comment_count}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Panel: Comments for selected event ───────────────────────────────────
  return (
    <div
      className="float-card"
      style={{ padding: 20, borderRadius: "var(--radius)" }}
    >
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setSelected(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            fontSize: 12,
            padding: "0 0 8px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "var(--accent-bright)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color =
              "var(--fg-muted)")
          }
        >
          <ChevronLeft size={14} />
          Back / 戻る
        </button>

        <p
          style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-primary)" }}
        >
          {selected.title}
        </p>
        <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
          {selected.title_ja} · {formatDate(selected.date)}
        </p>
      </div>

      <CommentSection eventId={selected.id} defaultOpen={true} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CommunityHub({ incomingInvite, onIncomingInviteConsumed }: CommunityHubProps = {}) {
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");

  // lang derived once at component level — passed to AchievementsTab
  const lang =
    typeof navigator !== "undefined" && navigator.language.startsWith("ja")
      ? "ja"
      : "en";

  // Auto-switch to Arcade tab when an invite arrives
  useEffect(() => {
    if (incomingInvite) setActiveTab("arcade");
  }, [incomingInvite]);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div
        className="float-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 8px",
          borderRadius: "var(--radius)",
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent-bright)" : "var(--fg-muted)",
                background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                {tab.icon}
              </span>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {activeTab === "feed" ? (
        <Feed />
      ) : activeTab === "arcade" ? (
        <ArcadeLobby
          incomingInvite={incomingInvite}
          onIncomingInviteConsumed={onIncomingInviteConsumed}
        />
      ) : activeTab === "ranking" ? (
        <RankingTab />
      ) : activeTab === "discussion" ? (
        <DiscussionTab />
      ) : activeTab === "achievements" ? (
        <AchievementsTab lang={lang} />
      ) : null}
    </div>
  );
}
