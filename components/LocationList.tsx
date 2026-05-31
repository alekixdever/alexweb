"use client";

import { locations } from "@/data/locations";
import { MapPin } from "lucide-react";

interface Props {
  selectedLocation: string;
  onSelect: (id: string) => void;
}

export default function LocationList({ selectedLocation, onSelect }: Props) {
  return (
    <div>
      {locations.map((loc) => {
        const isActive = selectedLocation === loc.id;
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
              backgroundColor: isActive
                ? "rgba(139,92,246,0.1)"
                : "transparent",
              borderLeft: isActive
                ? "2px solid var(--accent)"
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
                background: isActive
                  ? "rgba(139,92,246,0.2)"
                  : "var(--bg-glass)",
                border: `1px solid ${isActive ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <MapPin
                size={13}
                style={{
                  color: isActive ? "var(--accent-bright)" : "var(--fg-muted)",
                }}
              />
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
                {loc.region}
              </div>
            </div>
            {isActive && (
              <div
                style={{
                  marginLeft: "auto",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent-glow)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
