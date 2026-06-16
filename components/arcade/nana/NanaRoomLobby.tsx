// components/arcade/nana/NanaRoomLobby.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createNanaRoom,
  joinNanaRoom,
  getNanaRoom,
  getNanaRoomPlayers,
  type NanaRoomPlayerRow,
} from "@/lib/arcade/nana-room-db";

interface Props {
  userId: string;
  userName: string;
  lang: "en" | "ja";
  onRoomReady: (
    roomId: string,
    playerIndex: number,
    playerCount: number,
  ) => void;
  onExit: () => void;
  pendingInviteRoomId?: string; // ← 新增：接受邀請後自動加入
}

type LobbyPhase = "menu" | "creating" | "waiting" | "joining" | "join_input";

export default function NanaRoomLobby({
  userId,
  userName,
  lang,
  onRoomReady,
  onExit,
  pendingInviteRoomId,
}: Props) {
  const [phase, setPhase] = useState<LobbyPhase>("menu");
  const [playerCount, setPlayerCount] = useState(2);
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);
  const [players, setPlayers] = useState<NanaRoomPlayerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  // ── Auto-join when pendingInviteRoomId is set ─────────────────────────────
  useEffect(() => {
    if (!pendingInviteRoomId) return;

    async function autoJoin() {
      setPhase("joining");
      setError(null);
      try {
        const room = await getNanaRoom(pendingInviteRoomId!);
        if (!room) {
          setError(t("Room not found.", "部屋が見つかりません。"));
          setPhase("menu");
          return;
        }
        if (room.status !== "waiting") {
          setError(
            t(
              "This room has already started.",
              "このゲームはすでに開始しています。",
            ),
          );
          setPhase("menu");
          return;
        }
        const { playerIndex } = await joinNanaRoom(
          pendingInviteRoomId!,
          userId,
          userName,
        );
        setRoomId(pendingInviteRoomId!);
        setMyPlayerIndex(playerIndex);
        setPhase("waiting");
      } catch {
        setError(t("Failed to join room.", "部屋への参加に失敗しました。"));
        setPhase("menu");
      }
    }

    autoJoin();
  }, [pendingInviteRoomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Watch room players via Realtime ───────────────────────────────────────
  useEffect(() => {
    if (!roomId || phase !== "waiting") return;

    const supabase = createClient();

    getNanaRoomPlayers(roomId).then(setPlayers);

    const channel = supabase
      .channel(`nana_room_players:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nana_room_players",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const updated = await getNanaRoomPlayers(roomId);
          setPlayers(updated);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, phase]);

  // ── Auto-start when room is full ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== "waiting" || players.length === 0) return;

    getNanaRoom(roomId).then((room) => {
      if (room && players.length >= room.player_count) {
        onRoomReady(roomId, myPlayerIndex, room.player_count);
      }
    });
  }, [players, phase, roomId, myPlayerIndex]);

  // ── Create room ───────────────────────────────────────────────────────────
  async function handleCreate() {
    setPhase("creating");
    setError(null);
    try {
      const id = await createNanaRoom(userId, playerCount);
      const { playerIndex } = await joinNanaRoom(id, userId, userName);
      setRoomId(id);
      setMyPlayerIndex(playerIndex);
      setPhase("waiting");
    } catch {
      setError(t("Failed to create room.", "部屋の作成に失敗しました。"));
      setPhase("menu");
    }
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  async function handleJoin() {
    const code = joinInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError(
        t(
          "Enter a valid 6-character room code.",
          "6文字の部屋コードを入力してください。",
        ),
      );
      return;
    }
    setPhase("joining");
    setError(null);
    try {
      const room = await getNanaRoom(code);
      if (!room) {
        setError(t("Room not found.", "部屋が見つかりません。"));
        setPhase("join_input");
        return;
      }
      if (room.status !== "waiting") {
        setError(
          t(
            "This room has already started.",
            "このゲームはすでに開始しています。",
          ),
        );
        setPhase("join_input");
        return;
      }
      const { playerIndex } = await joinNanaRoom(code, userId, userName);
      setRoomId(code);
      setMyPlayerIndex(playerIndex);
      setPhase("waiting");
    } catch {
      setError(t("Failed to join room.", "部屋への参加に失敗しました。"));
      setPhase("join_input");
    }
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  if (phase === "menu") {
    return (
      <div
        className="float-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: 32,
          borderRadius: "var(--radius)",
          maxWidth: 380,
          margin: "0 auto",
        }}
      >
        <p
          style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-primary)" }}
        >
          {t("Nana — Online", "ナナ — オンライン")}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-muted)",
            textAlign: "center",
          }}
        >
          {t(
            "Create a room and share the code, or join a friend's room.",
            "部屋を作ってコードを共有するか、友達の部屋に参加しよう。",
          )}
        </p>

        {error && (
          <p style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>
            {error}
          </p>
        )}

        {/* Create */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          <p className="label-xs">{t("Players", "プレイヤー人数")}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  background:
                    playerCount === n ? "var(--accent)" : "var(--surface-3)",
                  color: playerCount === n ? "#fff" : "var(--fg-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={handleCreate}>
            {t("Create Room / ", "")}部屋を作る
          </button>
        </div>

        <div
          style={{ width: "100%", height: 1, background: "var(--border)" }}
        />

        {/* Join */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          <p className="label-xs">
            {t("Join with room code", "部屋コードで参加")}
          </p>
          <button
            className="btn-secondary"
            onClick={() => {
              setPhase("join_input");
              setError(null);
            }}
          >
            {t("Join Room / ", "")}部屋に参加
          </button>
        </div>

        <button
          className="btn-secondary"
          onClick={onExit}
          style={{ fontSize: 12 }}
        >
          {t("Back", "戻る")}
        </button>
      </div>
    );
  }

  // ── Join input ────────────────────────────────────────────────────────────
  if (phase === "join_input" || phase === "joining") {
    return (
      <div
        className="float-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: 32,
          borderRadius: "var(--radius)",
          maxWidth: 340,
          margin: "0 auto",
        }}
      >
        <p
          style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-primary)" }}
        >
          {t("Enter Room Code", "部屋コードを入力")}
        </p>

        {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}

        <input
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--fg-primary)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textAlign: "center",
            width: "100%",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            className="btn-primary"
            onClick={handleJoin}
            disabled={phase === "joining"}
            style={{ flex: 1 }}
          >
            {phase === "joining"
              ? t("Joining…", "参加中…")
              : t("Join", "参加する")}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setPhase("menu");
              setError(null);
            }}
          >
            {t("Back", "戻る")}
          </button>
        </div>
      </div>
    );
  }

  // ── Creating ──────────────────────────────────────────────────────────────
  if (phase === "creating") {
    return (
      <div
        className="float-card"
        style={{
          padding: 32,
          textAlign: "center",
          borderRadius: "var(--radius)",
        }}
      >
        <p style={{ color: "var(--fg-muted)", fontSize: 13 }}>
          {t("Creating room…", "部屋を作成中…")}
        </p>
      </div>
    );
  }

  // ── Waiting for players ───────────────────────────────────────────────────
  return (
    <div
      className="float-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: 32,
        borderRadius: "var(--radius)",
        maxWidth: 380,
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-primary)" }}>
        {t("Waiting for players…", "プレイヤーを待っています…")}
      </p>

      {/* Room code */}
      <div
        style={{
          padding: "16px 32px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(139,92,246,0.12)",
          border: "1px solid var(--accent)",
          textAlign: "center",
        }}
      >
        <p className="label-xs">{t("Room Code / 部屋コード", "部屋コード")}</p>
        <p
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "var(--accent-bright)",
            letterSpacing: "0.2em",
            marginTop: 4,
          }}
        >
          {roomId}
        </p>
        <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 4 }}>
          {t("Share this code with friends", "友達にこのコードを教えよう")}
        </p>
      </div>

      {/* Player list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
        }}
      >
        <p className="label-xs">
          {t("Players", "プレイヤー")} ({players.length}/{playerCount})
        </p>
        {Array.from({ length: playerCount }).map((_, i) => {
          const player = players.find((p) => p.player_index === i);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                background: player
                  ? "rgba(139,92,246,0.08)"
                  : "var(--surface-2)",
                border: player
                  ? "1px solid var(--accent)"
                  : "1px dashed var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: player ? "var(--accent-bright)" : "var(--fg-muted)",
                  fontWeight: 600,
                }}
              >
                P{i + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: player ? "var(--fg-primary)" : "var(--fg-muted)",
                }}
              >
                {player ? player.player_name : t("Waiting…", "待機中…")}
              </span>
              {player?.user_id === userId && (
                <span
                  className="label-xs"
                  style={{ marginLeft: "auto", color: "var(--accent)" }}
                >
                  {t("You", "あなた")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="btn-secondary"
        onClick={onExit}
        style={{ fontSize: 12 }}
      >
        {t("Cancel", "キャンセル")}
      </button>
    </div>
  );
}
