# MESP Arcade — Technical Specification

**Project:** 天神書齋 Tenjin Shosai (MESP)
**Module:** Community > Arcade
**Version:** 1.0
**Date:** 2026-06-13
**Status:** Ready for Implementation

-----

## Table of Contents

1. [Arcade Overview](#1-arcade-overview)
1. [Shared Systems Integration](#2-shared-systems-integration)
1. [Database Schema — Arcade](#3-database-schema--arcade)
1. [Game 1: Nana](#4-game-1-nana)
1. [Game 2: Stroop Effect](#5-game-2-stroop-effect)
1. [Component Architecture](#6-component-architecture)
1. [File Structure](#7-file-structure)
1. [Development Guidelines](#8-development-guidelines)

-----

## 1. Arcade Overview

### Position in App

```
MainContent.tsx
└── Tab: Community
    └── CommunityHub.tsx
        ├── Feed
        ├── Arcade          ← this module
        ├── Ranking
        ├── Discussion
        └── Achievements
```

Arcade is a sub-section of Community. It is NOT a standalone route.

### Navigation

Mobile (icon only):

```
[ Feed ] [🎮] [🏆] [💬] [⭐]
```

Desktop: icon + label tabs inside CommunityHub.

### Arcade Landing Page

`ArcadeLobby.tsx` — shows:

- Game cards grid (Reaction Test, Nana)
- Each card: game name / description / personal best / global rank / Play button
- Bilingual: English + Japanese

-----

## 2. Shared Systems Integration

Per Community Architecture: Arcade must NOT create game-specific ranking or achievement systems. Use shared systems only.

### Rankings

Shared `arcade_rankings` table (see Section 3).

- One ranking category per game.
- Displayed in Community > Ranking tab.
- Also displayed in User Profile > Games section.

### Achievements

Use shared `achievements` table.

- Arcade achievement category.
- Examples:
  - `arcade_first_nana_win` — First Nana Win / 初めてのナナ勝利
  - `arcade_stroop_under_500` — Stroop reaction under 500ms avg / ストループ反応500ms以下
  - `arcade_stroop_perfect` — Perfect accuracy round / 完璧な正確率

### Profile Integration

Profile > Games section displays:

- Nana: wins, total games played
- Stroop: personal best score, accuracy rate

Profile does NOT own this data. It reads from `arcade_game_sessions` and `arcade_rankings`.

### Feed Integration (optional, per architecture)

Feed-eligible events:

- New personal best in Stroop → “Alex set a new personal best: 1,240 pts”
- Nana win → “Alex won a game of Nana”

NOT eligible:

- Game start
- Room join/leave
- Every session

-----

## 3. Database Schema — Arcade

### `arcade_game_sessions`

```sql
id            uuid PK default uuid_generate_v4()
user_id       uuid FK profiles(id) cascade delete
game_id       text NOT NULL           -- 'nana' | 'stroop'
score         integer nullable        -- Stroop: numeric score; Nana: null
result        text nullable           -- 'win' | 'lose' | null
accuracy      numeric(5,2) nullable   -- Stroop: percentage correct
avg_reaction_ms integer nullable      -- Stroop: average reaction time in ms
rounds_played integer nullable        -- Stroop: number of rounds
played_at     timestamptz default now()
```

RLS:

```sql
-- SELECT: public read
-- INSERT: authenticated users (own record only)
-- UPDATE/DELETE: none
```

### `arcade_rankings`

```sql
id            uuid PK default uuid_generate_v4()
user_id       uuid FK profiles(id) cascade delete
game_id       text NOT NULL           -- 'stroop' (Nana uses win-count)
best_score    integer NOT NULL
accuracy      numeric(5,2) nullable
updated_at    timestamptz default now()
UNIQUE(user_id, game_id)
```

RLS:

```sql
-- SELECT: public read
-- INSERT/UPDATE: authenticated users (own record only via function)
```

### `arcade_achievements` (extends shared achievement system)

If a shared `achievements` table does not yet exist, create:

```sql
-- achievements (shared)
id            uuid PK default uuid_generate_v4()
user_id       uuid FK profiles(id) cascade delete
achievement_key text NOT NULL        -- e.g. 'arcade_first_nana_win'
unlocked_at   timestamptz default now()
UNIQUE(user_id, achievement_key)
```

RLS:

```sql
-- SELECT: public read
-- INSERT: authenticated users (own record only)
```

### Supabase Function — Upsert Ranking

```sql
CREATE OR REPLACE FUNCTION upsert_arcade_ranking(
  p_user_id uuid,
  p_game_id text,
  p_score integer,
  p_accuracy numeric
)
RETURNS void AS $$
BEGIN
  INSERT INTO arcade_rankings (user_id, game_id, best_score, accuracy, updated_at)
  VALUES (p_user_id, p_game_id, p_score, p_accuracy, now())
  ON CONFLICT (user_id, game_id)
  DO UPDATE SET
    best_score = GREATEST(arcade_rankings.best_score, EXCLUDED.best_score),
    accuracy   = CASE
                   WHEN EXCLUDED.best_score > arcade_rankings.best_score
                   THEN EXCLUDED.accuracy
                   ELSE arcade_rankings.accuracy
                 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

-----

## 4. Game 1: Nana

### Overview

- **Players:** 2–6, local multiplayer (same device, pass-and-play)
- **Mode:** Pure frontend, no DB during gameplay
- **Session save:** After game ends, write result to `arcade_game_sessions`
- **Future:** Upgrade to online multiplayer via Supabase Realtime (Phase 5)

### Card Specification

```typescript
interface Card {
  id: string          // e.g. "card_5_1" (number_instance)
  number: number      // 1–12
  location: 'center' | 'hand'
  ownerId: string | null  // player id if in hand
  handIndex: number | null
  revealed: boolean
  faceUp: boolean     // currently visible to all
}
```

Full deck: numbers 1–12, 3 copies each = 36 cards total.

### Game State

```typescript
interface NanaGameState {
  phase: 'setup' | 'playing' | 'gameOver'
  centerGrid: (Card | null)[]   // 9 slots, 3×3
  players: NanaPlayer[]
  currentPlayerIndex: number
  currentTurn: NanaTurn
  winner: string | null
  turnHistory: TurnRecord[]     // for memory/animation
}

interface NanaPlayer {
  id: string
  name: string
  hand: Card[]                  // sorted ascending always
  collectedTrios: number[][]    // e.g. [[5,5,5], [8,8,8]]
}

interface NanaTurn {
  flipsThisTurn: Card[]         // max 3
  phase: 'flip1' | 'flip2' | 'flip3' | 'resolving'
}
```

### Game Logic — Rules Engine

#### Setup

```
1. Create deck: numbers 1–12, 3 copies each (36 cards)
2. Shuffle deck
3. Place 9 cards face-down in 3×3 center grid
4. Deal remaining 27 cards evenly to players
   - 2P: 13 cards each + 1 leftover (set aside face-down)
   - 3P: 9 cards each
   - 4P: 6 cards each + 3 leftover
   - 5P: 5 cards each + 2 leftover
   - 6P: 4 cards each + 3 leftover
5. Each player sorts their hand ascending (enforced by game engine)
6. Hand order is FIXED — never changes
```

#### Turn Flow

```
Player selects a card to flip (flip1):
  Options:
    - Any face-down center card
    - Any player's leftmost hand card (including self)
    - Any player's rightmost hand card (including self)

Reveal flip1.

Player selects flip2:
  Same options as flip1 (excluding already-flipped cards)

  If flip2.number === flip1.number:
    → Proceed to flip3
  Else:
    → Turn fails
    → Hide all flipped cards (return to face-down)
    → Next player's turn

Player selects flip3:
  Same options

  If flip3.number === flip1.number (all three match):
    → Player collects the Trio
    → Remove those 3 cards from their locations
    → Re-sort hands if needed (hand positions shift but order preserved)
    → Check win condition
    → If no win: next player's turn
  Else:
    → Turn fails
    → Hide all flipped cards
    → Next player's turn
```

#### Win Conditions

```typescript
function checkWinCondition(player: NanaPlayer): WinResult {
  const trios = player.collectedTrios
  const numbers = trios.map(t => t[0])  // get the number of each trio

  // Condition 1: 3 trios collected
  if (trios.length >= 3) {
    return { won: true, method: 'three_trios' }
  }

  // Condition 2: Lucky 7 (two trios, sum or difference = 7)
  if (trios.length >= 2) {
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const a = numbers[i], b = numbers[j]
        if (a + b === 7 || Math.abs(a - b) === 7) {
          return { won: true, method: 'lucky_7' }
        }
      }
    }
  }

  // Special: 7+7+7
  if (numbers.includes(7) && numbers.filter(n => n === 7).length >= 1) {
    // This is already covered by condition 1 if 3 trios
    // But if Lucky 7 fires first with two 7s... not possible (only 1 trio of 7)
    // So 7+7+7 is just the normal 3-trio win with number 7
  }

  return { won: false, method: null }
}
```

Note: Lucky 7 check runs after EVERY trio collection, not just at end.

### Component Structure

```
components/arcade/nana/
├── NanaGame.tsx          -- main game orchestrator, holds NanaGameState
├── NanaSetup.tsx         -- player count selection, name entry
├── NanaCenterGrid.tsx    -- 3×3 grid of cards
├── NanaPlayerHand.tsx    -- horizontal hand, shows left/right endpoints
├── NanaCard.tsx          -- individual card (face-up / face-down)
├── NanaTurnIndicator.tsx -- whose turn, how many flips used
├── NanaScoreboard.tsx    -- collected trios per player
└── NanaResult.tsx        -- winner display, play again, save result
```

### UI Notes

- Cards: floating card style (`.float-card`)
- Center grid: clearly separated from player hands
- Active player’s hand: highlighted border (`--border-glow`)
- Flipped cards: animate reveal (flip animation, 300ms)
- Only left/right endpoints of each hand are tappable; middle cards visually muted
- Mobile: vertical layout — center grid top, active player hand bottom, other players’ hands as rows

### Session Save (on game end)

```typescript
// For each player, save their result
await supabase.from('arcade_game_sessions').insert({
  user_id: player.userId,   // only if logged in
  game_id: 'nana',
  result: isWinner ? 'win' : 'lose',
  played_at: new Date().toISOString()
})
```

Note: Guest (not logged in) sessions are NOT saved. Show prompt: “Log in to save your results / ログインして結果を保存”

-----

## 5. Game 2: Stroop Effect

### Overview

- **Players:** Single player
- **Mode:** Pure frontend gameplay + Supabase save on session end
- **Ranking:** Global leaderboard (best score per user)
- **Profile:** Personal best score + accuracy displayed in Profile > Games

### Game Mechanics

#### Round Structure

Each session = 20 rounds (configurable via constant `STROOP_ROUNDS = 20`).

Each round:

```
1. Display: colored ball + text label on the ball
2. Display: question ("What COLOR is the ball?" or "What does the TEXT say?")
3. Player picks from 4 answer buttons (color options)
4. Record: correct/incorrect + reaction time (ms)
5. Next round (no pause, immediate)
```

Question is randomly assigned each round:

- 50% chance: “What COLOR is the ball?” → correct answer = ball’s actual color
- 50% chance: “What does the TEXT say?” → correct answer = the text label

Congruent vs Incongruent:

- Congruent: ball color matches text (e.g. red ball, text “Red”) — easier
- Incongruent: ball color differs from text (e.g. red ball, text “Blue”) — harder
- Ratio: ~30% congruent, 70% incongruent (configurable)

#### Colors Used

```typescript
const STROOP_COLORS = [
  { key: 'red',    label: 'Red',    label_ja: '赤',  hex: '#f87171' },
  { key: 'blue',   label: 'Blue',   label_ja: '青',  hex: '#60a5fa' },
  { key: 'green',  label: 'Green',  label_ja: '緑',  hex: '#34d399' },
  { key: 'yellow', label: 'Yellow', label_ja: '黄',  hex: '#fbbf24' },
  { key: 'purple', label: 'Purple', label_ja: '紫',  hex: '#a78bfa' },
  { key: 'pink',   label: 'Pink',   label_ja: '桃',  hex: '#f472b6' },
]
```

4 answer options per round: always includes the correct answer + 3 random distractors from remaining colors.

#### Scoring

```typescript
const BASE_SCORE_CORRECT = 100
const BASE_SCORE_INCONGRUENT_BONUS = 50   // extra for incongruent rounds
const SPEED_BONUS_THRESHOLD_MS = 800      // under 800ms gets speed bonus
const SPEED_BONUS_MAX = 100               // scaled linearly from 800ms → 0ms

function calculateRoundScore(
  correct: boolean,
  incongruent: boolean,
  reactionMs: number
): number {
  if (!correct) return 0

  let score = BASE_SCORE_CORRECT
  if (incongruent) score += BASE_SCORE_INCONGRUENT_BONUS

  if (reactionMs < SPEED_BONUS_THRESHOLD_MS) {
    const speedBonus = Math.round(
      BASE_BONUS_MAX * (1 - reactionMs / SPEED_BONUS_THRESHOLD_MS)
    )
    score += speedBonus
  }

  return score
}
```

Max score per round: 100 + 50 + 100 = 250
Max score per session (20 rounds): 5,000

#### Timer

- No per-round time limit (player can take as long as they want)
- BUT: reaction time is measured and affects score
- Total session timer displayed (cosmetic only)

#### Answer Window

After player answers:

- 300ms feedback: green flash (correct) or red flash (incorrect)
- Show correct answer briefly if wrong
- Immediately proceed to next round

### Game State

```typescript
interface StroopGameState {
  phase: 'idle' | 'countdown' | 'playing' | 'feedback' | 'result'
  currentRound: number          // 1–20
  totalRounds: number           // 20
  rounds: StroopRound[]
  totalScore: number
  sessionStartTime: number | null
}

interface StroopRound {
  roundNumber: number
  ballColor: StroopColor
  textLabel: StroopColor        // the text displayed on ball
  isIncongruent: boolean
  question: 'color' | 'text'
  correctAnswer: StroopColor
  options: StroopColor[]        // 4 choices
  playerAnswer: StroopColor | null
  isCorrect: boolean | null
  reactionMs: number | null
  score: number
  startTime: number             // performance.now()
}
```

### Component Structure

```
components/arcade/stroop/
├── StroopGame.tsx          -- main orchestrator, holds StroopGameState
├── StroopBall.tsx          -- colored circle with text label
├── StroopQuestion.tsx      -- "What COLOR?" or "What TEXT?" display
├── StroopAnswerButtons.tsx -- 4 color choice buttons
├── StroopProgress.tsx      -- round counter + score + timer
├── StroopFeedback.tsx      -- correct/incorrect flash overlay
└── StroopResult.tsx        -- final score, accuracy, ranking, save
```

### StroopBall Visual Spec

```
Large circle (~180px diameter on mobile, ~220px on desktop)
Background: ball's actual color (with slight radial gradient for 3D feel)
Text: color label word, centered
Text color: contrasting (auto: white or dark based on ball lightness)
Text font: bold, large (~28px)
Shadow: drop shadow matching --border-glow style
```

### Ranking Display

After session ends (`StroopResult.tsx`):

- Show: Your Score / Best Score / Global Rank
- Leaderboard: top 10 (reads from `arcade_rankings` joined with `profiles`)
- If not logged in: show score but disable save; prompt to log in

### Session Save (on game end)

```typescript
// 1. Save session
await supabase.from('arcade_game_sessions').insert({
  user_id: currentUser.id,
  game_id: 'stroop',
  score: totalScore,
  accuracy: (correctCount / totalRounds) * 100,
  avg_reaction_ms: Math.round(avgReactionMs),
  rounds_played: totalRounds,
  played_at: new Date().toISOString()
})

// 2. Upsert ranking (only if new personal best)
await supabase.rpc('upsert_arcade_ranking', {
  p_user_id: currentUser.id,
  p_game_id: 'stroop',
  p_score: totalScore,
  p_accuracy: accuracy
})

// 3. Check and unlock achievements
checkStroopAchievements(currentUser.id, totalScore, accuracy, avgReactionMs)
```

### Achievement Triggers

```typescript
async function checkStroopAchievements(
  userId: string,
  score: number,
  accuracy: number,
  avgReactionMs: number
) {
  const toUnlock: string[] = []

  // First game ever
  const { count } = await supabase
    .from('arcade_game_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('game_id', 'stroop')

  if (count === 1) toUnlock.push('arcade_stroop_first_game')
  if (accuracy === 100) toUnlock.push('arcade_stroop_perfect')
  if (avgReactionMs < 500) toUnlock.push('arcade_stroop_under_500')
  if (score >= 4000) toUnlock.push('arcade_stroop_high_score_4000')

  for (const key of toUnlock) {
    await supabase.from('achievements')
      .insert({ user_id: userId, achievement_key: key })
      .onConflict('user_id, achievement_key')
      .ignore()
  }
}
```

-----

## 6. Component Architecture

### Full Tree

```
app/
└── (main layout)
    └── MainContent.tsx
        └── Tab: Community
            └── CommunityHub.tsx
                └── Tab: Arcade
                    └── ArcadeLobby.tsx
                        ├── ArcadeGameCard.tsx (Stroop)
                        │   └── → StroopGame.tsx
                        │       ├── StroopBall.tsx
                        │       ├── StroopQuestion.tsx
                        │       ├── StroopAnswerButtons.tsx
                        │       ├── StroopProgress.tsx
                        │       ├── StroopFeedback.tsx
                        │       └── StroopResult.tsx
                        │           └── StroopLeaderboard.tsx
                        └── ArcadeGameCard.tsx (Nana)
                            └── → NanaGame.tsx
                                ├── NanaSetup.tsx
                                ├── NanaCenterGrid.tsx
                                │   └── NanaCard.tsx
                                ├── NanaPlayerHand.tsx
                                │   └── NanaCard.tsx
                                ├── NanaTurnIndicator.tsx
                                ├── NanaScoreboard.tsx
                                └── NanaResult.tsx
```

### ArcadeGameCard.tsx

Reusable card for lobby:

Props:

```typescript
interface ArcadeGameCardProps {
  gameId: 'nana' | 'stroop'
  title: string
  title_ja: string
  description: string
  description_ja: string
  icon: string                    // emoji or lucide icon name
  personalBest?: number | null    // null if no record
  globalRank?: number | null
  onPlay: () => void
}
```

-----

## 7. File Structure

```
alexweb/
├── components/
│   └── arcade/
│       ├── ArcadeLobby.tsx
│       ├── ArcadeGameCard.tsx
│       ├── nana/
│       │   ├── NanaGame.tsx
│       │   ├── NanaSetup.tsx
│       │   ├── NanaCenterGrid.tsx
│       │   ├── NanaPlayerHand.tsx
│       │   ├── NanaCard.tsx
│       │   ├── NanaTurnIndicator.tsx
│       │   ├── NanaScoreboard.tsx
│       │   └── NanaResult.tsx
│       └── stroop/
│           ├── StroopGame.tsx
│           ├── StroopBall.tsx
│           ├── StroopQuestion.tsx
│           ├── StroopAnswerButtons.tsx
│           ├── StroopProgress.tsx
│           ├── StroopFeedback.tsx
│           ├── StroopResult.tsx
│           └── StroopLeaderboard.tsx
├── lib/
│   └── arcade/
│       ├── nana-engine.ts        -- pure game logic (no React)
│       ├── stroop-engine.ts      -- round generation, scoring logic
│       └── arcade-db.ts          -- Supabase calls for arcade module
└── types/
    └── arcade.ts                 -- all TypeScript interfaces
```

### Key Design Decision

`nana-engine.ts` and `stroop-engine.ts` are pure TypeScript (no React, no Supabase).
All game logic is testable independently.
Components only handle rendering and call engine functions.

-----

## 8. Development Guidelines

### Follows MESP Code Style

- TypeScript strict mode
- Inline styles for component-specific styles
- All colors via CSS variables (`var(--accent)`, `var(--green)`, etc.)
- Bilingual: every user-facing string has English + Japanese

### Bilingual Pattern for Arcade

```typescript
// In component
const { lang } = useApp()   // 'en' | 'ja'

// Usage
<p>{lang === 'ja' ? 'ゲームを始める' : 'Start Game'}</p>

// Or with helper
const t = (en: string, ja: string) => lang === 'ja' ? ja : en
<p>{t('Start Game', 'ゲームを始める')}</p>
```

### Supabase Calls

All arcade Supabase calls go through `lib/arcade/arcade-db.ts`:

```typescript
// Never call supabase directly from game components
// Always import from arcade-db.ts
import { saveStroopSession, getStroopLeaderboard } from '@/lib/arcade/arcade-db'
```

### No Mock Data

Arcade does not use `data/` mock files.
Game state is generated in-memory by engine functions.
DB integration is real from day one.

### Build Order

Recommended implementation order:

```
Phase A — Foundation
1. Create DB tables (arcade_game_sessions, arcade_rankings, achievements)
2. Create types/arcade.ts
3. Create lib/arcade/arcade-db.ts (stub functions first)

Phase B — Stroop (simpler, single player)
4. lib/arcade/stroop-engine.ts
5. StroopGame.tsx + sub-components
6. StroopResult.tsx + StroopLeaderboard.tsx
7. Wire to arcade-db.ts
8. Test + verify DB writes

Phase C — Nana
9. lib/arcade/nana-engine.ts
10. NanaSetup.tsx
11. NanaGame.tsx + NanaCenterGrid.tsx + NanaPlayerHand.tsx + NanaCard.tsx
12. NanaResult.tsx
13. Wire to arcade-db.ts (result save only)

Phase D — Integration
14. ArcadeLobby.tsx + ArcadeGameCard.tsx
15. Wire into CommunityHub.tsx
16. Profile integration (read from arcade_rankings)
17. Achievement checks
```

-----

## Appendix: Bilingual Strings Reference

|Key                 |English                    |Japanese     |
|--------------------|---------------------------|-------------|
|arcade.title        |Arcade                     |アーケード        |
|arcade.play         |Play                       |プレイ          |
|arcade.personal_best|Personal Best              |自己ベスト        |
|arcade.global_rank  |Global Rank                |世界ランク        |
|arcade.no_record    |No record yet              |記録なし         |
|nana.title          |Nana                       |ナナ           |
|nana.players        |Players                    |プレイヤー        |
|nana.your_turn      |Your turn                  |あなたのターン      |
|nana.trio_collected |Trio collected!            |トリオ獲得！       |
|nana.turn_failed    |Turn failed                |ターン失敗        |
|nana.winner         |wins!                      |の勝利！         |
|nana.lucky7         |Lucky 7!                   |ラッキー7！       |
|stroop.title        |Stroop Challenge           |ストループチャレンジ   |
|stroop.q_color      |What COLOR is the ball?    |ボールの色は何色？    |
|stroop.q_text       |What does the TEXT say?    |テキストは何と書いてある？|
|stroop.correct      |Correct!                   |正解！          |
|stroop.wrong        |Wrong                      |不正解          |
|stroop.score        |Score                      |スコア          |
|stroop.accuracy     |Accuracy                   |正確率          |
|stroop.avg_reaction |Avg Reaction               |平均反応速度       |
|stroop.leaderboard  |Leaderboard                |ランキング        |
|stroop.save_result  |Save Result                |結果を保存        |
|stroop.login_to_save|Log in to save your results|ログインして結果を保存  |

-----

*MESP Arcade Spec v1.0 — 天神書齋 Tenjin Shosai*
*Next: Begin Phase A implementation*