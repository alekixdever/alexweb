"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg-layer2)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px var(--accent-glow)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              margin: "0 auto 12px",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "#fff",
              fontWeight: 900,
              boxShadow: "0 4px 16px var(--accent-glow)",
              fontFamily: "serif",
            }}
          >
            天
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--fg-primary)",
              fontFamily: "serif",
            }}
          >
            天神書齋
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--fg-muted)",
              letterSpacing: "0.08em",
            }}
          >
            Tenjin Shosai
          </p>
        </div>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--fg-primary)",
            marginBottom: 4,
            textAlign: "center",
          }}
        >
          Welcome back / おかえりなさい
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Log in to your account
        </p>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email / メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--fg-primary)",
                fontSize: 13,
                outline: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-hover)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password / パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--fg-primary)",
                fontSize: 13,
                outline: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-hover)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--red)" }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: "12px",
              width: "100%",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 20px var(--accent-glow)",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "Logging in..." : "Log In / ログイン"}
          </button>

          <p
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              textAlign: "center",
            }}
          >
            Dont have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "var(--accent-bright)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign Up / 新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
