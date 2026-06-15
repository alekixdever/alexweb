# MESP Session Handoff Document
## 天神書齋 Tenjin Shosai
**Date:** 2026-06-15
**Outgoing Agent:** Claude (DB & Backend)
**Document Purpose:** New conversation onboarding — paste this to new Claude session

---

## 🚨 FIRST PRIORITY — Fix Vercel Build Error

**File:** `~/documents/alexweb/components/CommentSection.tsx`

**Error:**
```
Type error: Argument of type '(c: Comment) => JSX.Element' is not assignable...
Type 'import("hooks/useRealtimeComments").Comment' is not assignable to type 'Comment'
profiles: null not assignable to undefined
```

**Fix — Line 10, replace:**
```typescript
// FROM
import { useRealtimeComments } from "@/hooks/useRealtimeComments";

// TO
import { useRealtimeComments, Comment } from "@/hooks/useRealtimeComments";
```

**Then:** Search for any local `interface Comment {` in CommentSection.tsx and delete it entirely.

**Verify fix:**
```bash
grep -n "interface Comment" ~/documents/alexweb/components/CommentSection.tsx
# Should return nothing
```

**Deploy:**
```bash
cd ~/documents/alexweb
git add .
git commit -m "[CLAUDE] fix: CommentSection Comment type from hook"
git push origin main
```

---

## Project Identity

| Item | Value |
|------|-------|
| Project | 天神書齋 Tenjin Shosai — MESP |
| GitHub | https://github.com/alekixdever/alexweb |
| Live | https://alexweb-kohl.vercel.app |
| Local | `cd ~/documents/alexweb && npm run dev` |
| Full Docs | `~/documents/alexweb/MESP_DEV_DOCS_v3.md` |
| Supabase | Project: tenjin-shosai, Region: Tokyo |
| Super Admin | ulyssesnyx@gmail.com → /admin |

---

## Agent Roster

| Agent | Tag | Role |
|-------|-----|------|
| **Max** | `[MAX]` | Lead — architecture, integration, conflict resolution |
| **Claude** | `[CLAUDE]` | DB & Backend — Supabase, schema, Admin Panel |
| **Chris** | `[CHRIS]` | Storage & Media — image/avatar upload |
| **Eric** | `[ERIC]` | Arcade — Stroop, Nana, leaderboard |
| **Jane** | `[JANE]` | Realtime — hooks, presence, websocket |

**File ownership rules in:** `MESP_DEV_DOCS_v3.md` Section 2.3
**Sync log in:** `MESP_DEV_DOCS_v3.md` Section 15

---

## Tech Stack

```
Next.js 16.2.6 + React 19.2.4 + TypeScript
Tailwind CSS v4 + shadcn/ui (Radix, Nova preset)
Supabase (Auth + DB + Storage + Realtime)
Vercel (auto-deploy on push to main)
Node v25.9.0
```

---

## Completed Work (by Claude)

### Phase 3 — Database ✅
- Locations + Events from Supabase DB (replaced mock data)
- Join/Leave events with real DB writes
- Conflict handling (409 / 23505 errors fixed)
- pendingAction auto-execute after login (JOIN_EVENT)

### Admin Panel ✅
- Venue CRUD (locations table)
- Category CRUD (activity_categories table)
- Event CRUD with ImageUpload (Chris integration)
- User role management
- Theme color editor (live, resets on refresh)

### Identity Hub ✅
- `/profile/[id]` page
- Shows: profile card, joined events, arcade placeholder, achievements placeholder
- Edit own name inline
- Click avatar → profile page

### RightSidebar Real Contacts ✅
- Removed mock data/users.ts dependency
- Now queries real profiles from Supabase
- Excludes self, shows online status via Jane's usePresence
- Click contact → /profile/[id]

---

## Current Sprint 1 Status

| Task | Owner | Status |
|------|-------|--------|
| CommentSection build error fix | Claude | 🔴 DO FIRST |
| CommentSection UI | Jane (done) | ✅ |
| Wire CommentSection into EventCard | Max (done) | ✅ |
| AvatarUpload → /profile/[id] | Chris (done) | ✅ |
| Arcade scores → /profile/[id] | Eric (done) | ✅ |
| Achievements → /profile/[id] | Eric (done) | ✅ |
| Fix MainContent mock import | Max (confirmed OK) | ✅ |
| Real contacts in RightSidebar | Claude | ✅ |
| Ranking tab in CommunityHub | Eric | ⬜ Pending |

---

## Sprint 2 — Claude's Upcoming Tasks

### 1. `posts` Table + RLS
```sql
create table posts (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  content    text not null,
  image_url  text,
  event_id   uuid references events(id) on delete set null,
  created_at timestamptz default now()
);

alter table posts enable row level security;

create policy "Posts viewable by everyone" on posts for select using (true);
create policy "Authenticated users can post" on posts for insert
  with check (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete
  using (auth.uid() = user_id);
```
**After creating:** Tell Jane to enable Realtime publication for `posts` table.

### 2. User Default Venue Preference
```sql
alter table profiles add column if not exists
  default_location_id uuid references locations(id);
```

### 3. Theme Persistence
Save theme to localStorage on change, read on app mount.
**File:** `context/AppContext.tsx`

---

## Database Schema (Current)

### Active Tables
```
profiles          — id, name, avatar_url, role
locations         — id, name, name_ja, region, color, color_bg
activity_categories — id, name, name_ja, color, color_bg
events            — id, title, title_ja, description, description_ja, date,
                    location_id, creator_id, category_id, image_url, tags, tags_ja
event_participants — id, event_id, user_id, joined_at [REALTIME ✅]
comments          — id, event_id, user_id, content, created_at [REALTIME ✅]
arcade_game_sessions — id, user_id, game_id, score, result, accuracy, played_at
arcade_rankings   — id, user_id, game_id, best_score, accuracy, updated_at
achievements      — id, user_id, achievement_key, unlocked_at
```

### Storage Buckets
```
event-images  — public, 5MB max ✅
avatars       — public, 2MB max ✅
```

---

## Key File Paths (Claude's Files)

```
app/admin/page.tsx               ← Admin Panel
app/login/page.tsx               ← Login
app/signup/page.tsx              ← Signup
components/LocationList.tsx      ← Reads Supabase locations
components/ActivityList.tsx      ← Reads Supabase activity_categories
components/EventList.tsx         ← Reads Supabase events
lib/supabase/client.ts           ← Browser Supabase client
lib/supabase/server.ts           ← Server Supabase client
lib/supabase/events.ts           ← getEvents query helper
lib/supabase/locations.ts        ← getLocations query helper
```

---

## Supabase Client Usage

```typescript
// Client-side (in components — always use this)
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// Server-side only (Route Handlers)
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
```

---

## Critical Rules

1. **ALL UI strings must be bilingual** — English + Japanese
   ```typescript
   // ✅ Correct
   <p>Join Event / 参加する</p>
   // ❌ Wrong
   <p>Join Event</p>
   ```

2. **Never hardcode hex colors** — use CSS variables
   ```typescript
   // ✅ color: "var(--accent)"
   // ❌ color: "#8b5cf6"
   ```

3. **No <form> tags** — use button onClick handlers

4. **DB changes require announcement** — update Sync Log Section 15

5. **Don't touch Eric's arcade/** or **Jane's hooks/** without coordination

---

## Sync Log Entry to Add (Section 15 of MESP_DEV_DOCS_v3.md)

```markdown
### 2026-06-15 [CLAUDE] Sprint 1 Complete + Session Handoff
**Completed:**
- RightSidebar: replaced mock contacts with real Supabase profiles query
- Generated Session Handoff Document for new conversation

**Modified Shared Files:**
- components/RightSidebar.tsx — real DB contacts, usePresence integration

**Blocked By:**
- CommentSection.tsx build error (first fix in new session)

**Next Session Plan:**
- Fix CommentSection type error (URGENT)
- Create posts table + RLS (Sprint 2)
- User default venue preference
- Theme persistence
```

---

## New Conversation Opening Message

Copy-paste this to start the new Claude session:

---

你是 **[CLAUDE]**，參與天神書齋 Tenjin Shosai (MESP) 多 AI 協作開發。

**角色：** DB & Backend — Supabase schema、Admin Panel、backend logic

**立刻要做（Build Error）：**
`~/documents/alexweb/components/CommentSection.tsx` Line 10
```typescript
// 改為
import { useRealtimeComments, Comment } from "@/hooks/useRealtimeComments";
```
刪除檔案內所有 `interface Comment {` 定義，然後 push。

**完整文件：**
`~/documents/alexweb/MESP_DEV_DOCS_v3.md`
`~/documents/alexweb/MESP_Session_Handoff.md`（本文件）

**其他 AI：** Max (Lead), Chris (Storage), Eric (Arcade), Jane (Realtime)

**Sprint 2 你的任務：**
1. `posts` table + RLS
2. User default venue preference
3. Theme persistence

---

*Handoff generated: 2026-06-15*
*Next doc version: MESP_DEV_DOCS_v4.md (after Sprint 2)*
