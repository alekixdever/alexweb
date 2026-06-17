// lib/arcade/nana-invite-adapter.ts
// [JANE] — Arcade & Games
// Wires useGameInviteFlow's generic GameAdapter shape to Nana's existing
// room-creation and invite functions, so RightSidebar can start a Nana
// invite flow without the inviter ever opening NanaRoomLobby first.

import {
  createNanaRoom,
  joinNanaRoom,
  getNanaRoomPlayers,
} from "@/lib/arcade/nana-room-db";

interface BuildNanaInviteAdapterArgs {
  hostUserId: string;
  hostUserName: string;
  /** From useRealtimeNanaInvite() — already bound to the inviter's own listener */
  broadcastNanaInvite: (
    roomId: string,
    targetUserId: string,
    fromUserId: string,
    fromUserName: string,
  ) => Promise<void>;
  /** Default player count for a room opened via direct invite (not a multi-seat lobby pick) */
  defaultPlayerCount?: number;
}

export function buildNanaInviteAdapter({
  hostUserId,
  hostUserName,
  broadcastNanaInvite,
  defaultPlayerCount = 2,
}: BuildNanaInviteAdapterArgs) {
  return {
    async createRoom(): Promise<string> {
      return createNanaRoom(hostUserId, defaultPlayerCount);
    },
    async joinAsHost(roomId: string): Promise<{ playerIndex: number }> {
      return joinNanaRoom(roomId, hostUserId, hostUserName);
    },
    async sendInvite(
      roomId: string,
      targetUserId: string,
      fromUserId: string,
      fromUserName: string,
    ): Promise<void> {
      await broadcastNanaInvite(roomId, targetUserId, fromUserId, fromUserName);
    },
    async getPlayerCount(roomId: string): Promise<number> {
      const players = await getNanaRoomPlayers(roomId);
      return players.length;
    },
  };
}
