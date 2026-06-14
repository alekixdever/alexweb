// lib/arcade/arcade-db.ts
// All Supabase calls for the Arcade module
// Import this — never call supabase directly from game components

import { createClient } from "@/lib/supabase/client";
import type {
  ArcadeGameSession,
  ArcadeRanking,
  Achievement,
  GameId,
} from "@/types/arcade";

// ── Session ───────────────────────────────────────────────────────────────

export async function saveStroopSession(params: {
  userId: string;
  score: number;
  accuracy: number;
  avgReactionMs: number;
  roundsPlayed: number;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("arcade_game_sessions").insert({
    user_id: params.userId,
    game_id: "stroop",
    score: params.score,
    accuracy: params.accuracy,
    avg_reaction_ms: params.avgReactionMs,
    rounds_played: params.roundsPlayed,
    played_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveNanaSession(params: {
  userId: string;
  result: "win" | "lose";
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("arcade_game_sessions").insert({
    user_id: params.userId,
    game_id: "nana",
    result: params.result,
    played_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ── Rankings ──────────────────────────────────────────────────────────────

export async function upsertRanking(params: {
  userId: string;
  gameId: GameId;
  score: number;
  accuracy: number;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("upsert_arcade_ranking", {
    p_user_id: params.userId,
    p_game_id: params.gameId,
    p_score: params.score,
    p_accuracy: params.accuracy,
  });
  if (error) throw error;
}

export async function getLeaderboard(
  gameId: GameId,
  limit = 10,
): Promise<ArcadeRanking[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("arcade_rankings")
    .select("*, profiles(name, avatar_url)")
    .eq("game_id", gameId)
    .order("best_score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ArcadeRanking[]) ?? [];
}

export async function getUserRanking(
  userId: string,
  gameId: GameId,
): Promise<ArcadeRanking | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("arcade_rankings")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();
  if (error) return null;
  return data as ArcadeRanking;
}

export async function getUserGlobalRank(
  userId: string,
  gameId: GameId,
): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("arcade_rankings")
    .select("user_id, best_score")
    .eq("game_id", gameId)
    .order("best_score", { ascending: false });
  if (error || !data) return null;
  const idx = data.findIndex((r) => r.user_id === userId);
  return idx === -1 ? null : idx + 1;
}

// ── Achievements ──────────────────────────────────────────────────────────

export async function unlockAchievement(
  userId: string,
  achievementKey: string,
): Promise<void> {
  const supabase = createClient();
  // onConflict ignore — safe to call even if already unlocked
  await supabase
    .from("achievements")
    .insert({ user_id: userId, achievement_key: achievementKey })
    .select(); // suppress "missing select" warning
}

export async function getUserAchievements(
  userId: string,
): Promise<Achievement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });
  if (error) throw error;
  return (data as Achievement[]) ?? [];
}

export async function getStroopSessionCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("arcade_game_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("game_id", "stroop");
  if (error) return 0;
  return count ?? 0;
}

// ── Stroop Achievements ───────────────────────────────────────────────────

export async function checkAndUnlockStroopAchievements(params: {
  userId: string;
  score: number;
  accuracy: number;
  avgReactionMs: number;
}): Promise<string[]> {
  const { userId, score, accuracy, avgReactionMs } = params;
  const toUnlock: string[] = [];

  const count = await getStroopSessionCount(userId);
  if (count === 1) toUnlock.push("arcade_stroop_first_game");
  if (accuracy === 100) toUnlock.push("arcade_stroop_perfect");
  if (avgReactionMs < 500) toUnlock.push("arcade_stroop_under_500");
  if (score >= 4000) toUnlock.push("arcade_stroop_high_score_4000");

  await Promise.all(toUnlock.map((key) => unlockAchievement(userId, key)));

  return toUnlock; // return list so UI can show unlock notifications
}

// ── Nana Achievements ─────────────────────────────────────────────────────

export async function checkAndUnlockNanaAchievements(params: {
  userId: string;
  result: "win" | "lose";
  winMethod?: "three_trios" | "lucky_7" | null;
}): Promise<string[]> {
  const { userId, result, winMethod } = params;
  const toUnlock: string[] = [];

  if (result === "win") {
    toUnlock.push("arcade_first_nana_win");
    if (winMethod === "lucky_7") toUnlock.push("arcade_nana_lucky7_win");
  }

  await Promise.all(toUnlock.map((key) => unlockAchievement(userId, key)));

  return toUnlock;
}
