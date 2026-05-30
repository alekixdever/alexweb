"use client";

import { useApp } from "@/context/AppContext";
import LocationList from "./LocationList";
import Calendar from "./Calendar";

interface Props {
  selectedLocation: string;
  selectedDate: string;
  onLocationSelect: (id: string) => void;
  onDateSelect: (date: string) => void;
}

export default function LeftSidebar({
  selectedLocation,
  selectedDate,
  onLocationSelect,
  onDateSelect,
}: Props) {
  const { theme } = useApp();
  const isLight = theme === "light";

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        background: isLight ? "rgba(255,255,255,0.75)" : "var(--card)",
        backdropFilter: isLight ? "blur(12px)" : "none",
        WebkitBackdropFilter: isLight ? "blur(12px)" : "none",
        borderRight: "1px solid var(--card-border)",
        overflowY: "auto",
        flexShrink: 0,
        boxShadow: isLight ? "2px 0 20px var(--shadow)" : "none",
        transition: "all 0.3s",
      }}
    >
      <LocationList
        selectedLocation={selectedLocation}
        onSelect={onLocationSelect}
      />
      <div
        style={{ height: 1, background: "var(--card-border)", margin: "8px 0" }}
      />
      <Calendar selectedDate={selectedDate} onSelect={onDateSelect} />
    </aside>
  );
}
