# Nana 多人模式技術文件
# NANA_TECH_DOC.md
# 最後更新：2026-06-16

---

## 1. 概覽

Nana 是天神書齋 MESP 平台的多人卡牌遊戲，支援 2–6 人即時對戰。
技術基礎：Supabase Realtime（廣播）+ PostgreSQL（房間管理）+ React 純狀態遊戲引擎。

---

## 2. 目錄結構

```
components/arcade/nana/
├── NanaGame.tsx          # 主控制器（狀態機）
├── NanaRoomLobby.tsx     # 建房 / 加入房間 / 等待大廳
├── NanaCenterGrid.tsx    # 中央 3×3 牌格
├── NanaPlayerHand.tsx    # 玩家手牌
├── NanaTurnIndicator.tsx # 回合提示
├── NanaScoreboard.tsx    # 計分板
├── NanaResult.tsx        # 遊戲結束畫面
└── NanaInviteToast.tsx   # 收到邀請 Toast

lib/arcade/
├── nana-engine.ts        # 純遊戲邏輯（無 React / 無 Supabase）
├── nana-rooms.ts         # createNanaRoom()
├── nana-room-db.ts       # getNanaRoom / joinNanaRoom / getNanaRoomPlayers / updateNanaRoomStatus
└── useRealtimeNana.ts    # Supabase Realtime 廣播 hook

hooks/
└── useRealtimeNanaInvite.ts  # 邀請廣播 hook
```

---

## 3. 資料庫 Schema

### nana_rooms
```sql
id            text PRIMARY KEY          -- 6 字元房間碼（非 uuid）
host_user_id  uuid FK → profiles
player_count  int  DEFAULT 1
status        text DEFAULT 'waiting'    -- 'waiting' | 'playing' | 'finished'
created_at    timestamptz DEFAULT now()
```

> ⚠️ `id` 是 **text**，不是 uuid。RPC 內查詢需用 `id::uuid` 轉型（見 Section 9）。

### nana_room_players
```sql
room_id       uuid FK → nana_rooms
user_id       uuid FK → profiles
player_index  int NOT NULL
joined_at     timestamptz DEFAULT now()
PRIMARY KEY (room_id, user_id)
```

### RLS 設定
| Table | SELECT | INSERT | UPDATE |
|-------|--------|--------|--------|
| nana_rooms | authenticated | auth.uid() = host_user_id | auth.uid() = host_user_id |
| nana_room_players | authenticated | auth.uid() = user_id | — |

### Realtime Publication
兩個 table 均已加入 `supabase_realtime` publication。

### RPC Function
```sql
CREATE OR REPLACE FUNCTION increment_nana_room_player_count(p_room_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE nana_rooms
  SET player_count = player_count + 1
  WHERE id::uuid = p_room_id;  -- id 是 text，需轉型
END;
$$;
```

---

## 4. 遊戲引擎（nana-engine.ts）

純函式，無副作用，可單元測試。

### 牌組
- 數字 1–12，每個數字 3 張，共 36 張
- 中央格：前 9 張（3×3 grid）
- 手牌：依人數按 DEAL_MAP 分配

```typescript
const DEAL_MAP = {
  2: { perPlayer: 13, leftover: 1 },
  3: { perPlayer: 9,  leftover: 0 },
  4: { perPlayer: 6,  leftover: 3 },
  5: { perPlayer: 5,  leftover: 2 },
  6: { perPlayer: 4,  leftover: 3 },
}
```

### 核心 API
```typescript
setupGame(playerNames: string[], playerUserIds: string[]) → NanaGameState
flipCard(state: NanaGameState, target: FlipTarget) → NanaGameState
commitTurnFail(state: NanaGameState) → NanaGameState
getFlippableTargets(state: NanaGameState) → FlipTarget[]
checkWinCondition(player: NanaPlayer) → WinResult
```

### FlipTarget
```typescript
type FlipTarget =
  | { type: "center"; gridIndex: number }        // 中央格 0–8
  | { type: "hand"; playerIndex: number; side: "left" | "right" }  // 手牌最左 / 最右
```

### 回合流程
```
flip1 → flip2
  ├── 不同數字 → revealing（牌保持翻開 3 秒）→ commitTurnFail → 換手
  └── 相同數字 → flip3
        ├── 不同數字 → revealing → commitTurnFail → 換手
        └── 相同數字 → collectTrio → 檢查勝利條件
```

### 勝利條件
| 方式 | 條件 |
|------|------|
| `three_trios` | 收集 3 組 trio |
| `lucky_7` | 任意兩組 trio 數字相加或相差為 7 |

---

## 5. NanaGameState 型別

```typescript
interface NanaGameState {
  phase: "playing" | "gameOver";
  centerGrid: (NanaCard | null)[];  // 長度 9
  players: NanaPlayer[];
  currentPlayerIndex: number;
  currentTurn: {
    flipsThisTurn: NanaCard[];
    phase: "flip1" | "flip2" | "flip3" | "revealing";
  };
  winner: string | null;
  winMethod: WinMethod | null;
  turnHistory: TurnRecord[];
}
```

---

## 6. Realtime 架構

使用 **Supabase Broadcast**（非 Postgres Changes）傳遞遊戲狀態。
頻道名：`nana_game:${roomId}`

### useRealtimeNana hook
```typescript
const { connected, broadcastGameState, broadcastFlip } = useRealtimeNana({
  roomId,
  userId,
  userName,
  playerIndex,
  onGameStateUpdate: (state) => setGameState(state),
  onPlayerJoined: () => {},
});
```

### 廣播事件
| Event | 觸發時機 | Payload |
|-------|---------|---------|
| `game_state` | 每次狀態更新 | `NanaGameState` |
| `flip` | 玩家翻牌 | `FlipTarget` |

---

## 7. NanaGame.tsx 狀態機

```
未登入 → 顯示登入提示

已登入，無 roomId → NanaRoomLobby
  ├── 建房 → onRoomCreated(rid) → registerGameInvite("nana", rid, inviteFn)
  │          → 等待玩家 → onRoomReady(rid, playerIndex, playerCount)
  └── 收到邀請 Toast → acceptedInvite=true → NanaRoomLobby (autoJoin)

有 roomId + gameState → 遊戲進行中
  └── gameState.phase === "gameOver" → NanaResult
```

### 關鍵 Callbacks
```typescript
// 建房後立即呼叫 — 讓 RightSidebar 顯示邀請按鈕
handleRoomCreated(rid: string)
  → registerGameInvite("nana", rid, inviteFn)

// 所有玩家就位後呼叫 — 開始遊戲
handleRoomReady(rid, playerIndex, playerCount)
  → setupGame() → broadcastGameState()

// 翻牌失敗 3 秒後蓋回
revealing phase → setTimeout 3000ms → commitTurnFail()
```

---

## 8. NanaRoomLobby.tsx Props

```typescript
interface Props {
  userId: string;
  userName: string;
  lang: "en" | "ja";
  onRoomReady: (roomId: string, playerIndex: number, playerCount: number) => void;
  onRoomCreated?: (roomId: string) => void;  // 建房成功後立即觸發
  onExit: () => void;
  pendingInviteRoomId?: string;              // 有此值時自動加入
}
```

### LobbyPhase 狀態機
```
menu → creating → waiting
     → join_input → joining → waiting
pendingInviteRoomId 存在 → 直接 joining → waiting
```

---

## 9. 已知注意事項

1. **`nana_rooms.id` 是 text**：RPC 查詢須 `WHERE id::uuid = p_room_id`，否則報 `operator does not exist: text = uuid`。
2. **RPC 參數命名**：參數名不能與欄位名相同（用 `p_room_id` 而非 `room_id`）。
3. **Realtime 需手動加入 publication**：新增 table 後必須在 Dashboard → Database → Replication → `supabase_realtime` 勾選。
4. **revealing phase**：翻牌失敗時 `getFlippableTargets` 回傳空陣列，防止玩家繼續翻牌。3 秒 timer 由 `NanaGame` 管理，`commitTurnFail` 執行蓋牌 + 換手。
5. **broadcastGameState 時機**：host（playerIndex === 0）負責 `setupGame` 並廣播初始狀態，其他玩家透過 `onGameStateUpdate` 接收。
