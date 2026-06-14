// types/arcade.ts
// MESP Arcade — all TypeScript interfaces

// ── Shared ────────────────────────────────────────────────────────────────

export type GameId = "nana" | "stroop";

export interface ArcadeGameSession {
  id: string;
  user_id: string;
  game_id: GameId;
  score: number | null;
  result: "win" | "lose" | null;
  accuracy: number | null;
  avg_reaction_ms: number | null;
  rounds_played: number | null;
  played_at: string;
}

export interface ArcadeRanking {
  id: string;
  user_id: string;
  game_id: GameId;
  best_score: number;
  accuracy: number | null;
  updated_at: string;
  // joined from profiles
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

// ── Stroop ────────────────────────────────────────────────────────────────

export interface StroopColor {
  key: string;
  label: string;
  label_ja: string;
  hex: string;
}

export type StroopQuestion = "color" | "text";

export interface StroopRound {
  roundNumber: number;
  ballColor: StroopColor;
  textLabel: StroopColor;
  isIncongruent: boolean;
  question: StroopQuestion;
  correctAnswer: StroopColor;
  options: StroopColor[];
  playerAnswer: StroopColor | null;
  isCorrect: boolean | null;
  reactionMs: number | null;
  score: number;
  startTime: number;
}

export type StroopPhase =
  | "idle"
  | "countdown"
  | "playing"
  | "feedback"
  | "result";

export interface StroopGameState {
  phase: StroopPhase;
  currentRound: number;
  totalRounds: number;
  rounds: StroopRound[];
  totalScore: number;
  sessionStartTime: number | null;
}

// ── Nana ──────────────────────────────────────────────────────────────────

export interface NanaCard {
  id: string;
  number: number;
  location: "center" | "hand";
  ownerId: string | null;
  handIndex: number | null;
  revealed: boolean;
  faceUp: boolean;
}

export interface NanaPlayer {
  id: string;
  name: string;
  userId: string | null; // null = guest
  hand: NanaCard[];
  collectedTrios: number[][];
}

export type NanaTurnPhase = "flip1" | "flip2" | "flip3" | "resolving";
export type WinMethod = "three_trios" | "lucky_7" | null;

export interface WinResult {
  won: boolean;
  method: WinMethod;
}

export interface NanaTurn {
  flipsThisTurn: NanaCard[];
  phase: NanaTurnPhase;
}

export interface TurnRecord {
  playerIndex: number;
  flipped: NanaCard[];
  success: boolean;
  trioCollected: number[] | null;
  winResult: WinResult | null;
}

export type NanaGamePhase = "setup" | "playing" | "gameOver";

export interface NanaGameState {
  phase: NanaGamePhase;
  centerGrid: (NanaCard | null)[];
  players: NanaPlayer[];
  currentPlayerIndex: number;
  currentTurn: NanaTurn;
  winner: string | null;
  winMethod: WinMethod;
  turnHistory: TurnRecord[];
}

// ── Realtime (Nana online) ────────────────────────────────────────────────

export interface NanaRoom {
  id: string;
  host_user_id: string;
  player_count: number;
  status: "waiting" | "playing" | "finished";
  created_at: string;
}

export interface NanaRoomPlayer {
  room_id: string;
  user_id: string;
  player_index: number;
  joined_at: string;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
}
