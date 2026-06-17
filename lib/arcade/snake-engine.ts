// lib/arcade/snake-engine.ts
// [JANE] — Arcade & Games
// Pure game logic for multiplayer Snake — no React, no Supabase.
// Host Authoritative model: this module is run ONLY by the host client;
// non-host clients just render whatever SnakeGameState the host broadcasts.

import type {
  SnakeDirection,
  SnakePoint,
  SnakePlayerState,
  SnakeGameState,
} from "@/types/arcade";

// ── Constants ────────────────────────────────────────────────────────────

export const GRID = 20;
export const TICK_START = 200; // ms per tick at game start
export const TICK_MIN = 80; // fastest tick allowed
export const SPEED_STEP = 5; // ms shaved off per food eaten
export const MAX_PLAYERS = 4;

export const SPAWN_BODIES: SnakePoint[][] = [
  [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
  [{ x: GRID - 3, y: GRID - 3 }, { x: GRID - 2, y: GRID - 3 }, { x: GRID - 1, y: GRID - 3 }],
  [{ x: 2, y: GRID - 3 }, { x: 1, y: GRID - 3 }, { x: 0, y: GRID - 3 }],
  [{ x: GRID - 3, y: 2 }, { x: GRID - 2, y: 2 }, { x: GRID - 1, y: 2 }],
];

export const SPAWN_DIRS: SnakeDirection[] = ["RIGHT", "LEFT", "RIGHT", "LEFT"];

// ── Helpers ──────────────────────────────────────────────────────────────

export function outOfBounds(p: SnakePoint): boolean {
  return p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID;
}

export function nextHead(head: SnakePoint, dir: SnakeDirection): SnakePoint {
  if (dir === "UP") return { x: head.x, y: head.y - 1 };
  if (dir === "DOWN") return { x: head.x, y: head.y + 1 };
  if (dir === "LEFT") return { x: head.x - 1, y: head.y };
  return { x: head.x + 1, y: head.y };
}

export function opposite(d: SnakeDirection): SnakeDirection {
  return d === "UP" ? "DOWN" : d === "DOWN" ? "UP" : d === "LEFT" ? "RIGHT" : "LEFT";
}

function samePoint(a: SnakePoint, b: SnakePoint): boolean {
  return a.x === b.x && a.y === b.y;
}

// ── Setup ────────────────────────────────────────────────────────────────

export function initGameState(
  playerSlots: { userId: string; playerIndex: number }[],
): SnakeGameState {
  if (playerSlots.length < 1 || playerSlots.length > MAX_PLAYERS) {
    throw new Error("Invalid player count for Snake (1–4)");
  }

  const players: SnakePlayerState[] = playerSlots.map(({ userId, playerIndex }) => ({
    playerIndex,
    userId,
    body: [...SPAWN_BODIES[playerIndex]],
    dir: SPAWN_DIRS[playerIndex],
    alive: true,
    score: 0,
  }));

  return {
    players,
    food: randomFood(players),
    tick: TICK_START,
    totalEaten: 0,
    status: "countdown",
    winnerIndex: null,
  };
}

export function randomFood(players: SnakePlayerState[]): SnakePoint {
  const occupied = new Set(
    players.flatMap((p) => p.body.map((b) => `${b.x},${b.y}`)),
  );
  // Guard against an impossible-to-satisfy board (all cells occupied).
  // GRID*GRID cells vs at most MAX_PLAYERS * (longest possible body) — in
  // practice this never triggers, but avoids an infinite loop if it ever does.
  const maxAttempts = GRID * GRID * 4;
  let attempts = 0;
  let candidate: SnakePoint;
  do {
    candidate = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
    attempts++;
  } while (occupied.has(`${candidate.x},${candidate.y}`) && attempts < maxAttempts);
  return candidate;
}

// ── Direction input resolution ──────────────────────────────────────────
// A queued direction is only honored if it isn't the 180° reverse of the
// snake's current heading (prevents instant self-collision via a U-turn).

export function resolveDirection(
  currentDir: SnakeDirection,
  queuedDir: SnakeDirection | null | undefined,
): SnakeDirection {
  if (!queuedDir) return currentDir;
  if (queuedDir === opposite(currentDir)) return currentDir;
  return queuedDir;
}

// ── Tick — the core simulation step ────────────────────────────────────
// Pure function: (state, directionInputs) -> new state
// directionInputs: Map<userId, queued direction> — host clears entries it consumes

export function tick(
  state: SnakeGameState,
  directionInputs: Map<string, SnakeDirection>,
): SnakeGameState {
  if (state.status !== "playing") return state;

  // 1. Resolve each living snake's direction and compute its next head.
  const moved = state.players.map((snake) => {
    if (!snake.alive) return snake;
    const dir = resolveDirection(snake.dir, directionInputs.get(snake.userId));
    directionInputs.delete(snake.userId);
    const head = nextHead(snake.body[0], dir);
    return { ...snake, dir, _nextHead: head } as SnakePlayerState & {
      _nextHead: SnakePoint;
    };
  });

  // 2. Determine which snakes eat the food this tick (before collision
  //    checks, so a snake eating food still grows even if it also dies —
  //    irrelevant for rendering since it's removed, but keeps logic simple).
  let foodEaten = false;
  const willEat = new Set<number>();
  moved.forEach((snake) => {
    if (!snake.alive) return;
    if (samePoint(snake._nextHead, state.food)) {
      willEat.add(snake.playerIndex);
      foodEaten = true;
    }
  });

  // 3. Collision detection.
  //    - Wall: next head out of bounds.
  //    - Self: next head hits own body (excluding the tail cell that will
  //      vacate this tick, unless the snake just ate — then tail stays).
  //    - Other snakes: next head hits any other living snake's body
  //      (including their new head — two snakes can't swap into each
  //      other's old position either, handled by checking against the
  //      OLD body plus the new heads of all snakes for simultaneous
  //      head-on collisions).
  const newHeads = moved.map((s) => (s.alive ? s._nextHead : null));

  const died = new Set<number>();
  moved.forEach((snake, i) => {
    if (!snake.alive) return;
    const head = snake._nextHead;

    if (outOfBounds(head)) {
      died.add(snake.playerIndex);
      return;
    }

    // Self-collision: check against own current body. If this snake eats
    // food this tick its tail won't be removed, so the full body (minus
    // nothing) is the hazard; otherwise the tail cell is vacated and is
    // safe to move into.
    const ownBody = willEat.has(snake.playerIndex)
      ? snake.body
      : snake.body.slice(0, -1);
    if (ownBody.some((seg) => samePoint(seg, head))) {
      died.add(snake.playerIndex);
      return;
    }

    // Collision with other snakes' bodies (their pre-move body, minus
    // their vacating tail unless they're eating) and with any other
    // snake's new head (simultaneous head-on collision).
    for (let j = 0; j < moved.length; j++) {
      if (j === i) continue;
      const other = moved[j];
      if (!other.alive) continue;

      const otherBody = willEat.has(other.playerIndex)
        ? other.body
        : other.body.slice(0, -1);
      if (otherBody.some((seg) => samePoint(seg, head))) {
        died.add(snake.playerIndex);
        return;
      }

      const otherHead = newHeads[j];
      if (otherHead && samePoint(otherHead, head)) {
        died.add(snake.playerIndex);
        return;
      }
    }
  });

  // 4. Build new player states: move body, grow if ate, mark dead.
  const newPlayers: SnakePlayerState[] = moved.map((snake) => {
    if (!snake.alive) {
      const { _nextHead, ...rest } = snake as SnakePlayerState & {
        _nextHead?: SnakePoint;
      };
      return rest;
    }

    if (died.has(snake.playerIndex)) {
      const { _nextHead, ...rest } = snake;
      return { ...rest, alive: false };
    }

    const ate = willEat.has(snake.playerIndex);
    const newBody = ate
      ? [snake._nextHead, ...snake.body]
      : [snake._nextHead, ...snake.body.slice(0, -1)];

    const { _nextHead, ...rest } = snake;
    return {
      ...rest,
      body: newBody,
      score: ate ? rest.score + 1 : rest.score,
    };
  });

  // 5. New food (if eaten), new tick speed (if eaten), totalEaten count.
  const eatenCount = willEat.size;
  const newFood = foodEaten ? randomFood(newPlayers) : state.food;
  const newTick = foodEaten
    ? Math.max(TICK_MIN, state.tick - SPEED_STEP * eatenCount)
    : state.tick;
  const newTotalEaten = state.totalEaten + eatenCount;

  // 6. Win condition: game ends when ≤1 snake remains alive (or 0 if it
  //    started as a single-player session).
  const aliveCount = newPlayers.filter((p) => p.alive).length;
  const startedSolo = state.players.length === 1;
  const isOver = startedSolo ? aliveCount === 0 : aliveCount <= 1;

  let status: SnakeGameState["status"] = "playing";
  let winnerIndex: number | null = null;
  if (isOver) {
    status = "over";
    const survivor = newPlayers.find((p) => p.alive);
    winnerIndex = survivor?.playerIndex ?? null;
  }

  return {
    players: newPlayers,
    food: newFood,
    tick: newTick,
    totalEaten: newTotalEaten,
    status,
    winnerIndex,
  };
}

// ── Selector: winner lookup helper for UI ─────────────────────────────────

export function getWinner(
  state: SnakeGameState,
): SnakePlayerState | null {
  if (state.winnerIndex === null) return null;
  return state.players.find((p) => p.playerIndex === state.winnerIndex) ?? null;
}
