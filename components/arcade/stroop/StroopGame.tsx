// components/arcade/stroop/StroopGame.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { useApp } from "@/context/AppContext";
import StroopBall from "./StroopBall";
import StroopQuestion from "./StroopQuestion";
import StroopAnswerButtons from "./StroopAnswerButtons";
import StroopProgress from "./StroopProgress";
import StroopFeedback from "./StroopFeedback";
import StroopResult from "./StroopResult";
import {
  generateAllRounds,
  processAnswer,
  summariseSession,
  STROOP_ROUNDS,
} from "@/lib/arcade/stroop-engine";
import type { StroopGameState, StroopColor } from "@/types/arcade";

interface Props {
  onExit: () => void;
}

export default function StroopGame({ onExit }: Props) {
  const { user, lang } = useApp();

  const [state, setState] = useState<StroopGameState>({
    phase: "idle",
    currentRound: 1,
    totalRounds: STROOP_ROUNDS,
    rounds: [],
    totalScore: 0,
    sessionStartTime: null,
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const previousBestRef = useRef<number | null>(null);

  const currentRoundData = state.rounds[state.currentRound - 1] ?? null;

  // ── Start ────────────────────────────────────────────────────────────────
  function handleStart() {
    const rounds = generateAllRounds();
    setState({
      phase: "playing",
      currentRound: 1,
      totalRounds: STROOP_ROUNDS,
      rounds,
      totalScore: 0,
      sessionStartTime: performance.now(),
    });
  }

  // ── Answer ───────────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (color: StroopColor) => {
      if (state.phase !== "playing" || showFeedback) return;

      setState((prev) => {
        const updated = processAnswer(
          prev.rounds[prev.currentRound - 1],
          color,
        );
        const newRounds = [...prev.rounds];
        newRounds[prev.currentRound - 1] = updated;
        return {
          ...prev,
          rounds: newRounds,
          phase: "feedback",
          totalScore: prev.totalScore + updated.score,
        };
      });
      setShowFeedback(true);
    },
    [state.phase, showFeedback],
  );

  // ── After feedback ───────────────────────────────────────────────────────
  function handleFeedbackDone() {
    setShowFeedback(false);
    setState((prev) => {
      const next = prev.currentRound + 1;
      if (next > prev.totalRounds) {
        return { ...prev, phase: "result" };
      }
      // Refresh startTime for next round
      const newRounds = [...prev.rounds];
      newRounds[next - 1] = {
        ...newRounds[next - 1],
        startTime: performance.now(),
      };
      return {
        ...prev,
        currentRound: next,
        phase: "playing",
        rounds: newRounds,
      };
    });
  }

  // ── Play again ───────────────────────────────────────────────────────────
  function handlePlayAgain() {
    previousBestRef.current = null;
    handleStart();
  }

  const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

  // ── Render ───────────────────────────────────────────────────────────────

  // Idle screen
  if (state.phase === "idle") {
    return (
      <div
        className="float-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: 32,
          borderRadius: "var(--radius)",
        }}
      >
        <p
          style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-primary)" }}
        >
          {t("Stroop Challenge / ", "")}ストループチャレンジ
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-muted)",
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {t(
            "A ball will appear with a color and a word. Answer quickly — your reaction time affects your score!",
            "ボールの色とテキストが表示されます。素早く答えて — 反応速度がスコアに影響します！",
          )}
        </p>
        <p className="label-xs">
          {t(`${STROOP_ROUNDS} rounds`, `${STROOP_ROUNDS}ラウンド`)} ·{" "}
          {t("Max score: 5,000", "最高スコア：5,000")}
        </p>
        <button className="btn-primary" onClick={handleStart}>
          {t("Start / ", "")}ゲームを始める
        </button>
        <button className="btn-secondary" onClick={onExit}>
          {t("Back", "戻る")}
        </button>
      </div>
    );
  }

  // Result screen
  if (state.phase === "result") {
    const summary = summariseSession(state.rounds, previousBestRef.current);
    return (
      <StroopResult
        summary={summary}
        userId={user?.id}
        lang={lang}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Playing / feedback
  return (
    <div
      className="float-card"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "24px 20px 32px",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      {/* Progress */}
      <StroopProgress
        currentRound={state.currentRound}
        totalRounds={state.totalRounds}
        totalScore={state.totalScore}
        lang={lang}
      />

      {/* Ball */}
      {currentRoundData && (
        <StroopBall
          ballColor={currentRoundData.ballColor}
          textLabel={currentRoundData.textLabel}
          lang={lang}
        />
      )}

      {/* Question */}
      {currentRoundData && (
        <StroopQuestion question={currentRoundData.question} lang={lang} />
      )}

      {/* Answer buttons */}
      {currentRoundData && (
        <StroopAnswerButtons
          options={currentRoundData.options}
          onAnswer={handleAnswer}
          disabled={showFeedback}
          lang={lang}
        />
      )}

      {/* Feedback overlay */}
      {showFeedback &&
        currentRoundData?.isCorrect !== null &&
        currentRoundData && (
          <StroopFeedback
            isCorrect={currentRoundData.isCorrect!}
            correctAnswer={currentRoundData.correctAnswer}
            scoreEarned={currentRoundData.score}
            lang={lang}
            onDone={handleFeedbackDone}
          />
        )}

      {/* Exit */}
      <button
        className="btn-secondary"
        onClick={onExit}
        style={{ marginTop: "auto", fontSize: 12 }}
      >
        {t("Quit", "やめる")}
      </button>
    </div>
  );
}
