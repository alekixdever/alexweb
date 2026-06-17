"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type PendingActionType = "JOIN_EVENT" | "COMMENT" | "VIEW_PARTICIPANTS";
type Theme = "dark" | "light";
type ColumnLayout = 1 | 3;

interface PendingAction {
  type: PendingActionType;
  eventId: string;
  payload?: string;
}

// ── Game Invite ───────────────────────────────────────────────────────────
export interface ActiveGame {
  gameId: string;
  roomId: string;
}

// ── Background invite flow (2026-06-17, Jane/Max design) ──────────────────
// Lets RightSidebar invite an online contact to a game WITHOUT the inviter
// first entering that game's lobby — the room is created in the background
// and the inviter is navigated in once the invitee accepts. See
// hooks/useGameInviteFlow.ts for the polling logic this state mirrors.
export type PendingInviteFlowStatus =
  | "creating_room"
  | "waiting_for_accept"
  | "opponent_joined"
  | "error"; // 30s timeout, room creation failure, or invite-send failure

export interface PendingInviteFlow {
  gameId: "nana" | "snake";
  roomId: string;
  targetUserId: string;
  status: PendingInviteFlowStatus;
  errorMessage?: string;
}

/** Mirrors GameAdapter in hooks/useGameInviteFlow.ts — declared separately
 *  here (rather than imported) to avoid a circular dependency between this
 *  context file and the hook that will be driven from inside it. */
export interface GameInviteAdapter {
  createRoom: () => Promise<string>;
  joinAsHost: (roomId: string) => Promise<{ playerIndex: number }>;
  sendInvite: (
    roomId: string,
    targetUserId: string,
    fromUserId: string,
    fromUserName: string,
  ) => Promise<void>;
  getPlayerCount: (roomId: string) => Promise<number>;
}

interface AppState {
  isLoggedIn: boolean;
  user: User | null;
  userRole: "member" | "admin" | "super_admin" | null;
  authModalOpen: boolean;
  authModalAction: string;
  pendingAction: PendingAction | null;
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  theme: Theme;
  columnLayout: ColumnLayout;
}

interface AppContextType extends AppState {
  login: () => void;
  userRole: "member" | "admin" | "super_admin" | null;
  logout: () => Promise<void>;
  openAuthModal: (action: string, pending: PendingAction) => void;
  closeAuthModal: () => void;
  setLeftDrawer: (open: boolean) => void;
  setRightDrawer: (open: boolean) => void;
  toggleTheme: () => void;
  setColumnLayout: (col: ColumnLayout) => void;
  // Generic game invite system
  activeGame: ActiveGame | null;
  inviteContact: ((targetUserId: string) => void) | undefined;
  registerGameInvite: (
    gameId: string,
    roomId: string,
    inviteFn: (targetUserId: string) => void,
  ) => void;
  unregisterGameInvite: () => void;
  nanaInviteSoundEnabled: boolean;
  toggleNanaInviteSound: () => void;
  // Background invite flow — see PendingInviteFlow above
  pendingInviteFlow: PendingInviteFlow | null;
  /** Start a background invite: creates the room, joins as host, sends the
   *  invite, and polls until the invitee joins. Runs inside AppProvider so
   *  it keeps running even if RightSidebar (or whatever called this)
   *  unmounts due to navigation. */
  startGameInvite: (
    gameId: "nana" | "snake",
    targetUserId: string,
    adapter: GameInviteAdapter,
  ) => Promise<void>;
  /** Cancel the in-flight invite flow, if any, and clear pendingInviteFlow. */
  cancelGameInvite: () => void;
  /** Clear pendingInviteFlow without cancelling polling — used after the
   *  inviter has been successfully navigated into the game on
   *  opponent_joined, so the banner disappears. */
  clearPendingInviteFlow: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getAutoTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as Theme) ?? getAutoTheme();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    user: null,
    userRole: null,
    authModalOpen: false,
    authModalAction: "",
    pendingAction: null,
    leftDrawerOpen: false,
    rightDrawerOpen: false,
    theme: "dark",
    columnLayout: 1,
  });

  // Game invite — ref for inviteFn (avoids setState double-wrap bug)
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const inviteFnRef = useRef<((targetUserId: string) => void) | undefined>(undefined);
  const [inviteContact, setInviteContact] = useState<
    ((targetUserId: string) => void) | undefined
  >(undefined);

  const [nanaInviteSoundEnabled, setNanaInviteSoundEnabled] = useState(true);

  // ── Background invite flow state ──────────────────────────────────────
  // Lives in AppProvider (not RightSidebar) specifically so the polling
  // loop below survives navigation — RightSidebar can unmount/remount
  // freely without interrupting an in-flight invite.
  const [pendingInviteFlow, setPendingInviteFlowState] =
    useState<PendingInviteFlow | null>(null);
  const inviteFlowCancelledRef = useRef(false);
  const inviteFlowPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inviteFlowPollAttemptsRef = useRef(0);
  const INVITE_FLOW_POLL_INTERVAL_MS = 2000;
  const INVITE_FLOW_MAX_POLL_ATTEMPTS = 15; // 15 * 2s = 30s timeout

  // Apply theme from localStorage on mount (client only)
  useEffect(() => {
    const saved = getStoredTheme();
    document.documentElement.setAttribute("data-theme", saved);
    setState((prev) => ({ ...prev, theme: saved }));
    const sound = localStorage.getItem("nanaInviteSound");
    if (sound === "false") setNanaInviteSoundEnabled(false);
  }, []);

  useEffect(() => {
    const fetchSessionAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", session.user.id)
          .single();
        setState((prev) => ({
          ...prev,
          isLoggedIn: true,
          user: session.user,
          userRole: profile?.role ?? "member",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoggedIn: false,
          user: null,
          userRole: null,
        }));
      }
    };
    fetchSessionAndRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", session.user.id)
          .single();

        setState((prev) => {
          const pending = prev.pendingAction;

          if (pending?.type === "JOIN_EVENT" && pending.eventId) {
            supabase
              .from("event_participants")
              .insert({ event_id: pending.eventId, user_id: session.user.id })
              .then(() => {});
          }

          return {
            ...prev,
            isLoggedIn: true,
            user: session.user,
            userRole: profile?.role ?? "member",
            authModalOpen: false,
            pendingAction: null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLoggedIn: false,
          user: null,
          userRole: null,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = () => setState((prev) => ({ ...prev, authModalOpen: false }));

  const logout = async () => {
    await supabase.auth.signOut();
    setState((prev) => ({
      ...prev,
      isLoggedIn: false,
      user: null,
      pendingAction: null,
    }));
  };

  const openAuthModal = (action: string, pending: PendingAction) =>
    setState((prev) => ({
      ...prev,
      authModalOpen: true,
      authModalAction: action,
      pendingAction: pending,
    }));

  const closeAuthModal = () =>
    setState((prev) => ({
      ...prev,
      authModalOpen: false,
      authModalAction: "",
      pendingAction: null,
    }));

  const setLeftDrawer = (open: boolean) =>
    setState((prev) => ({ ...prev, leftDrawerOpen: open }));

  const setRightDrawer = (open: boolean) =>
    setState((prev) => ({ ...prev, rightDrawerOpen: open }));

  const toggleTheme = () => {
    const next = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    setState((prev) => ({ ...prev, theme: next }));
  };

  const setColumnLayout = (col: ColumnLayout) =>
    setState((prev) => ({ ...prev, columnLayout: col }));

  // ── Game invite ───────────────────────────────────────────────────────────
  const registerGameInvite = useCallback(
    (gameId: string, roomId: string, inviteFn: (targetUserId: string) => void) => {
      inviteFnRef.current = inviteFn;
      setActiveGame({ gameId, roomId });
      // 用 wrapper 避免 React setState 把 function 當 updater 執行
      setInviteContact(() => (targetUserId: string) => {
        inviteFnRef.current?.(targetUserId);
      });
    },
    [],
  );

  const unregisterGameInvite = useCallback(() => {
    inviteFnRef.current = undefined;
    setActiveGame(null);
    setInviteContact(undefined);
  }, []);

  // ── Background invite flow ─────────────────────────────────────────────
  const stopInvitePolling = useCallback(() => {
    if (inviteFlowPollTimerRef.current) {
      clearTimeout(inviteFlowPollTimerRef.current);
      inviteFlowPollTimerRef.current = null;
    }
  }, []);

  const cancelGameInvite = useCallback(() => {
    inviteFlowCancelledRef.current = true;
    stopInvitePolling();
    inviteFlowPollAttemptsRef.current = 0;
    setPendingInviteFlowState(null);
  }, [stopInvitePolling]);

  const clearPendingInviteFlow = useCallback(() => {
    // Does NOT cancel polling — only used after a successful hand-off
    // (opponent_joined → inviter navigated in) to dismiss the banner.
    setPendingInviteFlowState(null);
  }, []);

  const startGameInvite = useCallback(
    async (
      gameId: "nana" | "snake",
      targetUserId: string,
      adapter: GameInviteAdapter,
    ) => {
      // Only one in-flight invite at a time — cancel any existing one first.
      stopInvitePolling();
      inviteFlowCancelledRef.current = false;
      inviteFlowPollAttemptsRef.current = 0;

      setPendingInviteFlowState({
        gameId,
        roomId: "",
        targetUserId,
        status: "creating_room",
      });

      const currentUser = state.user;
      if (!currentUser) {
        setPendingInviteFlowState((prev) =>
          prev ? { ...prev, status: "error", errorMessage: "Not logged in." } : prev,
        );
        return;
      }

      let roomId: string;
      try {
        roomId = await adapter.createRoom();
        await adapter.joinAsHost(roomId);
      } catch {
        if (inviteFlowCancelledRef.current) return;
        setPendingInviteFlowState((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                errorMessage:
                  "Failed to create room. / 部屋の作成に失敗しました。",
              }
            : prev,
        );
        return;
      }

      if (inviteFlowCancelledRef.current) return;
      setPendingInviteFlowState((prev) =>
        prev ? { ...prev, roomId, status: "waiting_for_accept" } : prev,
      );

      const fromUserName =
        currentUser.user_metadata?.name ??
        currentUser.email?.split("@")[0] ??
        "Member";

      try {
        await adapter.sendInvite(roomId, targetUserId, currentUser.id, fromUserName);
      } catch {
        if (inviteFlowCancelledRef.current) return;
        setPendingInviteFlowState((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                errorMessage:
                  "Failed to send invite. / 招待の送信に失敗しました。",
              }
            : prev,
        );
        return;
      }

      // ── Poll loop ─────────────────────────────────────────────────────
      const poll = async () => {
        if (inviteFlowCancelledRef.current) return;

        inviteFlowPollAttemptsRef.current += 1;
        if (inviteFlowPollAttemptsRef.current > INVITE_FLOW_MAX_POLL_ATTEMPTS) {
          setPendingInviteFlowState((prev) =>
            prev
              ? {
                  ...prev,
                  status: "error",
                  errorMessage: "Invite timed out. / 招待がタイムアウトしました。",
                }
              : prev,
          );
          return;
        }

        try {
          const count = await adapter.getPlayerCount(roomId);
          if (inviteFlowCancelledRef.current) return;
          if (count > 1) {
            setPendingInviteFlowState((prev) =>
              prev ? { ...prev, status: "opponent_joined" } : prev,
            );
            return; // stop polling — caller's effect on status handles navigation
          }
        } catch {
          // Transient fetch error — keep polling rather than failing the
          // whole flow over a single dropped request.
        }

        if (!inviteFlowCancelledRef.current) {
          inviteFlowPollTimerRef.current = setTimeout(poll, INVITE_FLOW_POLL_INTERVAL_MS);
        }
      };

      inviteFlowPollTimerRef.current = setTimeout(poll, INVITE_FLOW_POLL_INTERVAL_MS);
    },
    [state.user, stopInvitePolling],
  );

  // Stop polling if the provider itself ever unmounts (e.g. hot reload) —
  // belt-and-suspenders cleanup, AppProvider normally lives for the whole
  // app session.
  useEffect(() => {
    return () => stopInvitePolling();
  }, [stopInvitePolling]);

  const toggleNanaInviteSound = useCallback(() => {
    setNanaInviteSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("nanaInviteSound", String(next));
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        openAuthModal,
        closeAuthModal,
        setLeftDrawer,
        setRightDrawer,
        toggleTheme,
        setColumnLayout,
        activeGame,
        inviteContact,
        registerGameInvite,
        unregisterGameInvite,
        nanaInviteSoundEnabled,
        toggleNanaInviteSound,
        pendingInviteFlow,
        startGameInvite,
        cancelGameInvite,
        clearPendingInviteFlow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
