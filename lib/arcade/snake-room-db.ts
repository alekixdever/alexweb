// lib/arcade/snake-room-db.ts
// [JANE] — Arcade & Games
// Supabase calls for Snake room management.
// Extracted from SnakeLobby.tsx (which previously inlined these calls)
// so the same create/join logic can be reused by the background
// invite-flow (useGameInviteFlow + snake-invite-adapter) without
// duplicating it.

import { createClient } from "@/lib/supabase/client";

export interface SnakeRoomRow {
  id: string;
  host_user_id: string;
  status: "waiting" | "playing" | "finished";
  game_state: unknown | null;
  created_at: string;
}

export interface SnakeRoomPlayerRow {
  room_id: string;
  user_id: string;
  player_index: number;
  player_name: string;
  score: number;
  joined_at: string;
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Create room ───────────────────────────────────────────────────────────

export async function createSnakeRoom(hostUserId: string): Promise<string> {
  const supabase = createClient();
  const id = generateRoomId();

  const { error } = await supabase.from("snake_rooms").insert({
    id,
    host_user_id: hostUserId,
    status: "waiting",
    game_state: null,
  });

  if (error) throw error;
  return id;
}

// ── Join room ─────────────────────────────────────────────────────────────

export async function joinSnakeRoom(
  roomId: string,
  userId: string,
  playerName: string,
): Promise<{ playerIndex: number }> {
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("snake_room_players")
    .select("player_index")
    .eq("room_id", roomId)
    .order("player_index", { ascending: true });

  if (fetchError) throw fetchError;

  const takenIndices = new Set((existing ?? []).map((p) => p.player_index));
  let playerIndex = 0;
  while (takenIndices.has(playerIndex)) playerIndex++;

  const { error } = await supabase.from("snake_room_players").insert({
    room_id: roomId,
    user_id: userId,
    player_index: playerIndex,
    player_name: playerName,
    score: 0,
  });

  if (error) throw error;
  return { playerIndex };
}

// ── Get room players ─────────────────────────────────────────────────────

export async function getSnakeRoomPlayers(
  roomId: string,
): Promise<SnakeRoomPlayerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("snake_room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("player_index", { ascending: true });

  if (error) return [];
  return (data as SnakeRoomPlayerRow[]) ?? [];
}

// ── Get room ──────────────────────────────────────────────────────────────

export async function getSnakeRoom(
  roomId: string,
): Promise<SnakeRoomRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("snake_rooms")
    .select("*")
    .eq("id", roomId)
    .single();
  if (error) return null;
  return data as SnakeRoomRow;
}

// ── Update room status ────────────────────────────────────────────────────

export async function updateSnakeRoomStatus(
  roomId: string,
  status: "waiting" | "playing" | "finished",
): Promise<void> {
  const supabase = createClient();
  await supabase.from("snake_rooms").update({ status }).eq("id", roomId);
}
