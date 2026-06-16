"use client";

import { useState } from "react";
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

  return (
    <div>
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
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <p className="label-xs">Date / 日付</p>
        <button
          onClick={goToday}
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "none",
            color: "var(--fg-muted)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-bright)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
        >
          Today
        </button>
      </div>

      {/* Month navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-bright)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
        >
          <ChevronLeft size={13} />
        </button>

        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--fg-secondary)",
            textAlign: "center",
          }}
        >
          {monthLabel}
        </p>

        <button
          onClick={nextMonth}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "none",
            cursor: "pointer",
            color: "var(--fg-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-bright)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      <MonthGrid
        year={viewYear}
        month={viewMonth}
        selectedDate={selectedDate}
        onSelect={onSelect}
      />

      <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

      {(() => {
        const secondDate = new Date(viewYear, viewMonth + 1, 1);
        const secondYear = secondDate.getFullYear();
        const secondMonth = secondDate.getMonth();
        const secondLabel = secondDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
        return (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-secondary)", textAlign: "center", marginBottom: 10 }}>
              {secondLabel}
            </p>
            <MonthGrid
              year={secondYear}
              month={secondMonth}
              selectedDate={selectedDate}
              onSelect={onSelect}
            />
          </>
        );
      })()}
    </div>
  );
}
