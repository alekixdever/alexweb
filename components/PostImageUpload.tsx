"use client";

// [CHRIS] PostImageUpload.tsx
// Owner: Chris | Storage & Media
// Controlled component: value / onChange pattern
// Uploads to "post-images" bucket via uploadImage() helper
// [MAX] 2026-06-15 — Built full component from Chris's spec (integration patch was incomplete)
// Last updated: 2026-06-15

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostImageUploadProps {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BUCKET = "post-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteImage(
  supabase: ReturnType<typeof createClient>,
  publicUrl: string,
) {
  // Extract storage path from public URL
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostImageUpload({
  userId,
  value,
  onChange,
}: PostImageUploadProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size guard
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB. / 画像は5MB以下にしてください。");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const url = await uploadImage(supabase, userId, file);
      onChange(url);
    } catch {
      setError("Upload failed. / アップロードに失敗しました。");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove() {
    if (!value) return;
    await deleteImage(supabase, value);
    onChange(null);
    setError(null);
  }

  // ── Preview (image already uploaded) ─────────────────────────────────────

  if (value) {
    return (
      <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
        <img
          src={value}
          alt="Post image / 投稿画像"
          style={{
            maxWidth: "100%",
            maxHeight: 200,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            display: "block",
            objectFit: "cover",
          }}
        />
        <button
          onClick={handleRemove}
          title="Remove image / 画像を削除"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  // ── Upload button ─────────────────────────────────────────────────────────

  return (
    <div style={{ marginTop: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: uploading ? "var(--fg-muted)" : "var(--fg-muted)",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "5px 10px",
          cursor: uploading ? "wait" : "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!uploading)
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border)";
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            Uploading… / アップロード中…
          </>
        ) : (
          <>
            <ImagePlus size={12} />
            Add Image / 画像を追加
          </>
        )}
      </button>

      {error && (
        <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
