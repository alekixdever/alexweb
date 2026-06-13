"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import {
  uploadImage,
  deleteImage,
  extractStoragePath,
} from "@/lib/supabase/storage";

interface ImageUploadProps {
  userId: string;
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
}

export default function ImageUpload({
  userId,
  currentUrl,
  onUploadComplete,
  onError,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      // Delete old image if exists
      if (currentUrl) {
        const oldPath = extractStoragePath(currentUrl);
        if (oldPath) await deleteImage("event-images", oldPath);
      }

      const { publicUrl } = await uploadImage("event-images", userId, file);
      setPreview(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : "Upload failed / アップロード失敗",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onUploadComplete("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ width: "100%" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {preview ? (
        <div
          style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}
        >
          <img
            src={preview}
            alt="Event image / イベント画像"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "var(--radius)",
            }}
          />
          <button
            onClick={handleRemove}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "var(--bg-card)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            width: "100%",
            aspectRatio: "16/9",
            border: "2px dashed var(--border)",
            borderRadius: "var(--radius)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "border-color 0.2s",
          }}
        >
          {uploading ? (
            <p style={{ fontSize: 13 }}>Uploading... / アップロード中...</p>
          ) : (
            <>
              <ImageIcon size={28} />
              <p style={{ fontSize: 13 }}>
                Click or drag to upload / クリックまたはドラッグでアップロード
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                JPEG · PNG · WebP · max 5MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
