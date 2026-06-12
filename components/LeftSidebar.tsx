"use client";

import { useState } from "react";
import { MapPin, Tag } from "lucide-react";
import LocationList from "./LocationList";
import Calendar from "./Calendar";
import ActivityList from "./ActivityList";

interface Props {
  selectedLocation: string;
  selectedDate: string;
  selectedCategory: string;
  onLocationSelect: (id: string) => void;
  onDateSelect: (date: string) => void;
  onCategorySelect: (id: string) => void;
}

export default function LeftSidebar({
  selectedLocation,
  selectedDate,
  selectedCategory,
  onLocationSelect,
  onDateSelect,
  onCategorySelect,
}: Props) {
  const [activeTab, setActiveTab] = useState<"venues" | "activities">("venues");

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--gap)",
        overflowY: "auto",
        paddingRight: 2,
      }}
    >
      {/* Tab switcher */}
      <div
        className="float-card"
        style={{
          padding: "6px",
          display: "flex",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {(
          [
            {
              id: "venues",
              label: "Venues",
              labelJa: "会場",
              icon: <MapPin size={12} />,
            },
            {
              id: "activities",
              label: "Activities",
              labelJa: "アクティビティ",
              icon: <Tag size={12} />,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "8px 6px",
              background:
                activeTab === tab.id ? "var(--accent)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 0.2s",
              color: activeTab === tab.id ? "#fff" : "var(--fg-muted)",
            }}
          >
            {tab.icon}
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.1 }}>
                {tab.label}
              </p>
              <p style={{ fontSize: 9, lineHeight: 1.1, opacity: 0.8 }}>
                {tab.labelJa}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Venues tab */}
      {activeTab === "venues" && (
        <div
          className="float-card"
          style={{ padding: "16px 0", flexShrink: 0 }}
        >
          <p className="label-xs" style={{ padding: "0 16px 10px" }}>
            Venues / 会場
          </p>
          <LocationList
            selectedLocation={selectedLocation}
            onSelect={onLocationSelect}
          />
        </div>
      )}

      {/* Activities tab */}
      {activeTab === "activities" && (
        <div
          className="float-card"
          style={{ padding: "16px 0", flexShrink: 0 }}
        >
          <p className="label-xs" style={{ padding: "0 16px 10px" }}>
            Activities / アクティビティ
          </p>
          <ActivityList
            selectedCategory={selectedCategory}
            onSelect={onCategorySelect}
          />
        </div>
      )}

      {/* Calendar — always visible */}
      <div className="float-card" style={{ padding: "16px", flexShrink: 0 }}>
        <Calendar selectedDate={selectedDate} onSelect={onDateSelect} />
      </div>
    </aside>
  );
}
