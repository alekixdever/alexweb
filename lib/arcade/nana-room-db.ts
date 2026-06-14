// lib/arcade/nana-room-db.ts
// Supabase calls for Nana room management

import { createClient } from "@/lib/supabase/client";
import type { NanaGameState } from "@/types/arcade";

export interface NanaRoomRow {
  id: string;
  host_user_id: string;
  player_count: number;
  status: "waiting" | "playing" | "finished";
  game_state: NanaGameState | null;
  created_at: string;
}

export interface NanaRoomPlayerRow {
  room_id: string;
  user_id: string;
  player_index: number;
  player_name: string;
  joined_at: string;
}

// ── Create room ───────────────────────────────────────────────────────────

export async function createNanaRoom(
  hostUserId: string,
  playerCount: number,
): Promise<string> {
  const supabase = createClient();
  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { error } = await supabase.from("nana_rooms").insert({
    id: roomId,
    host_user_id: hostUserId,
    player_count: playerCount,
    status: "waiting",
  });

  if (error) throw error;
  return roomId;
}

// ── Join room ─────────────────────────────────────────────────────────────

export async function joinNanaRoom(
  roomId: string,
  userId: string,
  playerName: string,
): Promise<{ playerIndex: number }> {
  const supabase = createClient();

  // Get current players to determine index
  const { data: existing, error: fetchError } = await supabase
    .from("nana_room_players")
    .select("player_index")
    .eq("room_id", roomId)
    .order("player_index", { ascending: true });

  if (fetchError) throw fetchError;

  const takenIndices = new Set((existing ?? []).map((p) => p.player_index));
  let playerIndex = 0;
  while (takenIndices.has(playerIndex)) playerIndex++;

  const { error } = await supabase.from("nana_room_players").insert({
    room_id: roomId,
    user_id: userId,
    player_index: playerIndex,
    player_name: playerName,
  });

  if (error) throw error;
  return { playerIndex };
}

// ── Get room ──────────────────────────────────────────────────────────────

export async function getNanaRoom(roomId: string): Promise<NanaRoomRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nana_rooms")
    .select("*")
    .eq("id", roomId)
    .single();
  if (error) return null;
  return data as NanaRoomRow;
}

export async function getNanaRoomPlayers(
  roomId: string,
): Promise<NanaRoomPlayerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nana_room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("player_index", { ascending: true });
  if (error) return [];
  return (data as NanaRoomPlayerRow[]) ?? [];
}

// ── Update room status ────────────────────────────────────────────────────

export async function updateNanaRoomStatus(
  roomId: string,
  status: "waiting" | "playing" | "finished",
): Promise<void> {
  const supabase = createClient();
  await supabase.from("nana_rooms").update({ status }).eq("id", roomId);
}

// ── Save game state ───────────────────────────────────────────────────────

export async function saveNanaGameState(
  roomId: string,
  gameState: NanaGameState,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("nana_rooms")
    .update({ game_state: gameState as unknown })
    .eq("id", roomId);
}

// ── Leave room ────────────────────────────────────────────────────────────

export async function leaveNanaRoom(
  roomId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("nana_room_players")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);
}
