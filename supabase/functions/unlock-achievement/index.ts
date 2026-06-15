import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { userId, achievementKey } = await req.json();
  if (!userId || !achievementKey) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // bypasses RLS safely server-side
  );

  // Check first
  const { data: existing } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", userId)
    .eq("achievement_key", achievementKey)
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ success: true, alreadyUnlocked: true }),
      { status: 200 },
    );
  }

  const { error } = await supabase.from("achievements").insert({
    user_id: userId,
    achievement_key: achievementKey,
    unlocked_at: new Date().toISOString(),
  });

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 },
    );
  }

  return new Response(
    JSON.stringify({ success: true, alreadyUnlocked: false }),
    { status: 200 },
  );
});
