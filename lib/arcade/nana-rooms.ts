// lib/arcade/nana-rooms.ts
// [ERIC] — 房間建立 / 加入邏輯
import { createClient } from "@/lib/supabase/client";
import type { NanaRoom, NanaRoomPlayer } from "@/types/arcade";

// ── 建立房間 ──────────────────────────────────────────────────────────────

export async function createNanaRoom(
  hostUserId: string,
): Promise<NanaRoom | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nana_rooms")
    .insert({
      host_user_id: hostUserId,
      player_count: 1,
      status: "waiting",
    })
    .select()
    .single();

  if (error) {
    console.error("[Eric][nana-rooms] createNanaRoom error:", error.message);
    return null;
  }
  return data as NanaRoom;
}

// ── 加入房間 ──────────────────────────────────────────────────────────────

export async function joinNanaRoom(
  roomId: string,
  userId: string,
  playerIndex: number,
): Promise<NanaRoomPlayer | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nana_room_players")
    .insert({
      room_id: roomId,
      user_id: userId,
      player_index: playerIndex,
    })
    .select()
    .single();

  if (error) {
    console.error("[Eric][nana-rooms] joinNanaRoom error:", error.message);
    return null;
  }

  // player_count 更新
  await supabase.rpc("increment_nana_room_player_count", { room_id: roomId });

  return data as NanaRoomPlayer;
}

// ── 房間狀態更新 ──────────────────────────────────────────────────────────

export async function setNanaRoomStatus(
  roomId: string,
  status: NanaRoom["status"],
): Promise<void> {
  const supabase = createClient();
  await supabase.from("nana_rooms").update({ status }).eq("id", roomId);
}

// ── 房間玩家列表 ──────────────────────────────────────────────────────────

export async function getNanaRoomPlayers(
  roomId: string,
): Promise<NanaRoomPlayer[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nana_room_players")
    .select(
      `
      room_id,
      user_id,
      player_index,
      joined_at,
      profiles (
        name,
        avatar_url
      )
    `,
    )
    .eq("room_id", roomId)
    .order("player_index");

  if (error) {
    console.error(
      "[Eric][nana-rooms] getNanaRoomPlayers error:",
      error.message,
    );
    return [];
  }
  return (data as unknown as NanaRoomPlayer[]) ?? [];
}
