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
export type PendingInviteFlowStatus =
  | "creating_room"
  | "waiting_for_accept"
  | "opponent_joined"
  | "error";

export interface PendingInviteFlow {
  gameId: "nana" | "snake";
  roomId: string;
  targetUserId: string;
  status: PendingInviteFlowStatus;
  errorMessage?: string;
}

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
  pendingInviteFlow: PendingInviteFlow | null;
  startGameInvite: (
    gameId: "nana" | "snake",
    targetUserId: string,
    adapter: GameInviteAdapter,
  ) => Promise<void>;
  cancelGameInvite: () => void;
  clearPendingInviteFlow: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getAutoTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as Theme) ?? getAutoTheme();
}

function getInitialSound(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("nanaInviteSound") !== "false";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  // ── Theme & sound read from localStorage at init time (not in an effect)
  // to avoid the "setState synchronously in effect" lint warning.
  const [state, setState] = useState<AppState>(() => ({
    isLoggedIn: false,
    user: null,
    userRole: null,
    authModalOpen: false,
    authModalAction: "",
    pendingAction: null,
    leftDrawerOpen: false,
    rightDrawerOpen: false,
    theme: getInitialTheme(),
    columnLayout: 1,
  }));

  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const inviteFnRef = useRef<((targetUserId: string) => void) | undefined>(undefined);
  const [inviteContact, setInviteContact] = useState<
    ((targetUserId: string) => void) | undefined
  >(undefined);

  const [nanaInviteSoundEnabled, setNanaInviteSoundEnabled] = useState<boolean>(
    getInitialSound,
  );

  // ── Background invite flow state ──────────────────────────────────────
  const [pendingInviteFlow, setPendingInviteFlowState] =
    useState<PendingInviteFlow | null>(null);
  const inviteFlowCancelledRef = useRef(false);
  const inviteFlowPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inviteFlowPollAttemptsRef = useRef(0);
  const INVITE_FLOW_POLL_INTERVAL_MS = 2000;
  const INVITE_FLOW_MAX_POLL_ATTEMPTS = 15;

  // Apply theme attribute to <html> on mount / theme change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

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
    setState((prev) => ({ ...prev, theme: next }));
  };

  const setColumnLayout = (col: ColumnLayout) =>
    setState((prev) => ({ ...prev, columnLayout: col }));

  // ── Game invite ───────────────────────────────────────────────────────────
  const registerGameInvite = useCallback(
    (gameId: string, roomId: string, inviteFn: (targetUserId: string) => void) => {
      inviteFnRef.current = inviteFn;
      setActiveGame({ gameId, roomId });
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
    setPendingInviteFlowState(null);
  }, []);

  const startGameInvite = useCallback(
    async (
      gameId: "nana" | "snake",
      targetUserId: string,
      adapter: GameInviteAdapter,
    ) => {
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
                errorMessage: "Failed to create room. / 部屋の作成に失敗しました。",
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
                errorMessage: "Failed to send invite. / 招待の送信に失敗しました。",
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
            return;
          }
        } catch {
          // Transient fetch error — keep polling
        }

        if (!inviteFlowCancelledRef.current) {
          inviteFlowPollTimerRef.current = setTimeout(poll, INVITE_FLOW_POLL_INTERVAL_MS);
        }
      };

      inviteFlowPollTimerRef.current = setTimeout(poll, INVITE_FLOW_POLL_INTERVAL_MS);
    },
    [state.user, stopInvitePolling],
  );

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
