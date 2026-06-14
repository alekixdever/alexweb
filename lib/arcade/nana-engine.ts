// lib/arcade/nana-engine.ts
// Pure game logic — no React, no Supabase
// All Nana card game rules and state transitions

import type {
  NanaCard,
  NanaPlayer,
  NanaGameState,
  NanaTurn,
  TurnRecord,
  WinResult,
  WinMethod,
} from "@/types/arcade";

// ── Deck ──────────────────────────────────────────────────────────────────

export function createDeck(): NanaCard[] {
  const cards: NanaCard[] = [];
  for (let number = 1; number <= 12; number++) {
    for (let instance = 1; instance <= 3; instance++) {
      cards.push({
        id: `card_${number}_${instance}`,
        number,
        location: "center",
        ownerId: null,
        handIndex: null,
        revealed: false,
        faceUp: false,
      });
    }
  }
  return cards;
}

export function shuffleDeck(deck: NanaCard[]): NanaCard[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Setup ─────────────────────────────────────────────────────────────────

const DEAL_MAP: Record<number, { perPlayer: number; leftover: number }> = {
  2: { perPlayer: 13, leftover: 1 },
  3: { perPlayer: 9, leftover: 0 },
  4: { perPlayer: 6, leftover: 3 },
  5: { perPlayer: 5, leftover: 2 },
  6: { perPlayer: 4, leftover: 3 },
};

export function setupGame(
  playerNames: string[],
  playerUserIds: (string | null)[],
): NanaGameState {
  const count = playerNames.length;
  if (count < 2 || count > 6) throw new Error("Invalid player count");

  const shuffled = shuffleDeck(createDeck());

  // Place first 9 cards in center grid (face-down)
  const centerCards = shuffled.slice(0, 9).map((c, i) => ({
    ...c,
    location: "center" as const,
    handIndex: i,
    faceUp: false,
    revealed: false,
  }));

  const centerGrid: (NanaCard | null)[] = Array(9).fill(null);
  centerCards.forEach((c, i) => {
    centerGrid[i] = c;
  });

  // Deal remaining cards to players
  const remaining = shuffled.slice(9);
  const { perPlayer } = DEAL_MAP[count];

  const players: NanaPlayer[] = playerNames.map((name, pi) => {
    const hand = remaining
      .slice(pi * perPlayer, (pi + 1) * perPlayer)
      .map((c, hi) => ({
        ...c,
        location: "hand" as const,
        ownerId: playerUserIds[pi] ?? name,
        handIndex: hi,
        faceUp: false,
        revealed: false,
      }))
      .sort((a, b) => a.number - b.number);

    return {
      id: playerUserIds[pi] ?? `guest_${pi}`,
      name,
      userId: playerUserIds[pi],
      hand,
      collectedTrios: [],
    };
  });

  return {
    phase: "playing",
    centerGrid,
    players,
    currentPlayerIndex: 0,
    currentTurn: { flipsThisTurn: [], phase: "flip1" },
    winner: null,
    winMethod: null,
    turnHistory: [],
  };
}

// ── Flip Logic ────────────────────────────────────────────────────────────

export type FlipTarget =
  | { type: "center"; gridIndex: number }
  | { type: "hand"; playerIndex: number; side: "left" | "right" };

export function resolveFlipTarget(
  state: NanaGameState,
  target: FlipTarget,
): NanaCard | null {
  if (target.type === "center") {
    return state.centerGrid[target.gridIndex];
  }
  const player = state.players[target.playerIndex];
  if (!player || player.hand.length === 0) return null;
  return target.side === "left"
    ? player.hand[0]
    : player.hand[player.hand.length - 1];
}

export function flipCard(
  state: NanaGameState,
  target: FlipTarget,
): NanaGameState {
  const card = resolveFlipTarget(state, target);
  if (!card) return state;

  // Mark card faceUp in the appropriate location
  let newState = revealCardInState(state, card.id);
  const flips = [
    ...newState.currentTurn.flipsThisTurn,
    { ...card, faceUp: true },
  ];

  const turnPhase = newState.currentTurn.phase;

  // After flip1: just advance to flip2
  if (turnPhase === "flip1") {
    return {
      ...newState,
      currentTurn: { flipsThisTurn: flips, phase: "flip2" },
    };
  }

  // After flip2: check match
  if (turnPhase === "flip2") {
    const [f1] = flips;
    const f2 = flips[1];
    if (f1.number !== f2.number) {
      // Fail — hide and end turn
      return endTurnFail(newState, flips);
    }
    return {
      ...newState,
      currentTurn: { flipsThisTurn: flips, phase: "flip3" },
    };
  }

  // After flip3: check match
  if (turnPhase === "flip3") {
    const [f1] = flips;
    const f3 = flips[2];
    if (f1.number !== f3.number) {
      return endTurnFail(newState, flips);
    }
    // Trio collected!
    return collectTrio(newState, flips);
  }

  return newState;
}

// ── State Mutation Helpers ────────────────────────────────────────────────

function revealCardInState(
  state: NanaGameState,
  cardId: string,
): NanaGameState {
  const centerGrid = state.centerGrid.map((c) =>
    c?.id === cardId ? { ...c, faceUp: true } : c,
  );
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.map((c) => (c.id === cardId ? { ...c, faceUp: true } : c)),
  }));
  return { ...state, centerGrid, players };
}

function hideCards(state: NanaGameState, cards: NanaCard[]): NanaGameState {
  const ids = new Set(cards.map((c) => c.id));
  const centerGrid = state.centerGrid.map((c) =>
    c && ids.has(c.id) ? { ...c, faceUp: false } : c,
  );
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.map((c) => (ids.has(c.id) ? { ...c, faceUp: false } : c)),
  }));
  return { ...state, centerGrid, players };
}

function removeCards(state: NanaGameState, cards: NanaCard[]): NanaGameState {
  const ids = new Set(cards.map((c) => c.id));
  const centerGrid = state.centerGrid.map((c) =>
    c && ids.has(c.id) ? null : c,
  );
  const players = state.players.map((p) => ({
    ...p,
    hand: p.hand.filter((c) => !ids.has(c.id)),
  }));
  return { ...state, centerGrid, players };
}

function endTurnFail(state: NanaGameState, flips: NanaCard[]): NanaGameState {
  const hidden = hideCards(state, flips);
  const record: TurnRecord = {
    playerIndex: state.currentPlayerIndex,
    flipped: flips,
    success: false,
    trioCollected: null,
    winResult: null,
  };
  const next = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...hidden,
    currentPlayerIndex: next,
    currentTurn: { flipsThisTurn: [], phase: "flip1" },
    turnHistory: [...state.turnHistory, record],
  };
}

function collectTrio(state: NanaGameState, flips: NanaCard[]): NanaGameState {
  const number = flips[0].number;
  const removed = removeCards(state, flips);

  const players = removed.players.map((p, i) => {
    if (i !== state.currentPlayerIndex) return p;
    return {
      ...p,
      collectedTrios: [...p.collectedTrios, [number, number, number]],
    };
  });

  const newState = { ...removed, players };
  const currentPlayer = newState.players[state.currentPlayerIndex];
  const winResult = checkWinCondition(currentPlayer);

  const record: TurnRecord = {
    playerIndex: state.currentPlayerIndex,
    flipped: flips,
    success: true,
    trioCollected: [number, number, number],
    winResult,
  };

  if (winResult.won) {
    return {
      ...newState,
      phase: "gameOver",
      winner: currentPlayer.name,
      winMethod: winResult.method,
      currentTurn: { flipsThisTurn: [], phase: "flip1" },
      turnHistory: [...newState.turnHistory, record],
    };
  }

  const next = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...newState,
    currentPlayerIndex: next,
    currentTurn: { flipsThisTurn: [], phase: "flip1" },
    turnHistory: [...newState.turnHistory, record],
  };
}

// ── Win Condition ─────────────────────────────────────────────────────────

export function checkWinCondition(player: NanaPlayer): WinResult {
  const trios = player.collectedTrios;
  const numbers = trios.map((t) => t[0]);

  if (trios.length >= 3) {
    return { won: true, method: "three_trios" };
  }

  if (trios.length >= 2) {
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const a = numbers[i],
          b = numbers[j];
        if (a + b === 7 || Math.abs(a - b) === 7) {
          return { won: true, method: "lucky_7" };
        }
      }
    }
  }

  return { won: false, method: null };
}

// ── Selectors (for UI) ────────────────────────────────────────────────────

export function getFlippableTargets(state: NanaGameState): FlipTarget[] {
  const targets: FlipTarget[] = [];
  const alreadyFlippedIds = new Set(
    state.currentTurn.flipsThisTurn.map((c) => c.id),
  );

  // Center grid face-down cards
  state.centerGrid.forEach((card, i) => {
    if (card && !card.faceUp && !alreadyFlippedIds.has(card.id)) {
      targets.push({ type: "center", gridIndex: i });
    }
  });

  // Each player's leftmost and rightmost hand card
  state.players.forEach((player, pi) => {
    const hand = player.hand;
    if (hand.length === 0) return;
    const leftId = hand[0].id;
    const rightId = hand[hand.length - 1].id;

    if (!alreadyFlippedIds.has(leftId)) {
      targets.push({ type: "hand", playerIndex: pi, side: "left" });
    }
    if (hand.length > 1 && !alreadyFlippedIds.has(rightId)) {
      targets.push({ type: "hand", playerIndex: pi, side: "right" });
    }
  });

  return targets;
}
