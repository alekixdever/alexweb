"use client";

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
      {/* Venues card */}
      <div className="float-card" style={{ padding: "16px 0", flexShrink: 0 }}>
        <p className="label-xs" style={{ padding: "0 16px 10px" }}>
          Venues / 会場
        </p>
        <LocationList
          selectedLocation={selectedLocation}
          onSelect={onLocationSelect}
        />
      </div>

      {/* Calendar card */}
      <div className="float-card" style={{ padding: "16px", flexShrink: 0 }}>
        <Calendar selectedDate={selectedDate} onSelect={onDateSelect} />
      </div>
    </aside>
  );
}
