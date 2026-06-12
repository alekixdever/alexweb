"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Menu, Bell, Search, Sun, Moon, Plus, User } from "lucide-react";
import InfoModal from "./InfoModal";

export default function Header() {
  const {
    isLoggedIn,
    setLeftDrawer,
    setRightDrawer,
    theme,
    toggleTheme,
    userRole,
  } = useApp();
  const [infoOpen, setInfoOpen] = useState(false);
  const isLight = theme === "light";
  const router = useRouter();

  return (
    <>
      <header
        style={{
          height: "var(--header-height)",
          background: "var(--bg-card)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 10,
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
          boxShadow: "0 1px 0 var(--border), var(--shadow-sm)",
        }}
      >
        {/* Mobile menu */}
        <button
          onClick={() => setLeftDrawer(true)}
          className="lg:hidden"
          style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--fg-secondary)",
            flexShrink: 0,
          }}
        >
          <Menu size={16} />
        </button>

        {/* Logo — clickable */}
        <button
          onClick={() => setInfoOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: "var(--radius-sm)",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-glass)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="About 天神書齋"
        >
          {/* Icon */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              flexShrink: 0,
              background:
                "linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 16,
              color: "#fff",
              boxShadow: "0 4px 12px var(--accent-glow)",
              fontFamily: "serif",
            }}
          >
            天
          </div>

          {/* Name */}
          <div className="hidden sm:block">
            <p
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--fg-primary)",
                letterSpacing: "0.02em",
                lineHeight: 1.1,
                fontFamily: "serif",
              }}
            >
              天神書齋
            </p>
            <p
              style={{
                fontSize: 10,
                color: "var(--fg-muted)",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              Tenjin Shosai
            </p>
          </div>
        </button>

        {/* Search */}
        <div
          style={{
            flex: 1,
            maxWidth: 380,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "7px 12px",
            transition: "all 0.2s",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-hover)")
          }
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <Search
            size={13}
            style={{ color: "var(--fg-muted)", flexShrink: 0 }}
          />
          <input
            placeholder="Search events / イベントを検索..."
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--fg-primary)",
              fontSize: 13,
              width: "100%",
            }}
          />
        </div>

        {/* Right actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          {isLoggedIn && (
            <button
              className="hidden sm:flex"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent2))",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "7px 12px",
                cursor: "pointer",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                boxShadow: "0 4px 12px var(--accent-glow)",
              }}
            >
              <Plus size={13} /> New Event
            </button>
          )}

          {/* Admin link — super_admin only */}
          {userRole === "super_admin" && (
            <button
              onClick={() => router.push("/admin")}
              title="Admin Panel"
              style={{
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                color: "var(--accent-bright)",
                transition: "all 0.2s",
              }}
            >
              ⚙️
            </button>
          )}

          <button
            onClick={toggleTheme}
            title={isLight ? "Switch to Dark" : "Switch to Light"}
            style={{
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: isLight ? "var(--accent)" : "var(--fg-secondary)",
              transition: "all 0.2s",
            }}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            style={{
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--fg-secondary)",
              position: "relative",
            }}
          >
            <Bell size={15} />
            <span
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent2)",
                boxShadow: "0 0 6px var(--accent2-glow)",
              }}
            />
          </button>

          <button
            onClick={() => setRightDrawer(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: isLoggedIn ? "var(--bg-glass)" : "var(--accent)",
              border: isLoggedIn ? "1px solid var(--border)" : "none",
              borderRadius: "var(--radius-sm)",
              padding: "7px 12px",
              cursor: "pointer",
              color: isLoggedIn ? "var(--fg-secondary)" : "#fff",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: !isLoggedIn ? "0 4px 12px var(--accent-glow)" : "none",
              transition: "all 0.2s",
            }}
          >
            <User size={14} />
            <span className="hidden sm:block">
              {isLoggedIn ? "Profile" : "Login"}
            </span>
          </button>
        </div>
      </header>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}
