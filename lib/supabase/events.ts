import { createClient } from "./client";

export interface DBEvent {
  id: string;
  title: string;
  title_ja: string;
  description: string;
  description_ja: string;
  date: string;
  location_id: string;
  creator_id: string;
  category_id: string | null;
  image_url: string | null;
  tags: string[];
  tags_ja: string[];
  created_at: string;
  participant_count?: number;
}

export async function getEvents(filters?: {
  locationId?: string;
  date?: string;
  categoryId?: string;
}): Promise<DBEvent[]> {
  const supabase = createClient();

  let query = supabase
    .from("events")
    .select(
      `
      *,
      participant_count:event_participants(count)
    `,
    )
    .order("date");

  if (filters?.locationId && filters.locationId !== "all") {
    query = query.eq("location_id", filters.locationId);
  }

  if (filters?.date) {
    const start = `${filters.date}T00:00:00.000Z`;
    const end = `${filters.date}T23:59:59.999Z`;
    query = query.gte("date", start).lte("date", end);
  }

  if (filters?.categoryId && filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }

  const { data } = await query;
  return data ?? [];
}
