# 天神書齋 Tenjin Shosai — MESP
## Modular Event Social Platform
### Complete Development Documentation v2.0
**Last Updated:** 2026-06-14
**Status:** Active Development — Phase 3/4/5 Complete, Integration Phase

---

## Quick Reference for New AI Agents

### Live URL
`https://alexweb-kohl.vercel.app`

### GitHub
`https://github.com/alekixdever/alexweb`

### Local Dev
```bash
cd ~/documents/alexweb && npm run dev  # localhost:3000
```

### Super Admin
- Email: `ulyssesnyx@gmail.com`
- Access: ⚙️ button in Header after login
- Panel: `/admin`

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication & Roles](#6-authentication--roles)
7. [State Management](#7-state-management)
8. [Component Architecture](#8-component-architecture)
9. [Design System](#9-design-system)
10. [AI Agent Contributions](#10-ai-agent-contributions)
11. [Current Status](#11-current-status)
12. [Remaining Work](#12-remaining-work)
13. [Known Issues](#13-known-issues)
14. [Development Guidelines](#14-development-guidelines)

---

## 1. Project Overview

**天神書齋 Tenjin Shosai** is a bilingual (English + Japanese) modular event social platform for a café and rental space business in Japan.

### Core Features (Completed)
- Browse events by venue, date, activity category
- Join / Leave events (real DB writes)
- Super Admin Panel (venue CRUD, category CRUD, event CRUD, user roles, theme editor)
- Identity Hub (`/profile/[id]`) — profile, joined events, arcade placeholder, achievements placeholder
- Community Hub — Feed | Arcade | Ranking | Discussion | Achievements tabs
- Arcade — Stroop game + Nana card game (Eric)
- Realtime — participant count, comments, presence (Jane)
- Image upload for events (Chris)

### Design Philosophy
- Floating card UI — every module floats above background
- Dark/Light auto theme — Dark 18:00–06:00, Light 06:00–18:00 (user override)
- Mobile-first — single column mobile, three-column desktop
- Bilingual — ALL UI and content in English + Japanese

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui (Radix, Nova preset) | latest |
| Auth | Supabase Auth | latest |
| Database | Supabase PostgreSQL | latest |
| Storage | Supabase Storage | ✅ Active |
| Realtime | Supabase Realtime | ✅ Active |
| Icons | Lucide React | latest |
| Hosting | Vercel | Auto-deploy on push to main |
| Node | v25.9.0 | — |

---

## 3. Environment Variables

### `.env.local` (never commit)
```
NEXT_PUBLIC_SUPABASE_URL=https://mydobpksljqoimzyylox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Vercel
Same keys — set manually in Vercel Dashboard → Settings → Environment Variables.

---

## 4. Project Structure

```
alexweb/
├── app/
│   ├── globals.css              # Design system, CSS variables, themes
│   ├── layout.tsx               # Root: AuthProvider + AppProvider
│   ├── page.tsx                 # Main page
│   ├── login/page.tsx           # Login
│   ├── signup/page.tsx          # Signup
│   ├── admin/page.tsx           # Super Admin Panel
│   └── profile/[id]/page.tsx   # Identity Hub
├── components/
│   ├── Header.tsx
│   ├── LeftSidebar.tsx          # Venues/Activities tabs + Calendar
│   ├── LocationList.tsx         # Reads from Supabase locations table
│   ├── ActivityList.tsx         # Reads from Supabase activity_categories table
│   ├── Calendar.tsx             # Dual-month
│   ├── MainContent.tsx          # Events/Community tabs
│   ├── EventList.tsx            # Reads from Supabase events table
│   ├── EventCard.tsx            # Uses useRealtimeParticipants hook
│   ├── EmptyState.tsx
│   ├── RightSidebar.tsx         # Uses usePresence hook
│   ├── AuthModal.tsx            # Redirects to /login
│   ├── MobileDrawer.tsx         # lg:hidden
│   ├── InfoModal.tsx            # Logo click → 5 sub-pages
│   ├── CommunityHub.tsx         # Feed|Arcade|Ranking|Discussion|Achievements
│   ├── ImageUpload.tsx          # Supabase Storage upload (Chris)
│   └── arcade/
│       ├── ArcadeLobby.tsx
│       ├── ArcadeGameCard.tsx
│       ├── stroop/              # Full Stroop game (Eric)
│       └── nana/               # Full Nana card game (Eric)
├── context/
│   ├── AppContext.tsx           # Global state + Supabase auth
│   └── AuthContext.tsx          # (legacy, merged into AppContext)
├── data/                        # ⚠️ LEGACY MOCK — being phased out
│   ├── events.ts                # Still used by MainContent count (fix needed)
│   ├── locations.ts             # Still used by MainContent (fix needed)
│   └── users.ts                 # Still used by RightSidebar contacts
├── hooks/                       # Jane's Realtime hooks
│   ├── useRealtimeParticipants.ts
│   ├── useRealtimeComments.ts
│   └── usePresence.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client
│   │   ├── storage.ts           # uploadImage, deleteImage, extractStoragePath (Chris)
│   │   ├── events.ts            # getEvents query helper
│   │   └── locations.ts        # getLocations query helper
│   └── arcade/
│       ├── arcade-db.ts         # Arcade Supabase calls (Eric)
│       ├── stroop-engine.ts     # Stroop game logic (Eric)
│       ├── nana-engine.ts       # Nana game logic (Eric)
│       └── useRealtimeNana.ts  # Nana realtime (Eric)
├── types/
│   └── arcade.ts               # Arcade TypeScript interfaces (Eric)
├── public/
│   ├── tenjinshosai.png        # Main logo (water ink)
│   ├── tenjinshosai_logo.png   # App icon (future iOS/PWA)
│   ├── about-us.jpg
│   ├── company.jpg
│   └── company2.jpg
└── proxy.ts                    # Route protection (Next.js 16 middleware)
```

---

## 5. Database Schema

### Supabase Project: `tenjin-shosai` | Region: Tokyo

### Tables

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
region      text  NOT NULL  -- e.g. "Kyoto 京都"
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
category_id     uuid  FK activity_categories(id)  nullable
image_url       text  nullable  -- Supabase Storage URL
tags            text[]  default '{}'
tags_ja         text[]  default '{}'
created_at      timestamptz default now()
```

#### `event_participants`
```sql
id         uuid  PK
event_id   uuid  FK events(id) cascade delete
user_id    uuid  FK profiles(id) cascade delete
joined_at  timestamptz default now()
UNIQUE(event_id, user_id)
```
**Realtime:** Publication enabled ✅

#### `comments`
```sql
id         uuid  PK
event_id   uuid  FK events(id) cascade delete
user_id    uuid  FK profiles(id) cascade delete
content    text  NOT NULL
created_at timestamptz default now()
```
**Realtime:** Publication enabled ✅

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

### Storage Buckets
| Bucket | Public | Max Size |
|--------|--------|----------|
| `event-images` | ✅ | 5MB |
| `avatars` | ✅ | 2MB |

---

## 6. Authentication & Roles

| Role | Permissions |
|------|------------|
| `super_admin` | All — venue CRUD, category CRUD, event CRUD, user role management, theme editor |
| `admin` | Create/Edit/Delete own events |
| `member` | Join events, comment, post, play arcade |

**Auth Flow:**
```
Signup → handle_new_user trigger → creates profiles record
Login → AppContext fetches session + profiles.role
useApp() → { isLoggedIn, user, userRole } globally available
```

**Protected Routes (proxy.ts):** `/create-event`
**Client-side protection:** `/admin` (checks userRole === 'super_admin')

---

## 7. State Management

### AppContext (`context/AppContext.tsx`)
Access via `useApp()` hook.

```typescript
interface AppState {
  isLoggedIn: boolean
  user: User | null              // Supabase User object
  userRole: 'member'|'admin'|'super_admin'|null
  authModalOpen: boolean
  authModalAction: string
  pendingAction: PendingAction | null
  leftDrawerOpen: boolean
  rightDrawerOpen: boolean
  theme: 'dark'|'light'          // Auto at 06:00/18:00
  columnLayout: 1|3              // Desktop only
}
```

### Page-level State (app/page.tsx)
```typescript
selectedDate: string        // default: today ISO string
selectedLocation: string    // default: "all"
selectedCategory: string    // default: "all"
```

---

## 8. Component Architecture

```
page.tsx
├── Header                         sticky, zIndex 10, ⚙️ for super_admin
├── [Body Row]
│   ├── LeftSidebar               desktop (lg:block)
│   │   ├── Tab: Venues           → LocationList (DB)
│   │   ├── Tab: Activities       → ActivityList (DB)
│   │   └── Calendar              dual-month, always visible
│   ├── MainContent
│   │   ├── Tab: Events           → EventList → EventCard[]
│   │   │                            EventCard uses useRealtimeParticipants
│   │   └── Tab: Community        → CommunityHub
│   │                                ├── Feed (placeholder)
│   │                                ├── Arcade → ArcadeLobby (Eric ✅)
│   │                                ├── Ranking (placeholder)
│   │                                ├── Discussion (placeholder)
│   │                                └── Achievements (placeholder)
│   └── RightSidebar              desktop (lg:block)
│       ├── Guest: Login CTA
│       └── LoggedIn: Profile + Contacts (usePresence)
├── MobileDrawer left/right        lg:hidden
└── AuthModal                      → redirects to /login
```

---

## 9. Design System

### Key CSS Variables
```css
/* Dark Theme (default, 18:00-06:00) */
--bg-base:        #0a0a0f
--bg-card:        rgba(22,22,32,0.85)
--border:         rgba(255,255,255,0.08)
--border-hover:   rgba(139,92,246,0.4)
--fg-primary:     #f0f0f8
--fg-muted:       #606080
--accent:         #8b5cf6    ← primary purple
--accent2:        #ec4899    ← secondary pink
--green:          #34d399
--radius:         14px
--radius-sm:      8px
--gap:            12px
--sidebar-width:  260px
--right-sidebar-width: 280px
--header-height:  60px
```

### Reusable CSS Classes
```
.float-card    → glassmorphism card, hover float
.btn-primary   → accent gradient button
.btn-secondary → ghost button
.label-xs      → 10px uppercase muted label
```

### Venue Colors
```
Kyoto Station: #a78bfa / rgba(167,139,250,0.12)
Osaka Umeda:   #f472b6 / rgba(244,114,182,0.12)
Akihabara:     #34d399 / rgba(52,211,153,0.12)
Shibuya:       #fbbf24 / rgba(251,191,36,0.12)
Namba:         #f87171 / rgba(248,113,113,0.12)
```

---

## 10. AI Agent Contributions

| Agent | Phase | Files Owned | Status |
|-------|-------|-------------|--------|
| Claude | Phase 3 DB | EventList, EventCard, LocationList, ActivityList, Admin Panel, Identity Hub | ✅ |
| Chris | Phase 4 Storage | lib/supabase/storage.ts, ImageUpload.tsx, AvatarUpload.tsx | ✅ |
| Eric | Arcade | components/arcade/**, lib/arcade/**, types/arcade.ts | ✅ |
| Jane | Phase 5 Realtime | hooks/useRealtimeParticipants.ts, useRealtimeComments.ts, usePresence.ts, CommunityHub.tsx | ✅ |

---

## 11. Current Status

### ✅ Completed
| Feature | Notes |
|---------|-------|
| Full DB integration | events, locations, categories from Supabase |
| Auth (login/signup/logout) | Email + Password |
| Role system | super_admin / admin / member |
| Admin Panel | Venue CRUD, Category CRUD, Event CRUD, User roles, Theme editor |
| Event CRUD | Create with image upload, Edit, Delete |
| Join / Leave events | Real DB writes, Realtime count update |
| Identity Hub | /profile/[id] — profile, joined events, arcade/achievements placeholders |
| Arcade | Stroop + Nana games (Eric) |
| Realtime | Participants, Comments, Presence (Jane) |
| Storage | Event images, Avatar upload (Chris) |
| CommunityHub | Tab skeleton + Arcade integrated |
| Bilingual UI | English + Japanese throughout |
| Dark/Light theme | Auto + manual override |
| Vercel deployment | Auto on push to main |

### ⚠️ Partially Complete
| Feature | Issue |
|---------|-------|
| data/locations.ts | Still imported in MainContent.tsx — needs removal |
| data/users.ts | Still used in RightSidebar contacts — needs real DB contacts |
| Comment section UI | Hook exists (useRealtimeComments) but no UI component |
| Feed tab | CommunityHub placeholder |
| Ranking tab | CommunityHub placeholder |
| Discussion tab | CommunityHub placeholder |
| Achievements tab | CommunityHub placeholder |
| Identity Hub Arcade scores | Placeholder — needs arcade_rankings read |
| Identity Hub Achievements | Placeholder — needs achievements table read |
| AvatarUpload | Chris built it but not integrated into Profile page |

---

## 12. Remaining Work

### Priority 1 — Integration (Max leads)

#### A. Remove legacy mock data imports
**Files:** `components/MainContent.tsx`
- Remove `import { locations } from "@/data/locations"`
- Fix location name display to use DB data

#### B. Comment Section UI
**New file:** `components/CommentSection.tsx`
- Use `useRealtimeComments(eventId, user?.id ?? null)` from Jane's hook
- Show comments list + post input
- Wire into EventCard (below description, above join button)

#### C. Identity Hub — Arcade Scores
**File:** `app/profile/[id]/page.tsx`
- Read from `arcade_rankings` table
- Replace "Coming soon" placeholder
- Show: Stroop best score + Nana wins

#### D. Identity Hub — Achievements
**File:** `app/profile/[id]/page.tsx`
- Read from `achievements` table
- Replace "Coming soon" placeholder

#### E. AvatarUpload integration
**File:** `app/profile/[id]/page.tsx`
- Import `AvatarUpload` from Chris
- Allow own profile avatar change

#### F. Community Feed
**New file:** `components/community/Feed.tsx`
- DB schema needed: `posts` table
- Post creation (text + image + @eventId link)
- Post feed display

#### G. Real Contacts in RightSidebar
- Currently uses mock `data/users.ts`
- Replace with real profiles from DB
- Integrate with usePresence for online status

### Priority 2 — Polish
- Search functionality (currently static input)
- Notification system (currently static bell)
- PWA config + manifest for iOS install
- Header logo → replace "天" with tenjinshosai_logo.png
- Theme persistence (save to DB or localStorage)
- Default venue preference per user (save to profiles)

### Priority 3 — Future
- Google OAuth login
- Event capacity limit
- Event categories filtering in EventCard display
- Multi-language support beyond EN/JA

---

## 13. Known Issues

### 1. Legacy mock data in MainContent
`components/MainContent.tsx` still imports `data/locations.ts` for location name display.
**Fix:** Query location name from DB or pass as prop from EventList.

### 2. RightSidebar contacts are mock data
`data/users.ts` contactList is hardcoded mock users.
**Fix:** Query real profiles from DB, filtered by some relationship (following, recent interaction).

### 3. Comment UI missing
`useRealtimeComments` hook exists and works but no UI component uses it yet.
**Fix:** Build `CommentSection.tsx`.

### 4. Profile page avatar upload not wired
Chris built `AvatarUpload.tsx` but it's not yet in `app/profile/[id]/page.tsx`.

### 5. Theme colors reset on refresh
Admin Panel theme editor changes CSS variables in-memory only.
**Fix:** Save to Supabase `settings` table or localStorage, apply on app mount.

---

## 14. Development Guidelines

### Code Style
- TypeScript strict mode
- Inline styles for component-specific styles
- Tailwind classes ONLY for responsive breakpoints (`lg:hidden`, `hidden lg:block`)
- All colors via CSS variables — never hardcode hex in components
- No Zustand/Redux — React Context + useState only

### Bilingual Rule (MANDATORY)
Every user-facing string must have English + Japanese:
```typescript
// ✅ Correct
<p>Join Event / 参加する</p>

// ❌ Wrong
<p>Join Event</p>
```

### Supabase Client Usage
```typescript
// Client-side components
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// Server-side (Route Handlers, Server Components)
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
```

### Realtime Hooks Usage
```typescript
// Participants (in EventCard)
const { count, isJoined, join, leave } = useRealtimeParticipants(event.id, user?.id ?? null)

// Comments (in CommentSection)
const { comments, postComment, deleteComment } = useRealtimeComments(eventId, user?.id ?? null)

// Presence (in RightSidebar)
const { isOnline } = usePresence(user?.id ?? null)
```

### Storage Usage
```typescript
import { uploadImage, deleteImage, extractStoragePath } from "@/lib/supabase/storage"

// Upload
const { publicUrl } = await uploadImage("event-images", userId, file)

// Delete
const path = extractStoragePath(oldUrl)
await deleteImage("event-images", path)
```

### Adding New DB Tables
1. Create in Supabase SQL Editor
2. Enable RLS
3. Add policies
4. Add TypeScript interface
5. Use `createClient()` from `lib/supabase/client.ts`

---

## Quick Task Reference for Max

| Task | File to Edit | Hook/Helper |
|------|-------------|-------------|
| Comment UI | NEW CommentSection.tsx | useRealtimeComments |
| Avatar upload on profile | app/profile/[id]/page.tsx | AvatarUpload.tsx (Chris) |
| Arcade scores on profile | app/profile/[id]/page.tsx | arcade_rankings table |
| Achievements on profile | app/profile/[id]/page.tsx | achievements table |
| Community Feed | NEW components/community/Feed.tsx | NEW posts table |
| Fix MainContent mock import | components/MainContent.tsx | — |
| Real contacts sidebar | components/RightSidebar.tsx | profiles table |
| Theme persistence | context/AppContext.tsx | localStorage or DB |

---

*MESP_DEV_DOCS v2.0 — 天神書齋 Tenjin Shosai*
*Generated: 2026-06-14*
*Previous version: MESP_DEV_DOCS v1.0*
