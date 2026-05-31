"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Props {
  side: "left" | "right";
  children: React.ReactNode;
}

export default function MobileDrawer({ side, children }: Props) {
  const { leftDrawerOpen, rightDrawerOpen, setLeftDrawer, setRightDrawer } =
    useApp();

  const isOpen = side === "left" ? leftDrawerOpen : rightDrawerOpen;
  const close = () =>
    side === "left" ? setLeftDrawer(false) : setRightDrawer(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(5,5,10,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          zIndex: 90,
          [side]: 0,
          width: "min(300px, 88vw)",
          background: "var(--bg-layer1)",
          borderRight: side === "left" ? "1px solid var(--border)" : "none",
          borderLeft: side === "right" ? "1px solid var(--border)" : "none",
          boxShadow:
            side === "left"
              ? "4px 0 40px rgba(0,0,0,0.5), 0 0 40px var(--accent-glow)"
              : "-4px 0 40px rgba(0,0,0,0.5), 0 0 40px var(--accent-glow)",
          transform: isOpen
            ? "translateX(0)"
            : `translateX(${side === "left" ? "-100%" : "100%"})`,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
          padding: "var(--gap)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--gap)",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}
        >
          <button
            onClick={close}
            style={{
              width: 30,
              height: 30,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--fg-muted)",
            }}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
