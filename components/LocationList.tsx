"use client";

import { locations } from "@/data/locations";
import { MapPin, LayoutGrid } from "lucide-react";

interface Props {
  selectedLocation: string;
  onSelect: (id: string) => void;
}

export default function LocationList({ selectedLocation, onSelect }: Props) {
  const allItem = {
    id: "all",
    name: "All Venues",
    nameJa: "全会場",
    color: "var(--accent-bright)",
    colorBg: "rgba(139,92,246,0.12)",
  };
  const items = [allItem, ...locations];

  return (
    <div>
      {items.map((loc) => {
        const isActive = selectedLocation === loc.id;
        const isAll = loc.id === "all";
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              backgroundColor: isActive ? loc.colorBg : "transparent",
              borderLeft: isActive
                ? `2px solid ${loc.color}`
                : "2px solid transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = "var(--bg-glass)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                background: isActive ? loc.colorBg : "var(--bg-glass)",
                border: `1px solid ${isActive ? loc.color : "var(--border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {isAll ? (
                <LayoutGrid
                  size={13}
                  style={{ color: isActive ? loc.color : "var(--fg-muted)" }}
                />
              ) : (
                <MapPin
                  size={13}
                  style={{ color: isActive ? loc.color : "var(--fg-muted)" }}
                />
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--fg-primary)" : "var(--fg-secondary)",
                }}
              >
                {loc.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                {"nameJa" in loc ? loc.nameJa : ""}
              </div>
            </div>
            {isActive && (
              <div
                style={{
                  marginLeft: "auto",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: loc.color,
                  boxShadow: `0 0 8px ${loc.color}`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
