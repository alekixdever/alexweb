import { createClient } from "./client";

export interface DBLocation {
  id: string;
  name: string;
  name_ja: string;
  region: string;
  color: string;
  color_bg: string;
}

export async function getLocations(): Promise<DBLocation[]> {
  const supabase = createClient();
  const { data } = await supabase.from("locations").select("*").order("name");
  return data ?? [];
}

export async function getLocationById(id: string): Promise<DBLocation | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}
