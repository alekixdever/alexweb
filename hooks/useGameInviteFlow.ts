// hooks/useGameInviteFlow.ts
// [JANE] — Realtime & Presence / Arcade & Games
//
// Lets the inviter start a game invite WITHOUT first entering a room/lobby
// screen. Flow:
//   1. Inviter picks a contact + game from RightSidebar's "Invite to Game" menu
//   2. This hook creates the room in the background (no navigation)
//   3. Sends the invite broadcast to the target user
//   4. Polls the room's player list — when it grows beyond 1 (i.e. the
//      invitee joined), fires onOpponentJoined so the caller can navigate
//      the inviter into the game screen
//
// Polling (not a new broadcast event) per 2026-06-17 decision — simpler
// architecture, traded off against a few hundred ms–few sec join latency.
//
// This hook is intentionally game-agnostic at the call site: pass in the
// game-specific create/join/poll functions so the same flow works for
// Nana, Snake, or any future game without duplicating this logic.

"use client";

import { useCallback, useRef, useState } from "react";

export type InviteFlowStatus =
  | "idle"
  | "creating_room"
  | "waiting_for_accept"
  | "opponent_joined"
  | "error";

interface GameAdapter {
  /** Create a room in the background. Returns the new room's ID. */
  createRoom: () => Promise<string>;
  /** Join the just-created room as host (playerIndex 0). */
  joinAsHost: (roomId: string) => Promise<{ playerIndex: number }>;
  /** Send the invite broadcast to the target user. */
  sendInvite: (
    roomId: string,
    targetUserId: string,
    fromUserId: string,
    fromUserName: string,
  ) => Promise<void>;
  /** Poll current player count in the room. */
  getPlayerCount: (roomId: string) => Promise<number>;
}

interface UseGameInviteFlowOptions {
  fromUserId: string;
  fromUserName: string;
  pollIntervalMs?: number; // default 2000
  /** Stop polling and surface an error after this many attempts (default 15 * 2s = 30s, per 2026-06-17 Max spec) */
  maxPollAttempts?: number;
}

interface UseGameInviteFlowReturn {
  status: InviteFlowStatus;
  roomId: string | null;
  myPlayerIndex: number;
  error: string | null;
  /** Kick off the whole flow: create room → join as host → send invite → start polling */
  startInviteFlow: (
    adapter: GameAdapter,
    targetUserId: string,
  ) => Promise<void>;
  /** Stop polling and reset state — call on unmount or when the inviter manually cancels */
  cancel: () => void;
}

export function useGameInviteFlow({
  fromUserId,
  fromUserName,
  pollIntervalMs = 2000,
  maxPollAttempts = 15,
}: UseGameInviteFlowOptions): UseGameInviteFlowReturn {
  const [status, setStatus] = useState<InviteFlowStatus>("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const cancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    setStatus("idle");
    setRoomId(null);
    setMyPlayerIndex(0);
    setError(null);
    pollAttemptsRef.current = 0;
  }, [stopPolling]);

  const startInviteFlow = useCallback(
    async (adapter: GameAdapter, targetUserId: string) => {
      cancelledRef.current = false;
      pollAttemptsRef.current = 0;
      setError(null);
      setStatus("creating_room");

      let createdRoomId: string;
      try {
        createdRoomId = await adapter.createRoom();
        const { playerIndex } = await adapter.joinAsHost(createdRoomId);
        if (cancelledRef.current) return;
        setRoomId(createdRoomId);
        setMyPlayerIndex(playerIndex);
      } catch {
        if (cancelledRef.current) return;
        setStatus("error");
        setError("Failed to create room. / 部屋の作成に失敗しました。");
        return;
      }

      try {
        await adapter.sendInvite(
          createdRoomId,
          targetUserId,
          fromUserId,
          fromUserName,
        );
      } catch {
        if (cancelledRef.current) return;
        setStatus("error");
        setError("Failed to send invite. / 招待の送信に失敗しました。");
        return;
      }

      if (cancelledRef.current) return;
      setStatus("waiting_for_accept");

      // ── Poll loop ───────────────────────────────────────────────────────
      const poll = async () => {
        if (cancelledRef.current) return;

        pollAttemptsRef.current += 1;
        if (pollAttemptsRef.current > maxPollAttempts) {
          setStatus("error");
          setError(
            "Invite timed out. / 招待がタイムアウトしました。",
          );
          return;
        }

        try {
          const count = await adapter.getPlayerCount(createdRoomId);
          if (cancelledRef.current) return;
          if (count > 1) {
            setStatus("opponent_joined");
            return; // stop polling — caller's effect on `status` handles navigation
          }
        } catch {
          // Transient fetch error — keep polling rather than failing the
          // whole flow over a single dropped request.
        }

        if (!cancelledRef.current) {
          pollTimerRef.current = setTimeout(poll, pollIntervalMs);
        }
      };

      pollTimerRef.current = setTimeout(poll, pollIntervalMs);
    },
    [fromUserId, fromUserName, pollIntervalMs, maxPollAttempts],
  );

  return { status, roomId, myPlayerIndex, error, startInviteFlow, cancel };
}
