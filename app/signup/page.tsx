"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async () => {
    if (!name.trim()) {
      setError("Please enter your name. / お名前を入力してください。");
      return;
    }
    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters. / パスワードは6文字以上必要です。",
      );
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100svh",
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
            textAlign: "center",
            background: "var(--bg-layer2)",
            border: "1px solid var(--border-glow)",
            borderRadius: "var(--radius-lg)",
            padding: "36px 28px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--fg-primary)",
              marginBottom: 8,
            }}
          >
            Check your email / メールをご確認ください
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            We sent a confirmation link to{" "}
            <span style={{ color: "var(--accent-bright)", fontWeight: 600 }}>
              {email}
            </span>
            .<br />
            確認リンクをメールに送信しました。
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Back to Login / ログインへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100svh",
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
          Create Account / 新規登録
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Join the Tenjin Shosai community
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              label: "Name / お名前",
              value: name,
              setter: setName,
              type: "text",
              placeholder: "Alex Chen",
            },
            {
              label: "Email / メールアドレス",
              value: email,
              setter: setEmail,
              type: "email",
              placeholder: "your@email.com",
            },
            {
              label: "Password / パスワード",
              value: password,
              setter: setPassword,
              type: "password",
              placeholder: "•••••• (6+ characters)",
            },
          ].map((field) => (
            <div key={field.label}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--fg-secondary)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
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
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />
            </div>
          ))}

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
            onClick={handleSignup}
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
            {loading ? "Creating account..." : "Sign Up / 登録する"}
          </button>

          <p
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              textAlign: "center",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--accent-bright)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Log In / ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
