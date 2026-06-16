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
