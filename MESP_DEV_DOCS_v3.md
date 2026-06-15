# 天神書齋 Tenjin Shosai — MESP
## Modular Event Social Platform
### Master Development Documentation v3.0
**Last Updated:** 2026-06-14
**Status:** Active Multi-Agent Development
**Document Owner:** Max (Lead AI)
**Contributing Agents:** Max, Claude, Chris, Eric, Jane

---

> ⚠️ IMPORTANT FOR ALL AGENTS
> Read Section 2 (Agent Protocol) BEFORE touching any code.
> Every agent must log their work in Section 2.5 (Sync Log) after each session.
> File ownership rules in Section 2.3 are STRICT — do not edit another agent's files without approval.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Agent Collaboration Protocol](#2-agent-collaboration-protocol)
3. [Tech Stack](#3-tech-stack)
4. [Environment Variables](#4-environment-variables)
5. [Project Structure](#5-project-structure)
6. [Database Schema](#6-database-schema)
7. [Authentication & Roles](#7-authentication--roles)
8. [State Management](#8-state-management)
9. [Component Architecture](#9-component-architecture)
10. [Design System](#10-design-system)
11. [Current Status](#11-current-status)
12. [Roadmap & Task Assignment](#12-roadmap--task-assignment)
13. [Known Issues](#13-known-issues)
14. [Development Guidelines](#14-development-guidelines)
15. [Sync Log](#15-sync-log)

---

## 1. Project Overview

**天神書齋 Tenjin Shosai** is a bilingual (English + Japanese) modular event social platform for a café and rental space in Japan.

### Live URL
`https://alexweb-kohl.vercel.app`

### GitHub
`https://github.com/alekixdever/alexweb` — auto-deploys to Vercel on push to `main`

### Local Dev
```bash
cd ~/documents/alexweb && npm run dev  # localhost:3000
```

### Super Admin Access
- Email: `ulyssesnyx@gmail.com`
- Panel: `/admin` (⚙️ button in Header after login)

### Core Product
Social activity dashboard where users:
- Browse events by venue / date / category
- Join events, comment, interact
- Play arcade games (Stroop, Nana)
- Build identity profile (events, scores, achievements)
- Post to community feed (in development)

---

## 2. Agent Collaboration Protocol

### 2.1 Agent Roster & Responsibilities

| Agent | Role | Primary Responsibility | Contact Signal |
|-------|------|----------------------|----------------|
| **Max** | Lead AI | Architecture decisions, integration, conflict resolution, roadmap | `[MAX]` |
| **Claude** | DB & Backend | Supabase queries, schema changes, Admin Panel, backend logic | `[CLAUDE]` |
| **Chris** | Storage & Media | Supabase Storage, image upload, avatar, media components | `[CHRIS]` |
| **Eric** | Arcade & Games | Arcade games, game engine, leaderboard, achievements | `[ERIC]` |
| **Jane** | Realtime & Presence | Realtime hooks, WebSocket, presence, live updates | `[JANE]` |

### 2.2 Sync Protocol

#### When to Sync
Agents MUST sync (update Section 15 Sync Log) after:
- ✅ Completing a task
- ✅ Adding a new DB table or column
- ✅ Adding a new hook or context
- ✅ Changing a shared interface/type
- ✅ Modifying a file owned by another agent
- ⚠️ Before starting work that touches shared files
- ⚠️ When blocked by another agent's incomplete work

#### Sync Format
When updating Section 15, use this format:
```
## [DATE] [AGENT_TAG] Session Summary
**Completed:**
- List of completed tasks with file paths

**Modified Shared Files:**
- filename.tsx — what changed and why

**New DB Changes:**
- Table/column added: describe schema

**Blocked By:**
- What you need from another agent

**Next Session Plan:**
- What you plan to do next
```

#### Sync Frequency
- **Minimum:** Once per work session
- **Recommended:** After every 2-3 file changes
- **Required:** Before any DB schema change

### 2.3 File Ownership & Boundaries

#### Owned Files (do NOT edit without owner approval)
| File/Directory | Owner | Can be read by |
|---------------|-------|----------------|
| `components/arcade/**` | Eric | All |
| `lib/arcade/**` | Eric | All |
| `types/arcade.ts` | Eric | All |
| `lib/supabase/storage.ts` | Chris | All |
| `components/ImageUpload.tsx` | Chris | All |
| `components/AvatarUpload.tsx` | Chris | All |
| `hooks/useRealtimeParticipants.ts` | Jane | All |
| `hooks/useRealtimeComments.ts` | Jane | All |
| `hooks/usePresence.ts` | Jane | All |
| `components/CommunityHub.tsx` | Jane | All |
| `app/admin/page.tsx` | Claude | All |
| `lib/supabase/events.ts` | Claude | All |
| `lib/supabase/locations.ts` | Claude | All |

#### Shared Files (coordinate before editing)
| File | Current Owner | Notes |
|------|--------------|-------|
| `components/EventCard.tsx` | Max | Integrates Claude DB + Jane Realtime |
| `components/RightSidebar.tsx` | Max | Integrates Jane Presence |
| `context/AppContext.tsx` | Max | All agents read this |
| `app/profile/[id]/page.tsx` | Max | Will integrate Eric scores + Chris avatar |
| `app/globals.css` | Max | Design system — coordinate changes |
| `app/page.tsx` | Max | Main layout orchestration |

#### Free to Create (no coordination needed)
- New components in `components/community/`
- New hooks in `hooks/`
- New pages in `app/`
- New types in `types/`

### 2.4 Integration Rules

1. **Never break another agent's hook/component API** — if you need to change an interface, announce in Sync Log first
2. **DB changes require Claude approval** — any new table or column must be discussed
3. **Realtime subscriptions require Jane approval** — adding new channels could conflict
4. **CSS variable changes require Max approval** — design system is global
5. **All new UI must be bilingual** — English + Japanese (see Section 14)
6. **All new DB operations must have RLS policies** — Claude sets them up

### 2.5 Conflict Resolution
1. Agent identifies conflict → logs in Sync Log with `⚠️ CONFLICT:` prefix
2. Max reviews and makes decision within next session
3. Decision logged in Sync Log with `✅ RESOLVED:` prefix
4. All agents acknowledge in their next sync

### 2.6 Handoff Checklist
When an agent finishes a feature and hands off to another:
- [ ] All TypeScript errors resolved
- [ ] Bilingual strings added
- [ ] Sync Log updated
- [ ] File ownership updated in Section 2.3 if new files created
- [ ] Any new DB tables documented in Section 6
- [ ] Any new environment variables documented in Section 4

---

## 3. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui (Radix, Nova preset) | latest |
| Auth | Supabase Auth | latest |
| Database | Supabase PostgreSQL | latest |
| Storage | Supabase Storage | ✅ Active (Chris) |
| Realtime | Supabase Realtime | ✅ Active (Jane) |
| Icons | Lucide React | latest |
| Hosting | Vercel | Auto-deploy on push to main |
| Node | v25.9.0 | — |
| Package Manager | npm 11.12.1 | — |

---

## 4. Environment Variables

### `.env.local` (never commit to Git)
```
NEXT_PUBLIC_SUPABASE_URL=https://mydobpksljqoimzyylox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Vercel Settings
Set manually in Vercel Dashboard → Settings → Environment Variables.
Same two keys as above. Must be updated manually when Supabase project changes.

> ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.

---

## 5. Project Structure

```
alexweb/
├── app/
│   ├── globals.css                  # [Max] Design system, CSS vars, themes
│   ├── layout.tsx                   # [Max] Root: AuthProvider + AppProvider
│   ├── page.tsx                     # [Max] Main layout orchestration
│   ├── login/page.tsx               # [Claude] Login page
│   ├── signup/page.tsx              # [Claude] Signup page
│   ├── admin/page.tsx               # [Claude] Super Admin Panel
│   └── profile/[id]/page.tsx        # [Max] Identity Hub
├── components/
│   ├── Header.tsx                   # [Max]
│   ├── LeftSidebar.tsx              # [Max]
│   ├── LocationList.tsx             # [Claude] Reads Supabase locations
│   ├── ActivityList.tsx             # [Claude] Reads Supabase activity_categories
│   ├── Calendar.tsx                 # [Max] Dual-month
│   ├── MainContent.tsx              # [Max] Events/Community tabs
│   ├── EventList.tsx                # [Claude] Reads Supabase events
│   ├── EventCard.tsx                # [Max] Uses Jane's useRealtimeParticipants
│   ├── EmptyState.tsx               # [Max]
│   ├── RightSidebar.tsx             # [Max] Uses Jane's usePresence
│   ├── AuthModal.tsx                # [Max]
│   ├── MobileDrawer.tsx             # [Max] lg:hidden
│   ├── InfoModal.tsx                # [Max] Logo → 5 sub-pages
│   ├── CommunityHub.tsx             # [Jane] Feed|Arcade|Ranking|Discussion|Achievements
│   ├── ImageUpload.tsx              # [Chris] Event image upload
│   ├── AvatarUpload.tsx             # [Chris] Avatar upload — NOT YET INTEGRATED
│   ├── community/                   # [Max/Jane] NEW — community features
│   │   ├── Feed.tsx                 # TODO — community posts feed
│   │   ├── PostCard.tsx             # TODO
│   │   └── PostComposer.tsx         # TODO
│   └── arcade/                      # [Eric]
│       ├── ArcadeLobby.tsx
│       ├── ArcadeGameCard.tsx
│       ├── stroop/                  # Full Stroop game
│       └── nana/                    # Full Nana card game
├── context/
│   ├── AppContext.tsx               # [Max] Global state + Supabase auth
│   └── AuthContext.tsx              # [Legacy — merged into AppContext]
├── data/                            # ⚠️ LEGACY MOCK — being phased out
│   ├── events.ts                    # Partially replaced by DB
│   ├── locations.ts                 # Partially replaced by DB
│   └── users.ts                     # Still used for RightSidebar contacts
├── hooks/                           # [Jane]
│   ├── useRealtimeParticipants.ts
│   ├── useRealtimeComments.ts
│   └── usePresence.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # [Max] Browser Supabase client
│   │   ├── server.ts               # [Max] Server Supabase client
│   │   ├── storage.ts              # [Chris] Upload/delete helpers
│   │   ├── events.ts               # [Claude] getEvents query helper
│   │   └── locations.ts            # [Claude] getLocations query helper
│   └── arcade/                     # [Eric]
│       ├── arcade-db.ts
│       ├── stroop-engine.ts
│       ├── nana-engine.ts
│       └── useRealtimeNana.ts
├── types/
│   └── arcade.ts                   # [Eric] Arcade TypeScript interfaces
├── public/
│   ├── tenjinshosai.png            # Main logo
│   ├── tenjinshosai_logo.png       # App icon (future iOS/PWA)
│   ├── about-us.jpg
│   ├── company.jpg
│   └── company2.jpg
└── proxy.ts                        # [Max] Route protection
```

---

## 6. Database Schema

### Supabase Project: `tenjin-shosai` | Region: Tokyo (ap-northeast-1)

### Core Tables

#### `profiles`
```sql
id          uuid  PK FK auth.users cascade delete
name        text
avatar_url  text  nullable
role        text  default 'member'  -- 'member'|'admin'|'super_admin'
created_at  timestamptz default now()
```

#### `locations`
```sql
id          uuid  PK default uuid_generate_v4()
name        text  NOT NULL  -- English
name_ja     text  NOT NULL  -- Japanese
region      text  NOT NULL
color       text  NOT NULL  -- hex e.g. "#a78bfa"
color_bg    text  NOT NULL  -- rgba e.g. "rgba(167,139,250,0.12)"
created_at  timestamptz default now()
```

#### `activity_categories`
```sql
id          uuid  PK
name        text  NOT NULL
name_ja     text  NOT NULL
color       text  default '#8b5cf6'
color_bg    text  default 'rgba(139,92,246,0.12)'
created_at  timestamptz default now()
```

#### `events`
```sql
id              uuid  PK
title           text  NOT NULL
title_ja        text  NOT NULL
description     text  NOT NULL
description_ja  text  NOT NULL
date            timestamptz NOT NULL
location_id     uuid  FK locations(id)
creator_id      uuid  FK profiles(id)
category_id     uuid  FK activity_categories(id) nullable
image_url       text  nullable  -- Supabase Storage URL
tags            text[]  default '{}'
tags_ja         text[]  default '{}'
created_at      timestamptz default now()
```

#### `event_participants`  ← Realtime enabled ✅
```sql
id         uuid  PK
event_id   uuid  FK events(id) cascade delete
user_id    uuid  FK profiles(id) cascade delete
joined_at  timestamptz default now()
UNIQUE(event_id, user_id)
```

#### `comments`  ← Realtime enabled ✅
```sql
id         uuid  PK
event_id   uuid  FK events(id) cascade delete
user_id    uuid  FK profiles(id) cascade delete
content    text  NOT NULL
created_at timestamptz default now()
```

### Arcade Tables (Eric)

#### `arcade_game_sessions`
```sql
id              uuid  PK
user_id         uuid  FK profiles(id) cascade delete
game_id         text  -- 'nana'|'stroop'
score           integer nullable
result          text nullable  -- 'win'|'lose'|null
accuracy        numeric(5,2) nullable
avg_reaction_ms integer nullable
rounds_played   integer nullable
played_at       timestamptz default now()
```

#### `arcade_rankings`
```sql
id          uuid  PK
user_id     uuid  FK profiles(id) cascade delete
game_id     text  NOT NULL
best_score  integer NOT NULL
accuracy    numeric(5,2) nullable
updated_at  timestamptz default now()
UNIQUE(user_id, game_id)
```

#### `achievements`
```sql
id              uuid  PK
user_id         uuid  FK profiles(id) cascade delete
achievement_key text  NOT NULL
unlocked_at     timestamptz default now()
UNIQUE(user_id, achievement_key)
```

### Planned Tables (TODO)

#### `posts` (Community Feed — not yet created)
```sql
id         uuid  PK
user_id    uuid  FK profiles(id) cascade delete
content    text  NOT NULL
image_url  text  nullable
event_id   uuid  FK events(id) nullable  -- @event link
created_at timestamptz default now()
```
> ⚠️ Claude to create this table + RLS when Community Feed starts

### Storage Buckets (Chris)
| Bucket | Public | Max Size | Status |
|--------|--------|----------|--------|
| `event-images` | ✅ | 5MB | ✅ Active |
| `avatars` | ✅ | 2MB | ✅ Active |

### Realtime Publications (Jane)
| Table | Status |
|-------|--------|
| `event_participants` | ✅ Enabled |
| `comments` | ✅ Enabled |
| `posts` | ⬜ Needed when Feed is built |

---

## 7. Authentication & Roles

| Role | Permissions |
|------|------------|
| `super_admin` | All operations — venue/category/event CRUD, user roles, theme |
| `admin` | Create/Edit/Delete own events |
| `member` | Join events, comment, post, play arcade |

**Auth Trigger:**
```sql
-- Auto-creates profile on signup
handle_new_user() → on_auth_user_created trigger on auth.users
```

**Protected Routes (proxy.ts):** `/create-event`
**Client-side protection:** `/admin` checks `userRole === 'super_admin'`

---

## 8. State Management

### AppContext — `useApp()` hook
```typescript
interface AppState {
  isLoggedIn: boolean
  user: User | null              // Supabase User object
  userRole: 'member'|'admin'|'super_admin'|null
  authModalOpen: boolean
  authModalAction: string
  pendingAction: PendingAction | null  // ⚠️ partially implemented
  leftDrawerOpen: boolean
  rightDrawerOpen: boolean
  theme: 'dark'|'light'          // Auto at 06:00/18:00
  columnLayout: 1|3
}
```

### Page-level State (app/page.tsx)
```typescript
selectedDate: string        // default: today ISO string
selectedLocation: string    // default: "all"
selectedCategory: string    // default: "all"
```

---

## 9. Component Architecture

```
page.tsx
├── Header                              [Max] ⚙️ for super_admin
├── LeftSidebar                         [Max]
│   ├── Tab: Venues → LocationList      [Claude] DB
│   ├── Tab: Activities → ActivityList  [Claude] DB
│   └── Calendar                        [Max] dual-month
├── MainContent                         [Max]
│   ├── Tab: Events → EventList         [Claude] DB
│   │   └── EventCard                   [Max]
│   │       └── useRealtimeParticipants [Jane] ✅
│   └── Tab: Community → CommunityHub  [Jane]
│       ├── Feed                         TODO [Max/Jane]
│       ├── Arcade → ArcadeLobby        [Eric] ✅
│       ├── Ranking                      TODO [Eric]
│       ├── Discussion                   TODO [Max/Jane]
│       └── Achievements                 TODO [Eric]
├── RightSidebar                        [Max]
│   ├── usePresence                     [Jane] ✅
│   └── contacts (mock → DB TODO)
├── MobileDrawer                        [Max]
└── AuthModal                           [Max]

/admin                                  [Claude]
/profile/[id]                           [Max]
├── Profile card (edit name)
├── Joined events (DB ✅)
├── Arcade scores (TODO → Eric)
├── Achievements (TODO → Eric)
├── AvatarUpload (TODO → Chris)
└── Posts (TODO → Feed)
```

---

## 10. Design System

### CSS Variables (app/globals.css)

#### Dark Theme (default, 18:00–06:00)
```css
--bg-base:             #0a0a0f
--bg-layer1:           #111118
--bg-layer2:           #18181f
--bg-card:             rgba(22,22,32,0.85)
--bg-glass:            rgba(255,255,255,0.04)
--border:              rgba(255,255,255,0.08)
--border-hover:        rgba(139,92,246,0.4)
--border-glow:         rgba(139,92,246,0.6)
--fg-primary:          #f0f0f8
--fg-secondary:        #a0a0c0
--fg-muted:            #606080
--accent:              #8b5cf6
--accent-bright:       #a78bfa
--accent-glow:         rgba(139,92,246,0.35)
--accent2:             #ec4899
--accent2-glow:        rgba(236,72,153,0.3)
--green:               #34d399
--green-glow:          rgba(52,211,153,0.25)
--yellow:              #fbbf24
--red:                 #f87171
--shadow-card:         0 4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)
--shadow-glow:         0 0 32px rgba(139,92,246,0.2)
--sidebar-width:       260px
--right-sidebar-width: 280px
--header-height:       60px
--gap:                 12px
--radius:              14px
--radius-sm:           8px
--radius-lg:           20px
```

#### Light Theme (06:00–18:00)
```css
--bg-base:    #f4f4ff
--bg-card:    rgba(255,255,255,0.9)
--accent:     #7c3aed
--accent2:    #db2777
/* etc — see globals.css [data-theme="light"] */
```

### Reusable CSS Classes
```css
.float-card     /* glassmorphism card, hover float effect */
.btn-primary    /* accent gradient button with glow */
.btn-secondary  /* ghost button */
.label-xs       /* 10px uppercase muted label */
```

### Venue Color System
```
Kyoto Station: #a78bfa  rgba(167,139,250,0.12)
Osaka Umeda:   #f472b6  rgba(244,114,182,0.12)
Akihabara:     #34d399  rgba(52,211,153,0.12)
Shibuya:       #fbbf24  rgba(251,191,36,0.12)
Namba:         #f87171  rgba(248,113,113,0.12)
```

---

## 11. Current Status

### ✅ Completed

| Feature | Owner | Notes |
|---------|-------|-------|
| Prototype UI | Max | Floating cards, dark/light, responsive |
| Supabase Auth | Claude | Email signup/login/logout |
| Role system | Claude | super_admin / admin / member |
| Admin Panel | Claude | Venue/Category/Event CRUD, User roles, Theme editor |
| DB integration | Claude | Events, locations, categories from Supabase |
| Join/Leave events | Claude+Jane | Real DB writes + Realtime count |
| Image upload | Chris | Event images via Supabase Storage |
| Arcade games | Eric | Stroop + Nana complete |
| Realtime hooks | Jane | Participants, Comments, Presence |
| CommunityHub skeleton | Jane | 5 tabs, Arcade integrated |
| Identity Hub | Max | /profile/[id] with placeholders |
| Bilingual UI | All | English + Japanese throughout |
| Dark/Light theme | Max | Auto + manual override |
| Vercel deployment | Max | Auto on push to main |

### ⚠️ Partially Complete

| Feature | Issue | Owner |
|---------|-------|-------|
| Comment Section UI | Hook exists, no UI component | Jane/Max |
| Identity Hub Arcade scores | Placeholder only | Eric |
| Identity Hub Achievements | Placeholder only | Eric |
| AvatarUpload on Profile | Built not integrated | Chris |
| Community Feed | Schema + UI needed | Claude+Max |
| Ranking tab | Placeholder | Eric |
| Discussion tab | Placeholder | Jane |
| RightSidebar contacts | Still mock data | Claude |
| MainContent mock import | data/locations.ts still imported | Max |

---

## 12. Roadmap & Task Assignment

### Sprint 1 — Integration & Polish (Current)

| Task | Assigned To | Priority | Depends On | Status |
|------|------------|----------|------------|--------|
| CommentSection.tsx UI | Jane | 🔴 High | — | ⬜ |
| Wire CommentSection into EventCard | Max | 🔴 High | Jane's CommentSection | ⬜ |
| AvatarUpload → /profile/[id] | Chris | 🔴 High | — | ⬜ |
| Arcade scores → /profile/[id] | Eric | 🔴 High | — | ⬜ |
| Achievements → /profile/[id] | Eric | 🔴 High | — | ⬜ |
| Fix MainContent mock import | Max | 🟡 Medium | — | ⬜ |
| Real contacts in RightSidebar | Claude | 🟡 Medium | — | ⬜ |
| Ranking tab in CommunityHub | Eric | 🟡 Medium | arcade_rankings | ⬜ |

### Sprint 2 — Community Feed

| Task | Assigned To | Priority | Depends On | Status |
|------|------------|----------|------------|--------|
| `posts` table + RLS | Claude | 🔴 High | — | ⬜ |
| Enable `posts` Realtime | Jane | 🔴 High | Claude's posts table | ⬜ |
| useRealtimePosts hook | Jane | 🔴 High | posts table | ⬜ |
| PostComposer.tsx | Max | 🟡 Medium | Jane's hook | ⬜ |
| PostCard.tsx | Max | 🟡 Medium | — | ⬜ |
| Feed.tsx | Max | 🟡 Medium | PostCard + Composer | ⬜ |
| Wire Feed into CommunityHub | Jane | 🟡 Medium | Feed.tsx | ⬜ |
| @event link in posts | Max | 🟢 Low | Feed.tsx | ⬜ |
| Image upload in posts | Chris | 🟢 Low | Feed.tsx | ⬜ |

### Sprint 3 — Discussion & Achievements

| Task | Assigned To | Priority | Depends On | Status |
|------|------------|----------|------------|--------|
| Discussion tab UI | Jane | 🟡 Medium | useRealtimeComments | ⬜ |
| Achievements display | Eric | 🟡 Medium | achievements table | ⬜ |
| Achievement unlock logic | Eric | 🟡 Medium | — | ⬜ |
| Theme persistence | Claude | 🟢 Low | — | ⬜ |
| Default venue preference | Claude | 🟢 Low | profiles table | ⬜ |
| Search functionality | Max | 🟢 Low | — | ⬜ |
| Notification system | Max | 🟢 Low | — | ⬜ |

### Sprint 4 — PWA & Future

| Task | Assigned To | Priority | Status |
|------|------------|----------|--------|
| PWA config + manifest | Max | 🟢 Low | ⬜ |
| Header logo → tenjinshosai_logo.png | Max | 🟢 Low | ⬜ |
| Google OAuth | Claude | 🟢 Low | ⬜ |
| Event capacity limit | Claude | 🟢 Low | ⬜ |
| Nana online multiplayer | Eric+Jane | 🟢 Low | ⬜ |

---

## 13. Known Issues

### 🔴 High Priority
| Issue | File | Owner | Fix |
|-------|------|-------|-----|
| Comment UI missing | NEW CommentSection.tsx | Jane | Build component using useRealtimeComments |
| AvatarUpload not integrated | app/profile/[id]/page.tsx | Chris | Import AvatarUpload, add upload section |
| Arcade scores placeholder | app/profile/[id]/page.tsx | Eric | Query arcade_rankings table |

### 🟡 Medium Priority
| Issue | File | Owner | Fix |
|-------|------|-------|-----|
| Legacy mock import | components/MainContent.tsx | Max | Remove `import { locations } from "@/data/locations"` |
| Mock contacts | components/RightSidebar.tsx | Claude | Query profiles from DB |
| Theme resets on refresh | Admin Panel | Claude | Save to localStorage or DB |
| pendingAction partial | context/AppContext.tsx | Max | Only JOIN_EVENT works, COMMENT/VIEW_PARTICIPANTS pending |

### 🟢 Low Priority
| Issue | Notes |
|-------|-------|
| Header still shows "天" | Replace with tenjinshosai_logo.png when ready |
| Search is static | Input exists but does nothing |
| Notification bell is static | No notification system yet |

---

## 14. Development Guidelines

### Code Style
- TypeScript strict mode
- Inline styles for component-specific styles
- Tailwind ONLY for responsive breakpoints (`lg:hidden`, `hidden lg:block`, `hidden sm:flex`)
- All colors via CSS variables — never hardcode hex in components
- No Zustand/Redux — React Context + useState only
- No `<form>` tags — use button onClick handlers

### Bilingual Rule (MANDATORY for ALL agents)
```typescript
// ✅ Correct — always both languages
<p>Join Event / 参加する</p>
<p style={{ fontSize: 13 }}>{en}</p>
<p style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ja}</p>

// ❌ Wrong
<p>Join Event</p>
```

### Supabase Client Usage
```typescript
// Client-side components (always use this)
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// Server-side only (Route Handlers, Server Components)
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
```

### Realtime Hooks Usage (Jane's hooks)
```typescript
// In EventCard
const { count, isJoined, join, leave } = useRealtimeParticipants(
  event.id,
  user?.id ?? null
)

// In CommentSection (to be built)
const { comments, postComment, deleteComment } = useRealtimeComments(
  eventId,
  user?.id ?? null
)

// In RightSidebar
const { isOnline } = usePresence(user?.id ?? null)
```

### Storage Usage (Chris's helpers)
```typescript
import { uploadImage, deleteImage, extractStoragePath } from "@/lib/supabase/storage"

// Upload
const { publicUrl, path } = await uploadImage("event-images", userId, file)

// Delete old before uploading new
const oldPath = extractStoragePath(oldUrl)
await deleteImage("event-images", oldPath)
```

### New DB Tables Checklist (coordinate with Claude)
- [ ] Create table in Supabase SQL Editor
- [ ] Enable RLS: `alter table [name] enable row level security`
- [ ] Add SELECT policy (usually public read)
- [ ] Add INSERT/UPDATE/DELETE policies (auth required)
- [ ] Document in Section 6 of this doc
- [ ] If Realtime needed, coordinate with Jane for publication

### CSS Component Pattern
```typescript
// Standard float card component
<div className="float-card" style={{ padding: 20 }}>
  {/* content */}
</div>

// Standard section title
<p className="label-xs" style={{ marginBottom: 12 }}>
  Section Title / セクションタイトル
</p>
```

---

## 15. Sync Log

### 2026-06-14 [CLAUDE] Phase 3 Complete + Integration
**Completed:**
- Phase 3a: Locations + Events from Supabase DB
- Phase 3b: Join/Leave events with DB writes + conflict handling
- Phase 3c: Create/Edit/Delete events in Admin Panel
- Identity Hub `/profile/[id]`
- ImageUpload integrated in Admin Panel Create Event form
- Integrated Jane's hooks into EventCard + RightSidebar + MainContent
- Generated MESP_DEV_DOCS_v2.md

**Modified Shared Files:**
- `components/EventCard.tsx` — replaced mock data + useState with useRealtimeParticipants
- `components/RightSidebar.tsx` — integrated usePresence
- `components/MainContent.tsx` — replaced Community placeholder with CommunityHub

**New DB Changes:**
- Added `color` and `color_bg` columns to `locations` table
- Seeded 5 locations and 6 events into Supabase

**Blocked By:**
- Nothing currently

**Next Session Plan:**
- Max leads Sprint 1 integration
- Claude available for DB changes, new tables, RLS policies

---

### [TEMPLATE — Copy for each sync]
```
### [DATE] [AGENT_TAG] Session Summary
**Completed:**
-

**Modified Shared Files:**
-

**New DB Changes:**
-

**Blocked By:**
-

**Next Session Plan:**
-
```

---

*MESP_DEV_DOCS v3.0 — 天神書齋 Tenjin Shosai*
*Lead: Max | Contributors: Claude, Chris, Eric, Jane*
*Generated: 2026-06-14*
