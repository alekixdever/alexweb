import { createClient } from "@/lib/supabase/client";
import type {
  AchievementKey,
  AchievementMeta,
  UnlockCondition,
  UnlockResult,
} from "@/types/arcade";

// ─── Achievement Metadata（雙語）────────────────────────────────────────────
export const ACHIEVEMENT_META: Record<AchievementKey, AchievementMeta> = {
  first_game: {
    key: "first_game",
    label: "First Game",
    labelJa: "初プレイ",
    description: "Play your first game",
    descriptionJa: "初めてゲームをプレイした",
    icon: "🎮",
  },
  stroop_master: {
    key: "stroop_master",
    label: "Stroop Master",
    labelJa: "ストループマスター",
    description: "Score 90%+ accuracy in Stroop",
    descriptionJa: "ストループで90%以上の正確さを達成",
    icon: "🧠",
  },
  nana_champion: {
    key: "nana_champion",
    label: "Nana Champion",
    labelJa: "ナナチャンピオン",
    description: "Reach top score in Nana",
    descriptionJa: "ナナでトップスコアを達成",
    icon: "🏆",
  },
  high_accuracy: {
    key: "high_accuracy",
    label: "Sharp Eye",
    labelJa: "鋭い目",
    description: "Achieve 95%+ accuracy in any game",
    descriptionJa: "いずれかのゲームで95%以上の正確さ",
    icon: "🎯",
  },
  speed_demon: {
    key: "speed_demon",
    label: "Speed Demon",
    labelJa: "スピード悪魔",
    description: "Complete Stroop in under 30 seconds",
    descriptionJa: "30秒以内にストループをクリア",
    icon: "⚡",
  },
  event_joiner: {
    key: "event_joiner",
    label: "Event Joiner",
    labelJa: "イベント参加者",
    description: "Join your first event",
    descriptionJa: "初めてイベントに参加した",
    icon: "📅",
  },
  social_butterfly: {
    key: "social_butterfly",
    label: "Social Butterfly",
    labelJa: "社交家",
    description: "Connect with 5 community members",
    descriptionJa: "5人のコミュニティメンバーとつながった",
    icon: "🦋",
  },
};

// ─── Unlock Conditions per Achievement ──────────────────────────────────────
export const UNLOCK_CONDITIONS: Partial<
  Record<AchievementKey, UnlockCondition>
> = {
  stroop_master: { gameId: "stroop", minAccuracy: 0.9 },
  nana_champion: { gameId: "nana", minScore: 1000 },
  high_accuracy: { minAccuracy: 0.95 },
  speed_demon: { gameId: "stroop", maxDurationMs: 30_000 },
};

// ─── Core: Check if already unlocked ────────────────────────────────────────
export async function isAchievementUnlocked(
  userId: string,
  achievementKey: AchievementKey,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("achievement_key")
    .eq("user_id", userId)
    .eq("achievement_key", achievementKey)
    .maybeSingle();

  if (error) {
    console.error("[Eric][achievements] check error:", error.message);
    return false;
  }
  return !!data;
}

// ─── Core: Unlock (client-side) ─────────────────────────────────────────────
export async function unlockAchievement(
  userId: string,
  achievementKey: AchievementKey,
): Promise<UnlockResult> {
  const supabase = createClient();

  // Step 1: Check first (避免重複 / avoid duplicate)
  const already = await isAchievementUnlocked(userId, achievementKey);
  if (already) {
    return { success: true, alreadyUnlocked: true, achievementKey };
  }

  // Step 2: Insert
  const { error } = await supabase.from("achievements").insert({
    user_id: userId,
    achievement_key: achievementKey,
    unlocked_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[Eric][achievements] insert error:", error.message);
    return {
      success: false,
      alreadyUnlocked: false,
      achievementKey,
      error: error.message,
    };
  }

  return { success: true, alreadyUnlocked: false, achievementKey };
}

// ─── Evaluate: Check conditions after a game session ────────────────────────
export interface GameSessionResult {
  userId: string;
  gameId: string;
  score: number;
  accuracy?: number; // 0–1
  durationMs?: number;
}

export async function evaluateAndUnlock(
  session: GameSessionResult,
): Promise<UnlockResult[]> {
  const results: UnlockResult[] = [];
  const { userId, gameId, score, accuracy, durationMs } = session;

  // first_game — always check on any session
  results.push(await unlockAchievement(userId, "first_game"));

  for (const [key, cond] of Object.entries(UNLOCK_CONDITIONS) as [
    AchievementKey,
    UnlockCondition,
  ][]) {
    if (cond.gameId && cond.gameId !== gameId) continue;
    if (cond.minScore !== undefined && score < cond.minScore) continue;
    if (cond.minAccuracy !== undefined && (accuracy ?? 0) < cond.minAccuracy)
      continue;
    if (
      cond.maxDurationMs !== undefined &&
      (durationMs ?? Infinity) > cond.maxDurationMs
    )
      continue;

    results.push(await unlockAchievement(userId, key));
  }

  return results;
}
