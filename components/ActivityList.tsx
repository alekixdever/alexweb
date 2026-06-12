"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  name_ja: string;
  color: string;
  color_bg: string;
}

interface Props {
  selectedCategory: string;
  onSelect: (id: string) => void;
}

export default function ActivityList({ selectedCategory, onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("activity_categories")
        .select("*")
        .order("name");
      setCategories(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const allItem = {
    id: "all",
    name: "All Activities",
    name_ja: "全アクティビティ",
    color: "var(--accent-bright)",
    color_bg: "rgba(139,92,246,0.12)",
  };

  const items = [allItem, ...categories];

  if (loading) {
    return (
      <div style={{ padding: "12px 16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 44,
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-glass)",
              marginBottom: 4,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {items.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const isAll = cat.id === "all";
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
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
              backgroundColor: isActive ? cat.color_bg : "transparent",
              borderLeft: isActive
                ? `2px solid ${cat.color}`
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
                background: isActive ? cat.color_bg : "var(--bg-glass)",
                border: `1px solid ${isActive ? cat.color : "var(--border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {isAll ? (
                <LayoutGrid
                  size={13}
                  style={{ color: isActive ? cat.color : "var(--fg-muted)" }}
                />
              ) : (
                <Tag
                  size={13}
                  style={{ color: isActive ? cat.color : "var(--fg-muted)" }}
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
                {cat.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-muted)" }}>
                {cat.name_ja}
              </div>
            </div>
            {isActive && (
              <div
                style={{
                  marginLeft: "auto",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: cat.color,
                  boxShadow: `0 0 8px ${cat.color}`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
