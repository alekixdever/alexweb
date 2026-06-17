"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";

interface SnakeRoomPlayerRow {
  room_id: string;
  user_id: string;
  player_index: number;
  player_name: string;
  score: number;
  joined_at: string;
}

interface Props {
  onEnterRoom: (roomId: string, playerIndex: number, slots: { userId: string; playerIndex: number }[]) => void;
}

const PLAYER_COLORS = [
  { label: "Purple", color: "var(--accent)" },
  { label: "Green",  color: "#22c55e" },
  { label: "Yellow", color: "#eab308" },
  { label: "Pink",   color: "var(--accent2, #ec4899)" },
];

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function SnakeLobby({ onEnterRoom }: Props) {
  const { user } = useApp();
  const supabase = createClient();

  const [mode, setMode]           = useState<"home" | "create" | "join">("home");
  const [roomId, setRoomId]       = useState("");
  const [joinCode, setJoinCode]   = useState("");
  const [players, setPlayers]     = useState<SnakeRoomPlayerRow[]>([]);
  const playersRef = useRef<SnakeRoomPlayerRow[]>([]);
  useEffect(() => { playersRef.current = players; }, [players]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [myIndex, setMyIndex]     = useState<number | null>(null);
  const [isHost, setIsHost]       = useState(false);

  // ── fetchPlayers hoisted above useEffect to avoid "accessed before declared" ──
  async function fetchPlayers(rid: string) {
    const { data } = await supabase
      .from("snake_room_players")
      .select("*")
      .eq("room_id", rid)
      .order("player_index");
    if (data) setPlayers(data);
  }

  // ── Realtime: watch room players ──────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const ch = supabase
      .channel(`snake-lobby:${roomId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "snake_room_players",
        filter: `room_id=eq.${roomId}`,
      }, () => { fetchPlayers(roomId); })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "snake_rooms",
        filter: `id=eq.${roomId}`,
      }, async (payload: { new?: { status?: string } }) => {
        if (payload.new?.status !== "playing") return;
        const { data } = await supabase
          .from("snake_room_players")
          .select("*")
          .eq("room_id", roomId)
          .order("player_index");
        const freshPlayers = data ?? playersRef.current;
        onEnterRoom(
          roomId,
          myIndex ?? 0,
          freshPlayers.map((p) => ({ userId: p.user_id, playerIndex: p.player_index })),
        );
      })
      .subscribe();

    fetchPlayers(roomId);
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Create room ───────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!user) return;
    setLoading(true);
    setError(null);
    const newId = generateRoomId();

    const { error: roomErr } = await supabase.from("snake_rooms").insert({
      id: newId,
      host_user_id: user.id,
      status: "waiting",
      game_state: null,
    });
    if (roomErr) { setError(roomErr.message); setLoading(false); return; }

    const { error: playerErr } = await supabase.from("snake_room_players").insert({
      room_id: newId,
      user_id: user.id,
      player_index: 0,
      player_name: user.user_metadata?.display_name ?? "Player 1",
      score: 0,
    });
    if (playerErr) { setError(playerErr.message); setLoading(false); return; }

    setRoomId(newId);
    setMyIndex(0);
    setIsHost(true);
    setMode("create");
    setLoading(false);
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  async function handleJoin() {
    if (!user || !joinCode.trim()) return;
    setLoading(true);
    setError(null);
    const code = joinCode.trim().toUpperCase();

    const { data: room } = await supabase
      .from("snake_rooms")
      .select("*")
      .eq("id", code)
      .single();

    if (!room) { setError("Room not found / 部屋が見つかりません"); setLoading(false); return; }
    if (room.status !== "waiting") { setError("Game already started / ゲームはすでに始まっています"); setLoading(false); return; }

    const { data: existing } = await supabase
      .from("snake_room_players")
      .select("player_index")
      .eq("room_id", code)
      .order("player_index");

    if (existing && existing.length >= 4) {
      setError("Room is full / 部屋が満員です");
      setLoading(false);
      return;
    }

    const usedIndices = (existing ?? []).map((p: { player_index: number }) => p.player_index);
    const nextIndex   = [0, 1, 2, 3].find((i) => !usedIndices.includes(i)) ?? 1;

    const { error: joinErr } = await supabase.from("snake_room_players").insert({
      room_id: code,
      user_id: user.id,
      player_index: nextIndex,
      player_name: user.user_metadata?.display_name ?? `Player ${nextIndex + 1}`,
      score: 0,
    });
    if (joinErr) { setError(joinErr.message); setLoading(false); return; }

    setRoomId(code);
    setMyIndex(nextIndex);
    setIsHost(false);
    setMode("create");
    setLoading(false);
  }

  // ── Start game (host only) ────────────────────────────────────────────────
  async function handleStart() {
    if (!isHost || players.length < 1) return;
    await supabase.from("snake_rooms").update({ status: "playing" }).eq("id", roomId);
    onEnterRoom(roomId, myIndex ?? 0, players.map((p) => ({ userId: p.user_id, playerIndex: p.player_index })));
  }

  // ── Copy room code ─────────────────────────────────────────────────────────
  function copyCode() {
    navigator.clipboard.writeText(roomId).catch(() => {});
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 16px" }}>

      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--fg-primary)", margin: 0 }}>🐍 Snake</h2>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>Multi-player / マルチプレイヤー</p>
      </div>

      {/* Home */}
      {mode === "home" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
          <button className="btn-primary" onClick={handleCreate} disabled={loading || !user}
            style={btnPrimary}>
            {loading ? "..." : "Create Room / 部屋を作る"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Room code / 部屋コード"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={inputStyle}
            />
            <button onClick={handleJoin} disabled={loading || !joinCode.trim() || !user}
              style={{ ...btnPrimary, flexShrink: 0, padding: "0 16px" }}>
              Join / 参加
            </button>
          </div>
          {!user && <p style={{ fontSize: 12, color: "var(--fg-muted)", textAlign: "center" }}>Login to play / ログインしてプレイ</p>}
          {error && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</p>}
        </div>
      )}

      {/* Waiting room */}
      {mode === "create" && roomId && (
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Room code */}
          <div style={{ ...floatCard, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "var(--fg-muted)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Room Code / 部屋コード
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: "0.2em", color: "var(--fg-primary)", fontFamily: "monospace" }}>
                {roomId}
              </span>
              <button onClick={copyCode} title="Copy / コピー" style={{ ...iconBtn, fontSize: 16 }}>📋</button>
            </div>
            <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 6 }}>Share this code to invite friends / 友達を招待</p>
          </div>

          {/* Player list */}
          <div style={floatCard}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-muted)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Players / プレイヤー ({players.length}/4)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {players.map((p) => (
                <div key={p.user_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    background: PLAYER_COLORS[p.player_index]?.color ?? "var(--accent)",
                  }} />
                  <span style={{ fontSize: 13, color: "var(--fg-primary)", fontWeight: p.user_id === user?.id ? 700 : 400 }}>
                    {p.player_name}
                    {p.user_id === user?.id && " (You / あなた)"}
                  </span>
                  {p.player_index === 0 && (
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--fg-muted)" }}>HOST</span>
                  )}
                </div>
              ))}
              {Array.from({ length: 4 - players.length }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.3 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--border)" }} />
                  <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>Waiting... / 待機中</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start / waiting */}
          {isHost ? (
            <button onClick={handleStart} disabled={players.length < 1} style={btnPrimary}>
              Start Game / ゲーム開始 ({players.length} player{players.length !== 1 ? "s" : ""})
            </button>
          ) : (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--fg-muted)" }}>
              Waiting for host to start... / ホストの開始を待っています
            </p>
          )}

          {error && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const floatCard: React.CSSProperties = {
  background: "var(--bg-glass)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md, 12px)",
  padding: "16px",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 4px 12px var(--accent-glow)",
  transition: "all 0.2s",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "11px 12px",
  background: "var(--bg-glass)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--fg-primary)",
  fontSize: 14,
  fontFamily: "monospace",
  letterSpacing: "0.1em",
  outline: "none",
};

const iconBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-glass)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
};
