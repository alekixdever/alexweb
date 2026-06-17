# 通用遊戲邀請系統
# GAME_INVITE_SYSTEM.md
# 最後更新：2026-06-16

---

## 1. 概覽

天神書齋的遊戲邀請系統讓玩家在遊戲房間建立後，可直接從 RightSidebar 的成員列表邀請其他用戶加入，無需手動分享房間碼。

系統設計為**通用**：任何遊戲只需呼叫兩個函式即可接入，RightSidebar 自動顯示對應的邀請按鈕。

---

## 2. 架構

```
NanaGame / FutureGame
    │
    ├── 建房後 → registerGameInvite("nana", roomId, inviteFn)
    │                          ↓
    │                   AppContext 儲存
    │                   activeGame: { gameId, roomId }
    │                   inviteContact: (targetUserId) => void
    │                          ↓
    │                   RightSidebar 讀取
    │                   → 顯示 "Nana" 邀請按鈕
    │
    └── 離開 / 遊戲結束 → unregisterGameInvite()
                                   ↓
                           activeGame = null
                           邀請按鈕消失
```

---

## 3. AppContext API

### 讀取
```typescript
const { activeGame, inviteContact } = useApp();

// activeGame: { gameId: string, roomId: string } | null
// inviteContact: ((targetUserId: string) => void) | undefined
```

### 寫入
```typescript
const { registerGameInvite, unregisterGameInvite } = useApp();

// 建房後呼叫
registerGameInvite(gameId, roomId, inviteFn);

// 離開 / 遊戲結束時呼叫
unregisterGameInvite();
```

### 型別
```typescript
export interface ActiveGame {
  gameId: string;   // 遊戲識別碼，例如 "nana" | "stroop" | "future_game"
  roomId: string;   // 當前房間 ID
}
```

---

## 4. 實作細節（AppContext 內部）

### 為什麼用 useRef + wrapper？

React 的 `useState` setter 如果收到 function，會把它當 updater 執行（`setState(fn)` → React 呼叫 `fn(prevState)`）。

這導致直接存 inviteFn 會發生雙層包裹 bug：
```typescript
// ❌ 錯誤 — React 把 inviteFn 當 updater 執行，存入的是 inviteFn() 的回傳值
setInviteContact(inviteFn);

// ❌ 也錯 — 手動雙層包裹，nanaInviteContact 實際上是 () => inviteFn
setNanaInviteContact(() => () => inviteFn);
```

正確做法：
```typescript
// ✅ ref 存真正的 fn，state 只存不變的 wrapper
const inviteFnRef = useRef<((targetUserId: string) => void) | undefined>(undefined);

const registerGameInvite = useCallback(
  (gameId: string, roomId: string, inviteFn: (targetUserId: string) => void) => {
    inviteFnRef.current = inviteFn;          // ref 存真實 fn
    setActiveGame({ gameId, roomId });
    setInviteContact(() => (targetUserId: string) => {
      inviteFnRef.current?.(targetUserId);   // wrapper 透過 ref 呼叫
    });
  },
  [],
);
```

---

## 5. 新遊戲接入步驟

### Step 1 — 建房後立即 register

```typescript
// YourGame.tsx
import { useApp } from "@/context/AppContext";

const { registerGameInvite, unregisterGameInvite } = useApp();

// 建房成功後（取得 roomId 之後）
function handleRoomCreated(roomId: string) {
  const inviteFn = (targetUserId: string) => {
    // 呼叫你的遊戲邀請廣播函式
    broadcastYourGameInvite(roomId, targetUserId, user?.id ?? "", profileName);
  };
  registerGameInvite("your_game_id", roomId, inviteFn);
}
```

### Step 2 — 離開時 unregister

```typescript
// 遊戲結束、離開大廳、Play Again 時呼叫
unregisterGameInvite();

// unmount 時也要清除
useEffect(() => {
  return () => { unregisterGameInvite(); };
}, [unregisterGameInvite]);
```

### Step 3 — 建立邀請廣播 hook

參考 `hooks/useRealtimeNanaInvite.ts`，建立你的遊戲邀請 hook：

```typescript
// hooks/useRealtimeYourGameInvite.ts
export function useRealtimeYourGameInvite({
  userId,
  onInviteReceived,
}: {
  userId?: string;
  onInviteReceived: (payload: YourGameInvitePayload) => void;
}) {
  // 使用 Supabase Realtime Broadcast
  // 頻道名建議：`your_game_invite:${userId}`
  // ...
  return { broadcastYourGameInvite };
}
```

### Step 4 — RightSidebar 自動支援

RightSidebar 會自動讀取 `activeGame.gameId` 顯示按鈕，**不需要修改 RightSidebar**。

按鈕 label 由 `getInviteLabel()` 產生：
```typescript
// RightSidebar.tsx 內部
function getInviteLabel(gameId: string) {
  if (gameId === "nana") return "Nana";
  // 新遊戲自動 fallback：首字母大寫
  return gameId.charAt(0).toUpperCase() + gameId.slice(1);
}
```

如需自訂 label，在 `getInviteLabel` 加一行即可：
```typescript
if (gameId === "stroop") return "Stroop";
```

---

## 6. 受邀者流程

受邀者需要：

1. **接收邀請**：透過遊戲專屬的 Realtime hook 監聽
2. **顯示 Toast**：`NanaInviteToast` 可作為範本
3. **接受後加入房間**：設定 `pendingInviteRoomId` → Lobby `autoJoin`

```typescript
// 接收邀請
const { broadcastYourGameInvite } = useRealtimeYourGameInvite({
  userId: user?.id,
  onInviteReceived: (payload) => {
    setPendingInvitePayload(payload);  // 觸發顯示 Toast
  },
});

// 接受邀請
<YourGameInviteToast
  onAccept={() => setAcceptedInvite(true)}
  onDecline={() => setPendingInvitePayload(undefined)}
/>

// 跳轉到 Lobby autoJoin
{pendingInvitePayload && acceptedInvite && (
  <YourGameLobby
    pendingInviteRoomId={pendingInvitePayload.roomId}
    onRoomReady={handleRoomReady}
    onExit={handleLobbyExit}
  />
)}
```

---

## 7. Nana 邀請廣播格式（參考）

```typescript
// hooks/useRealtimeNanaInvite.ts
export interface NanaInvitePayload {
  roomId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
}

// 廣播頻道：`nana_invite:${toUserId}`
// Event：`nana_invite`
```

---

## 8. 注意事項

- 同一時間只有一個 `activeGame`。若玩家同時開兩個遊戲，後者會覆蓋前者。
- `inviteContact` 在 `unregisterGameInvite()` 後為 `undefined`，RightSidebar 按鈕自動消失。
- `nanaInviteSoundEnabled` 仍保留在 AppContext，僅供 Nana 邀請 Toast 使用。其他遊戲若需音效，建議各自管理偏好。
