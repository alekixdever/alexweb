"use client";

import { locations } from "@/data/locations";
import { MapPin } from "lucide-react";

interface Props {
  selectedLocation: string;
  onSelect: (id: string) => void;
}

export default function LocationList({ selectedLocation, onSelect }: Props) {
  return (
    <div style={{ padding: "12px 0" }}>
      <p
        style={{
          fontSize: 11,
          color: "var(--muted)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          padding: "0 16px 8px",
          textTransform: "uppercase",
        }}
      >
        Venues / 会場
      </p>
      {locations.map((loc) => (
        <button
          key={loc.id}
          onClick={() => onSelect(loc.id)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            borderRadius: 0,
            textAlign: "left",
            backgroundColor:
              selectedLocation === loc.id
                ? "rgba(233,69,96,0.12)"
                : "transparent",
            borderLeft:
              selectedLocation === loc.id
                ? "3px solid var(--accent)"
                : "3px solid transparent",
            transition: "all 0.15s",
          }}
        >
          <MapPin
            size={14}
            style={{
              color:
                selectedLocation === loc.id ? "var(--accent)" : "var(--muted)",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: selectedLocation === loc.id ? 600 : 400,
                color:
                  selectedLocation === loc.id ? "#fff" : "var(--foreground)",
              }}
            >
              {loc.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {loc.region}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
