# Arcade 新遊戲開發指南
# ARCADE_DEV_GUIDE.md
# 最後更新：2026-06-16

---

## 1. 概覽

本文件說明如何在天神書齋 MESP 平台新增一個 Arcade 遊戲，包含：
- 單人遊戲（分數 / 成就）
- 多人遊戲（房間 + Realtime + 邀請）

---

## 2. 共用基礎設施

以下系統所有遊戲共用，**不需重複建立**：

| 系統 | 位置 | 說明 |
|------|------|------|
| 分數儲存 | `arcade_rankings` table | `user_id + game_id` 複合 PK |
| 遊戲 Session | `arcade_game_sessions` table | 每局記錄 |
| 成就系統 | `achievements` table | `achievement_key` 識別 |
| 排行榜 UI | `components/arcade/ArcadeLobby.tsx` | 傳入 `game_id` 即可 |
| 遊戲邀請 | `AppContext` + `RightSidebar` | 見 GAME_INVITE_SYSTEM.md |

---

## 3. 目錄慣例

```
components/arcade/
├── ArcadeLobby.tsx          # 入口（不動）
├── AchievementsTab.tsx      # 成就（不動）
├── nana/                    # Nana 多人遊戲
│   ├── NanaGame.tsx
│   ├── NanaRoomLobby.tsx
│   └── ...
└── your_game/               # 新遊戲放這裡
    ├── YourGame.tsx         # 主控制器
    ├── YourGameLobby.tsx    # 多人大廳（若需要）
    └── ...

lib/arcade/
├── nana-engine.ts           # Nana 純邏輯
├── nana-rooms.ts
├── nana-room-db.ts
├── useRealtimeNana.ts
└── your-game-engine.ts      # 新遊戲純邏輯放這裡

hooks/
├── useRealtimeNanaInvite.ts
└── useRealtimeYourGameInvite.ts  # 新遊戲邀請 hook
```

---

## 4. 單人遊戲 Checklist

### 4.1 遊戲邏輯
- [ ] 建立 `lib/arcade/your-game-engine.ts`（純函式，無 React）
- [ ] 建立 `components/arcade/your_game/YourGame.tsx`

### 4.2 分數儲存
```typescript
// 遊戲結束時寫入
const supabase = createClient();

// 儲存 session
await supabase.from("arcade_game_sessions").insert({
  user_id: user.id,
  game_id: "your_game",
  score: finalScore,
  accuracy: finalAccuracy,  // 0–1
  result: "win" | "lose" | "complete",
});

// 更新最高分
await supabase.from("arcade_rankings").upsert({
  user_id: user.id,
  game_id: "your_game",
  best_score: finalScore,
  accuracy: finalAccuracy,
  updated_at: new Date().toISOString(),
}, { onConflict: "user_id,game_id" });
```

### 4.3 成就（與 Eric 協調）
```typescript
// 解鎖成就
await supabase.from("achievements").insert({
  user_id: user.id,
  achievement_key: "your_game_first_win",
});
```

---

## 5. 多人遊戲 Checklist

### 5.1 資料庫
- [ ] 建立 `your_game_rooms` table（參考 nana_rooms schema）
- [ ] 建立 `your_game_room_players` table（參考 nana_room_players schema）
- [ ] 在 Dashboard → Replication → `supabase_realtime` 勾選兩個 table
- [ ] 設定 RLS（authenticated SELECT / INSERT；host UPDATE）
- [ ] 若需要 RPC（如 increment player count），注意 text vs uuid 問題（見下方）

> ⚠️ **RPC text vs uuid 陷阱**
> 若 table `id` 欄位是 text，RPC 參數是 uuid，需要：
> ```sql
> WHERE id::uuid = p_room_id   -- id（text）轉型後比對
> ```
> 參數名必須與欄位名不同（用 `p_room_id` 而非 `room_id`）。

### 5.2 遊戲引擎
- [ ] 建立 `lib/arcade/your-game-engine.ts`
  - 純函式，輸入 state + action，輸出新 state
  - 不依賴 React、Supabase

### 5.3 Realtime Hook
- [ ] 建立 `lib/arcade/useRealtimeYourGame.ts`
  - 頻道名建議：`your_game:${roomId}`
  - 廣播事件：`game_state`（完整狀態）

```typescript
// 最小介面
export function useRealtimeYourGame({
  roomId,
  userId,
  onGameStateUpdate,
}: {
  roomId: string;
  userId: string;
  onGameStateUpdate: (state: YourGameState) => void;
}) {
  // Supabase Realtime Broadcast
  return { connected, broadcastGameState };
}
```

### 5.4 邀請系統
- [ ] 建立 `hooks/useRealtimeYourGameInvite.ts`（參考 useRealtimeNanaInvite.ts）
- [ ] 在 `YourGame.tsx` 建房後呼叫 `registerGameInvite("your_game", roomId, inviteFn)`
- [ ] unmount / 遊戲結束時呼叫 `unregisterGameInvite()`
- [ ] 若需自訂邀請按鈕 label，在 `RightSidebar.tsx` 的 `getInviteLabel()` 加一行

詳細說明見 `GAME_INVITE_SYSTEM.md`。

### 5.5 大廳組件
- [ ] 建立 `YourGameLobby.tsx`，必須支援以下 Props：

```typescript
interface Props {
  userId: string;
  userName: string;
  lang: "en" | "ja";
  onRoomReady: (roomId: string, playerIndex: number, playerCount: number) => void;
  onRoomCreated?: (roomId: string) => void;  // 邀請系統必需
  onExit: () => void;
  pendingInviteRoomId?: string;              // 自動加入邀請房間
}
```

---

## 6. 接入 ArcadeLobby

在 `components/arcade/ArcadeLobby.tsx` 加入新遊戲入口：

```typescript
// ArcadeLobby.tsx
// 找到遊戲列表，新增：
{
  id: "your_game",
  name: "Your Game",
  name_ja: "あなたのゲーム",
  component: <YourGame onExit={() => setActiveGame(null)} />,
}
```

---

## 7. 雙語規則（重要）

所有 UI 文字必須同時提供 EN + JA：

```typescript
// 使用 t() helper
const t = (en: string, ja: string) => (lang === "ja" ? ja : en);

// 靜態文字
<p>{t("Room Code", "部屋コード")}</p>

// 或直接並排
<p>Room Code / 部屋コード</p>
```

---

## 8. CSS 規則

- 所有顏色使用 CSS Variables（見 MESP_TECH_DOC.md Section 5）
- 禁止硬寫 hex（例：`color: "#8b5cf6"` → 改用 `color: "var(--accent)"`）
- 卡片背景用 `className="float-card"`
- 按鈕用 `className="btn-primary"` 或 `"btn-secondary"`

---

## 9. 提交前 Checklist

- [ ] 所有 UI 文字雙語
- [ ] 無硬寫 hex 顏色
- [ ] 無 `<form>` 標籤
- [ ] `window` / `localStorage` 只在 `useEffect` 內使用
- [ ] State 預設值為 server-safe（不依賴 `window`）
- [ ] 新 table 已加入 Realtime publication
- [ ] `unregisterGameInvite()` 在所有出口（exit / play again / unmount）都有呼叫
- [ ] 通知 Claude 更新 Sync Log（Section 15）
