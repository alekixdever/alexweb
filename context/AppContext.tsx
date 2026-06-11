"use client";

// 先頭に追加
import { createClient } from "@/lib/supabase/client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type PendingActionType = "JOIN_EVENT" | "COMMENT" | "VIEW_PARTICIPANTS";
type Theme = "dark" | "light";
type ColumnLayout = 1 | 3;

interface PendingAction {
  type: PendingActionType;
  eventId: string;
  payload?: string;
}

interface AppState {
  isLoggedIn: boolean;
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
  logout: () => void;
  openAuthModal: (action: string, pending: PendingAction) => void;
  closeAuthModal: () => void;
  setLeftDrawer: (open: boolean) => void;
  setRightDrawer: (open: boolean) => void;
  toggleTheme: () => void;
  setColumnLayout: (col: ColumnLayout) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getAutoTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    authModalOpen: false,
    authModalAction: "",
    pendingAction: null,
    leftDrawerOpen: false,
    rightDrawerOpen: false,
    theme: getAutoTheme(),
    columnLayout: 1,
  });

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  // Auto theme check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const autoTheme = getAutoTheme();
        if (prev.theme !== autoTheme) {
          return { ...prev, theme: autoTheme };
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const supabase = createClient();

  const login = () =>
    setState((prev) => ({ ...prev, isLoggedIn: true, authModalOpen: false }));

  const logout = async () => {
    await supabase.auth.signOut();
    setState((prev) => ({ ...prev, isLoggedIn: false, pendingAction: null }));
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

  const toggleTheme = () =>
    setState((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));

  const setColumnLayout = (col: ColumnLayout) =>
    setState((prev) => ({ ...prev, columnLayout: col }));

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
