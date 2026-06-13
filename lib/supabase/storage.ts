import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ─── Types ───────────────────────────────────────────────────────────────────

export type StorageBucket = "event-images" | "avatars";

export interface UploadResult {
  publicUrl: string;
  path: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export async function uploadImage(
  bucket: StorageBucket,
  userId: string,
  file: File,
): Promise<UploadResult> {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;
  const path = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return { publicUrl: data.publicUrl, path };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteImage(
  bucket: StorageBucket,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// ─── Extract path from public URL ────────────────────────────────────────────
// Used before replacing an image — extract path to delete old file

export function extractStoragePath(publicUrl: string): string {
  // e.g. https://xxx.supabase.co/storage/v1/object/public/avatars/userId/123.jpg
  const match = publicUrl.match(/\/object\/public\/[^/]+\/(.+)$/);
  return match ? match[1] : "";
}
