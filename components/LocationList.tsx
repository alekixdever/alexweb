"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, LayoutGrid } from "lucide-react";

interface Location {
  id: string;
  name: string;
  name_ja: string;
  region: string;
  color: string;
  color_bg: string;
}

interface Props {
  selectedLocation: string;
  onSelect: (id: string) => void;
}

export default function LocationList({ selectedLocation, onSelect }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("name");
      setLocations(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const allItem = {
    id: "all",
    name: "All Venues",
    name_ja: "全会場",
    region: "",
    color: "var(--accent-bright)",
    color_bg: "rgba(139,92,246,0.12)",
  };

  const items = [allItem, ...locations];

  if (loading) {
    return (
      <div style={{ padding: "12px 16px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 44,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-glass)",
              marginBottom: 4,
            }}
          />
        ))}
      </div>
    );
  }

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
              backgroundColor: isActive ? loc.color_bg : "transparent",
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
                background: isActive ? loc.color_bg : "var(--bg-glass)",
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
                {loc.name_ja}
                {loc.region ? ` · ${loc.region}` : ""}
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
