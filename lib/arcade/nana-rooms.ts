// lib/arcade/nana-rooms.ts
import { createClient } from "@/lib/supabase/client";
import type { NanaRoom, NanaRoomPlayer } from "@/types/arcade";

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
    console.error("[nana-rooms] createNanaRoom error:", error);
    return null;
  }
  return data as NanaRoom;
}

export async function joinNanaRoom(
  roomId: string,
  userId: string,
  playerIndex: number,
): Promise<boolean> {
  const supabase = createClient();

  const { error: joinError } = await supabase.from("nana_room_players").insert({
    room_id: roomId,
    user_id: userId,
    player_index: playerIndex,
  });

  if (joinError) {
    console.error("[nana-rooms] joinNanaRoom insert error:", joinError);
    return false;
  }

  const { error: rpcError } = await supabase.rpc(
    "increment_nana_room_player_count",
    { p_room_id: roomId },
  );

  if (rpcError) {
    console.error("[nana-rooms] increment RPC error:", rpcError);
    return false;
  }

  return true;
}

export async function getNanaRoomPlayers(
  roomId: string,
): Promise<NanaRoomPlayer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nana_room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("player_index", { ascending: true });

  if (error) {
    console.error("[nana-rooms] getNanaRoomPlayers error:", error);
    return [];
  }
  return (data ?? []) as NanaRoomPlayer[];
}
