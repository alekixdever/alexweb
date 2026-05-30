"use client";

import { useApp } from "@/context/AppContext";
import { Menu, Bell, User, Search, Sun, Moon } from "lucide-react";

export default function Header() {
  const {
    isLoggedIn,
    logout,
    setLeftDrawer,
    setRightDrawer,
    theme,
    toggleTheme,
  } = useApp();

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const isLight = theme === "light";

  return (
    <header
      style={{
        height: "var(--header-height)",
        background: isLight ? "rgba(255,255,255,0.8)" : "var(--card)",
        backdropFilter: isLight ? "blur(12px)" : "none",
        WebkitBackdropFilter: isLight ? "blur(12px)" : "none",
        borderBottom: "1px solid var(--card-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: isLight ? "0 2px 20px var(--shadow)" : "none",
        transition: "all 0.3s",
      }}
    >
      {/* Mobile menu trigger */}
      <button
        onClick={() => setLeftDrawer(true)}
        style={{
          color: "var(--muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          padding: "6px",
        }}
        className="lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 13,
            color: "#fff",
            boxShadow: isLight ? "0 4px 12px rgba(108,92,231,0.35)" : "none",
          }}
        >
          M
        </div>
        <span
          style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}
          className="hidden sm:block"
        >
          MESP
        </span>
      </div>

      {/* Date */}
      <span
        style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}
        className="hidden lg:block"
      >
        {today}
      </span>

      {/* Search */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: isLight ? "rgba(240,242,255,0.8)" : "var(--background)",
          border: "1px solid var(--card-border)",
          borderRadius: 8,
          padding: "6px 12px",
          maxWidth: 400,
          transition: "all 0.3s",
        }}
      >
        <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
        <input
          placeholder="Search events, venues... / イベントを検索..."
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--foreground)",
            fontSize: 13,
            width: "100%",
          }}
        />
      </div>

      {/* Right icons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginLeft: "auto",
          flexShrink: 0,
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isLight ? "Switch to Dark" : "Switch to Light"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: isLight
              ? "rgba(108,92,231,0.1)"
              : "rgba(255,255,255,0.06)",
            color: isLight ? "var(--accent)" : "var(--muted)",
            transition: "all 0.2s",
          }}
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notification */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
          }}
        >
          <Bell size={18} />
        </button>

        {/* User / Login */}
        <button
          onClick={() => setRightDrawer(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: isLoggedIn
              ? isLight
                ? "rgba(108,92,231,0.1)"
                : "var(--accent2)"
              : "var(--accent)",
            border: "none",
            cursor: "pointer",
            color: isLoggedIn && isLight ? "var(--accent)" : "#fff",
            padding: "6px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            boxShadow:
              !isLoggedIn && isLight
                ? "0 4px 12px rgba(108,92,231,0.35)"
                : "none",
            transition: "all 0.2s",
          }}
        >
          <User size={15} />
          <span className="hidden sm:block">
            {isLoggedIn ? "Profile" : "Login"}
          </span>
        </button>
      </div>
    </header>
  );
}
