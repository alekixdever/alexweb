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

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          zIndex: 90,
          [side]: 0,
          width: "var(--sidebar-width)",
          background: "var(--card)",
          borderRight:
            side === "left" ? "1px solid var(--card-border)" : "none",
          borderLeft:
            side === "right" ? "1px solid var(--card-border)" : "none",
          transform: isOpen
            ? "translateX(0)"
            : `translateX(${side === "left" ? "-100%" : "100%"})`,
          transition: "transform 0.25s ease",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "12px 12px 0",
          }}
        >
          <button
            onClick={close}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
