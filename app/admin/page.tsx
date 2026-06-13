"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Users,
  MapPin,
  Tag,
  Palette,
} from "lucide-react";

// ── Types ──────────────────────────────────────────
interface Location {
  id: string;
  name: string;
  name_ja: string;
  region: string;
  color: string;
  color_bg: string;
}

interface Category {
  id: string;
  name: string;
  name_ja: string;
  color: string;
  color_bg: string;
}

interface Profile {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

// ── Shared styles ──────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg-glass)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--fg-primary)",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

const btnPrimary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "0 4px 12px var(--accent-glow)",
};

const btnDanger: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: "rgba(248,113,113,0.1)",
  color: "var(--red)",
  border: "1px solid rgba(248,113,113,0.2)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: "var(--bg-glass)",
  color: "var(--fg-muted)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontSize: 11,
};

// ── Section Title ──────────────────────────────────
function SectionTitle({
  icon,
  en,
  ja,
}: {
  icon: React.ReactNode;
  en: string;
  ja: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(139,92,246,0.15)",
          border: "1px solid rgba(139,92,246,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-bright)",
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-primary)" }}
        >
          {en}
        </p>
        <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ja}</p>
      </div>
    </div>
  );
}

// ── Locations Section ──────────────────────────────
function LocationsSection() {
  const supabase = createClient();
  const [items, setItems] = useState<Location[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    name_ja: "",
    region: "",
    color: "#8b5cf6",
    color_bg: "rgba(139,92,246,0.12)",
  });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("locations").select("*").order("name");
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    if (editing) {
      await supabase.from("locations").update(form).eq("id", editing);
    } else {
      await supabase.from("locations").insert(form);
    }
    await load();
    setEditing(null);
    setAdding(false);
    setForm({
      name: "",
      name_ja: "",
      region: "",
      color: "#8b5cf6",
      color_bg: "rgba(139,92,246,0.12)",
    });
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this venue?")) return;
    await supabase.from("locations").delete().eq("id", id);
    await load();
  };

  const startEdit = (item: Location) => {
    setEditing(item.id);
    setAdding(true);
    setForm({
      name: item.name,
      name_ja: item.name_ja,
      region: item.region,
      color: item.color,
      color_bg: item.color_bg,
    });
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 20,
        marginBottom: 16,
      }}
    >
      <SectionTitle
        icon={<MapPin size={16} />}
        en="Venue Management"
        ja="会場管理"
      />

      {/* List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 12,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              borderLeft: `3px solid ${item.color}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                }}
              >
                {item.name}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                {item.name_ja} · {item.region}
              </p>
            </div>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <button style={btnGhost} onClick={() => startEdit(item)}>
              <Edit3 size={11} /> Edit
            </button>
            <button style={btnDanger} onClick={() => del(item.id)}>
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      {adding ? (
        <div
          style={{
            background: "var(--bg-layer2)",
            border: "1px solid var(--border-hover)",
            borderRadius: "var(--radius-sm)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Name (EN)
              </label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Kyoto Station"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Name (JA)
              </label>
              <input
                style={inputStyle}
                value={form.name_ja}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name_ja: e.target.value }))
                }
                placeholder="京都駅"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Region
              </label>
              <input
                style={inputStyle}
                value={form.region}
                onChange={(e) =>
                  setForm((p) => ({ ...p, region: e.target.value }))
                }
                placeholder="Kyoto 京都"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Color
              </label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      color: e.target.value,
                      color_bg: `${e.target.value}20`,
                    }))
                  }
                  style={{
                    width: 40,
                    height: 34,
                    padding: 2,
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg-glass)",
                    cursor: "pointer",
                  }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnPrimary} onClick={save} disabled={loading}>
              <Save size={12} />{" "}
              {loading ? "Saving..." : editing ? "Update" : "Add Venue"}
            </button>
            <button
              style={btnGhost}
              onClick={() => {
                setAdding(false);
                setEditing(null);
                setForm({
                  name: "",
                  name_ja: "",
                  region: "",
                  color: "#8b5cf6",
                  color_bg: "rgba(139,92,246,0.12)",
                });
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button style={btnPrimary} onClick={() => setAdding(true)}>
          <Plus size={13} /> Add Venue / 会場を追加
        </button>
      )}
    </div>
  );
}

// ── Categories Section ─────────────────────────────
function CategoriesSection() {
  const supabase = createClient();
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    name_ja: "",
    color: "#8b5cf6",
    color_bg: "rgba(139,92,246,0.12)",
  });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("activity_categories")
      .select("*")
      .order("name");
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    if (editing) {
      await supabase.from("activity_categories").update(form).eq("id", editing);
    } else {
      await supabase.from("activity_categories").insert(form);
    }
    await load();
    setEditing(null);
    setAdding(false);
    setForm({
      name: "",
      name_ja: "",
      color: "#8b5cf6",
      color_bg: "rgba(139,92,246,0.12)",
    });
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("activity_categories").delete().eq("id", id);
    await load();
  };

  const startEdit = (item: Category) => {
    setEditing(item.id);
    setAdding(true);
    setForm({
      name: item.name,
      name_ja: item.name_ja,
      color: item.color,
      color_bg: item.color_bg,
    });
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 20,
        marginBottom: 16,
      }}
    >
      <SectionTitle
        icon={<Tag size={16} />}
        en="Activity Categories"
        ja="アクティビティカテゴリ"
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 12,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              borderLeft: `3px solid ${item.color}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                }}
              >
                {item.name}
              </p>
              <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                {item.name_ja}
              </p>
            </div>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <button style={btnGhost} onClick={() => startEdit(item)}>
              <Edit3 size={11} /> Edit
            </button>
            <button style={btnDanger} onClick={() => del(item.id)}>
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div
          style={{
            background: "var(--bg-layer2)",
            border: "1px solid var(--border-hover)",
            borderRadius: "var(--radius-sm)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Name (EN)
              </label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Tea Ceremony"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Name (JA)
              </label>
              <input
                style={inputStyle}
                value={form.name_ja}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name_ja: e.target.value }))
                }
                placeholder="茶道"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Color
              </label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    setForm((p) => ({
                      ...p,
                      color: hex,
                      color_bg: `rgba(${r},${g},${b},0.12)`,
                    }));
                  }}
                  style={{
                    width: 40,
                    height: 34,
                    padding: 2,
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg-glass)",
                    cursor: "pointer",
                  }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnPrimary} onClick={save} disabled={loading}>
              <Save size={12} />{" "}
              {loading ? "Saving..." : editing ? "Update" : "Add Category"}
            </button>
            <button
              style={btnGhost}
              onClick={() => {
                setAdding(false);
                setEditing(null);
                setForm({
                  name: "",
                  name_ja: "",
                  color: "#8b5cf6",
                  color_bg: "rgba(139,92,246,0.12)",
                });
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button style={btnPrimary} onClick={() => setAdding(true)}>
          <Plus size={13} /> Add Category / カテゴリを追加
        </button>
      )}
    </div>
  );
}

// ── Users Section ──────────────────────────────────
function UsersSection() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("role");
    setUsers(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id: string, role: string) => {
    await supabase.from("profiles").update({ role }).eq("id", id);
    await load();
  };

  const roleColor: Record<string, string> = {
    super_admin: "var(--accent2)",
    admin: "var(--accent-bright)",
    member: "var(--fg-muted)",
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 20,
        marginBottom: 16,
      }}
    >
      <SectionTitle
        icon={<Users size={16} />}
        en="User Management"
        ja="ユーザー管理"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <img
              src={
                u.avatar_url ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`
              }
              alt={u.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                }}
              >
                {u.name ?? "—"}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: roleColor[u.role] ?? "var(--fg-muted)",
                  fontWeight: 600,
                }}
              >
                {u.role}
              </p>
            </div>
            {u.role !== "super_admin" && (
              <select
                value={u.role}
                onChange={(e) => updateRole(u.id, e.target.value)}
                style={{
                  padding: "5px 8px",
                  fontSize: 11,
                  background: "var(--bg-layer2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--fg-primary)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Theme Section ──────────────────────────────────
function ThemeSection() {
  const [colors, setColors] = useState({
    accent: "#8b5cf6",
    accent2: "#ec4899",
    green: "#34d399",
    yellow: "#fbbf24",
    red: "#f87171",
  });
  const [saved, setSaved] = useState(false);

  const apply = () => {
    Object.entries(colors).forEach(([key, val]) => {
      document.documentElement.style.setProperty(`--${key}`, val);
      if (key === "accent") {
        document.documentElement.style.setProperty("--accent-bright", val);
        document.documentElement.style.setProperty("--accent-glow", `${val}55`);
      }
      if (key === "accent2") {
        document.documentElement.style.setProperty(
          "--accent2-glow",
          `${val}50`,
        );
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const colorFields = [
    { key: "accent", label: "Primary Accent", ja: "メインカラー" },
    { key: "accent2", label: "Secondary Accent", ja: "サブカラー" },
    { key: "green", label: "Success / Green", ja: "成功・緑" },
    { key: "yellow", label: "Warning / Yellow", ja: "警告・黄" },
    { key: "red", label: "Danger / Red", ja: "エラー・赤" },
  ];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 20,
        marginBottom: 16,
      }}
    >
      <SectionTitle
        icon={<Palette size={16} />}
        en="Theme Colors"
        ja="テーマカラー"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {colorFields.map((f) => (
          <div key={f.key}>
            <label
              style={{
                fontSize: 11,
                color: "var(--fg-muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {f.label} / {f.ja}
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="color"
                value={colors[f.key as keyof typeof colors]}
                onChange={(e) =>
                  setColors((p) => ({ ...p, [f.key]: e.target.value }))
                }
                style={{
                  width: 40,
                  height: 34,
                  padding: 2,
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  background: "var(--bg-glass)",
                  cursor: "pointer",
                }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={colors[f.key as keyof typeof colors]}
                onChange={(e) =>
                  setColors((p) => ({ ...p, [f.key]: e.target.value }))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button style={btnPrimary} onClick={apply}>
          <Palette size={12} /> Apply Colors / 適用する
        </button>
        {saved && (
          <p style={{ fontSize: 12, color: "var(--green)" }}>✓ Applied!</p>
        )}
      </div>
      <p style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 10 }}>
        Note: Colors reset on page refresh. Persistent theme storage coming in a
        future update.
      </p>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────
export default function AdminPage() {
  const { userRole, isLoggedIn } = useApp();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    "venues" | "categories" | "users" | "theme"
  >("venues");

  useEffect(() => {
    if (!isLoggedIn || userRole !== "super_admin") {
      router.push("/");
    }
  }, [isLoggedIn, userRole]);

  if (!isLoggedIn || userRole !== "super_admin") return null;

  const sections = [
    { id: "venues", label: "Venues", ja: "会場", icon: <MapPin size={14} /> },
    {
      id: "categories",
      label: "Categories",
      ja: "カテゴリ",
      icon: <Tag size={14} />,
    },
    { id: "users", label: "Users", ja: "ユーザー", icon: <Users size={14} /> },
    { id: "theme", label: "Theme", ja: "テーマ", icon: <Palette size={14} /> },
  ] as const;

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg-base)",
        padding: "var(--gap)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          padding: "16px 20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background:
              "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontFamily: "serif",
            color: "#fff",
            boxShadow: "0 4px 12px var(--accent-glow)",
          }}
        >
          天
        </div>
        <div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--fg-primary)",
            }}
          >
            Super Admin Panel
          </p>
          <p style={{ fontSize: 11, color: "var(--fg-muted)" }}>
            天神書齋 Tenjin Shosai — System Management
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          style={{ ...btnGhost, marginLeft: "auto" }}
        >
          ← Back to Site
        </button>
      </div>

      <div style={{ display: "flex", gap: "var(--gap)" }}>
        {/* Sidebar nav */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "8px 0",
            alignSelf: "flex-start",
            position: "sticky",
            top: "var(--gap)",
          }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  activeSection === s.id
                    ? "rgba(139,92,246,0.1)"
                    : "transparent",
                borderLeft:
                  activeSection === s.id
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                transition: "all 0.15s",
                color:
                  activeSection === s.id
                    ? "var(--fg-primary)"
                    : "var(--fg-muted)",
              }}
            >
              {s.icon}
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: activeSection === s.id ? 600 : 400,
                  }}
                >
                  {s.label}
                </p>
                <p style={{ fontSize: 10 }}>{s.ja}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === "venues" && <LocationsSection />}
          {activeSection === "categories" && <CategoriesSection />}
          {activeSection === "users" && <UsersSection />}
          {activeSection === "theme" && <ThemeSection />}
        </div>
      </div>
    </div>
  );
}
