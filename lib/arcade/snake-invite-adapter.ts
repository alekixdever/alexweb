// lib/arcade/snake-invite-adapter.ts
// [JANE] — Arcade & Games
// Wires useGameInviteFlow's generic GameAdapter shape to Snake's room
// and invite functions, so RightSidebar can start a Snake invite flow
// without the inviter ever opening SnakeLobby first.

import {
  createSnakeRoom,
  joinSnakeRoom,
  getSnakeRoomPlayers,
} from "@/lib/arcade/snake-room-db";

interface BuildSnakeInviteAdapterArgs {
  hostUserId: string;
  hostUserName: string;
  /** From useRealtimeSnakeInvite() — already bound to the inviter's own listener */
  broadcastSnakeInvite: (
    roomId: string,
    targetUserId: string,
    fromUserId: string,
    fromUserName: string,
  ) => Promise<void>;
}

export function buildSnakeInviteAdapter({
  hostUserId,
  hostUserName,
  broadcastSnakeInvite,
}: BuildSnakeInviteAdapterArgs) {
  return {
    async createRoom(): Promise<string> {
      return createSnakeRoom(hostUserId);
    },
    async joinAsHost(roomId: string): Promise<{ playerIndex: number }> {
      return joinSnakeRoom(roomId, hostUserId, hostUserName);
    },
    async sendInvite(
      roomId: string,
      targetUserId: string,
      fromUserId: string,
      fromUserName: string,
    ): Promise<void> {
      await broadcastSnakeInvite(roomId, targetUserId, fromUserId, fromUserName);
    },
    async getPlayerCount(roomId: string): Promise<number> {
      const players = await getSnakeRoomPlayers(roomId);
      return players.length;
    },
  };
}
