"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  selectedDate: string;
  onSelect: (dateStr: string) => void;
}

function MonthGrid({
  year,
  month,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onSelect: (s: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];
  const pad = (n: number) => String(n).padStart(2, "0");
  const toStr = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--fg-secondary)",
          marginBottom: 10,
          textAlign: "center",
        }}
      >
        {monthLabel}
      </p>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 10,
              color: "var(--fg-muted)",
              textAlign: "center",
              padding: "2px 0",
              fontWeight: 500,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const str = toStr(day);
          const isSelected = str === selectedDate;
          const isToday = str === todayStr;
          return (
            <button
              key={str}
              onClick={() => onSelect(str)}
              style={{
                width: "100%",
                aspectRatio: "1",
                fontSize: 11,
                border:
                  isToday && !isSelected
                    ? "1px solid rgba(139,92,246,0.4)"
                    : "1px solid transparent",
                cursor: "pointer",
                borderRadius: 6,
                fontWeight: isToday ? 700 : 400,
                background: isSelected
                  ? "var(--accent)"
                  : isToday
                    ? "rgba(139,92,246,0.12)"
                    : "transparent",
                color: isSelected
                  ? "#fff"
                  : isToday
                    ? "var(--accent-bright)"
                    : "var(--fg-secondary)",
                boxShadow: isSelected ? "0 2px 8px var(--accent-glow)" : "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "var(--bg-glass)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = isToday
                    ? "rgba(139,92,246,0.12)"
                    : "transparent";
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Calendar({ selectedDate, onSelect }: Props) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const nextMonthDate = new Date(thisYear, thisMonth + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();

  return (
    <div>
      <p className="label-xs" style={{ marginBottom: 12 }}>
        Date / 日付
      </p>
      <MonthGrid
        year={thisYear}
        month={thisMonth}
        selectedDate={selectedDate}
        onSelect={onSelect}
      />
      <div
        style={{ height: 1, background: "var(--border)", margin: "4px 0 16px" }}
      />
      <MonthGrid
        year={nextYear}
        month={nextMonth}
        selectedDate={selectedDate}
        onSelect={onSelect}
      />
    </div>
  );
}
