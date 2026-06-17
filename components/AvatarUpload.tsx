"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { uploadImage, deleteImage, extractStoragePath } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  displayName?: string;
  size?: number;
  onUploadComplete?: (url: string) => void;
}

export default function AvatarUpload({
  userId,
  currentUrl,
  displayName = "U",
  size = 48,
  onUploadComplete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);

  // Track what we've uploaded locally; null means "use currentUrl from parent"
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  // While not uploading, always reflect the latest parent-provided URL.
  // Do this synchronously during render (not in an effect) to avoid the
  // cascading-render lint error.
  const prevCurrentUrl = useRef(currentUrl);
  if (!uploading && currentUrl !== prevCurrentUrl.current) {
    prevCurrentUrl.current = currentUrl;
    setLocalUrl(null); // reset so we pick up the new currentUrl below
  }

  const preview = localUrl ?? currentUrl ?? null;

  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFile(file: File) {
    setUploading(true);
    try {
      if (preview) {
        const oldPath = extractStoragePath(preview);
        if (oldPath) await deleteImage("avatars", oldPath);
      }
      const { publicUrl } = await uploadImage("avatars", userId, file);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      setLocalUrl(publicUrl);
      onUploadComplete?.(publicUrl);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      title="Change avatar / アバターを変更"
    >
      {preview ? (
        <img
          src={preview}
          alt={displayName}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.4, color: "#fff", fontWeight: 600,
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          position: "absolute", bottom: 0, right: 0,
          width: size * 0.38, height: size * 0.38,
          borderRadius: "50%",
          background: "var(--bg-card)",
          border: "2px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: uploading ? "wait" : "pointer",
          color: "var(--fg-primary)",
          padding: 0,
        }}
      >
        {uploading
          ? <span style={{ fontSize: size * 0.16, color: "var(--fg-muted)" }}>…</span>
          : <Camera size={size * 0.18} />
        }
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
