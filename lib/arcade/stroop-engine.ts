// lib/arcade/stroop-engine.ts
// Pure game logic — no React, no Supabase
// All Stroop round generation and scoring

import type { StroopColor, StroopRound, StroopGameState } from "@/types/arcade";

// ── Constants ─────────────────────────────────────────────────────────────

export const STROOP_ROUNDS = 20;
export const CONGRUENT_RATIO = 0.3; // 30% congruent rounds
export const BASE_SCORE_CORRECT = 100;
export const BASE_SCORE_INCONGRUENT_BONUS = 50;
export const SPEED_BONUS_THRESHOLD_MS = 800;
export const SPEED_BONUS_MAX = 100;

export const STROOP_COLORS: StroopColor[] = [
  { key: "red", label: "Red", label_ja: "赤", hex: "#f87171" },
  { key: "blue", label: "Blue", label_ja: "青", hex: "#60a5fa" },
  { key: "green", label: "Green", label_ja: "緑", hex: "#34d399" },
  { key: "yellow", label: "Yellow", label_ja: "黄", hex: "#fbbf24" },
  { key: "purple", label: "Purple", label_ja: "紫", hex: "#a78bfa" },
  { key: "pink", label: "Pink", label_ja: "桃", hex: "#f472b6" },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: StroopColor, count: number): StroopColor[] {
  const others = STROOP_COLORS.filter((c) => c.key !== correct.key);
  return shuffle(others).slice(0, count);
}

// ── Round Generation ──────────────────────────────────────────────────────

export function generateRound(roundNumber: number): StroopRound {
  const isIncongruent = Math.random() > CONGRUENT_RATIO;
  const question: "color" | "text" = Math.random() < 0.5 ? "color" : "text";

  const ballColor = pickRandom(STROOP_COLORS);
  const textLabel = isIncongruent
    ? pickRandom(STROOP_COLORS.filter((c) => c.key !== ballColor.key))
    : ballColor;

  const correctAnswer = question === "color" ? ballColor : textLabel;

  const distractors = pickDistractors(correctAnswer, 3);
  const options = shuffle([correctAnswer, ...distractors]);

  return {
    roundNumber,
    ballColor,
    textLabel,
    isIncongruent,
    question,
    correctAnswer,
    options,
    playerAnswer: null,
    isCorrect: null,
    reactionMs: null,
    score: 0,
    startTime: performance.now(),
  };
}

export function generateAllRounds(): StroopRound[] {
  return Array.from({ length: STROOP_ROUNDS }, (_, i) => generateRound(i + 1));
}

// ── Scoring ───────────────────────────────────────────────────────────────

export function calculateRoundScore(
  correct: boolean,
  incongruent: boolean,
  reactionMs: number,
): number {
  if (!correct) return 0;

  let score = BASE_SCORE_CORRECT;
  if (incongruent) score += BASE_SCORE_INCONGRUENT_BONUS;

  if (reactionMs < SPEED_BONUS_THRESHOLD_MS) {
    const speedBonus = Math.round(
      SPEED_BONUS_MAX * (1 - reactionMs / SPEED_BONUS_THRESHOLD_MS),
    );
    score += speedBonus;
  }

  return score;
}

// ── Answer Processing ─────────────────────────────────────────────────────

export function processAnswer(
  round: StroopRound,
  answer: StroopColor,
): StroopRound {
  const reactionMs = Math.round(performance.now() - round.startTime);
  const isCorrect = answer.key === round.correctAnswer.key;
  const score = calculateRoundScore(isCorrect, round.isIncongruent, reactionMs);

  return {
    ...round,
    playerAnswer: answer,
    isCorrect,
    reactionMs,
    score,
  };
}

// ── Session Summary ───────────────────────────────────────────────────────

export interface StroopSessionSummary {
  totalScore: number;
  correctCount: number;
  accuracy: number; // 0–100
  avgReactionMs: number;
  newPersonalBest: boolean;
}

export function summariseSession(
  rounds: StroopRound[],
  previousBest: number | null,
): StroopSessionSummary {
  const answered = rounds.filter((r) => r.isCorrect !== null);
  const correctCount = answered.filter((r) => r.isCorrect).length;
  const totalScore = answered.reduce((sum, r) => sum + r.score, 0);
  const accuracy =
    answered.length > 0
      ? Math.round((correctCount / answered.length) * 100)
      : 0;
  const avgReactionMs =
    answered.length > 0
      ? Math.round(
          answered.reduce((sum, r) => sum + (r.reactionMs ?? 0), 0) /
            answered.length,
        )
      : 0;
  const newPersonalBest = previousBest === null || totalScore > previousBest;

  return { totalScore, correctCount, accuracy, avgReactionMs, newPersonalBest };
}

// ── Initial State ─────────────────────────────────────────────────────────

export function createInitialStroopState(): StroopGameState {
  return {
    phase: "idle",
    currentRound: 1,
    totalRounds: STROOP_ROUNDS,
    rounds: [],
    totalScore: 0,
    sessionStartTime: null,
  };
}
