# Product Requirements Document
## Readay — Reading Habit Coach

**Version:** 0.2 (MVP)
**Author:** Devan
**Last updated:** July 2026

---

## 1. Overview

### 1.1 Problem
Most reading apps focus on cataloging (Goodreads) or content delivery (Kindle), not on *helping people actually finish books they enjoy*. Readers don't lack books — they lack a system that tells them what to read, when to read, and whether their habit is improving.

### 1.2 Product Vision
**Readay** is a premium mobile reading app that helps users discover books they'll genuinely enjoy while naturally building a consistent reading habit. It should feel like a modern lifestyle product for passionate readers — closer to a beautifully designed bookstore café or a curated editorial magazine than a productivity or wellness app. Habit coaching exists, but it lives quietly in the background of book discovery and cozy reading, never as the headline feature.

Underneath the experience is the same closed feedback loop as before — it just isn't surfaced as "tracking":

```
Reading Preferences → Personalized Queue → Reading Schedule
→ Reading Sessions → Habit Analysis → Smarter Recommendations ↺
```

Recommendations and tracking are not separate features — each session improves the next recommendation.

### 1.3 Goal
Help readers finish more books they actually enjoy.

**Not the goal (for MVP):**
- Largest book catalog
- Biggest social network
- A full analytics dashboard as the app's identity (light, editorially-styled stats within Profile are fine — see §7.3 — but the app should not read as a stats tool)

**One-line success test:** *"Open the app and it tells me what to read, when to read, and whether my reading habit is improving."*

---

## 2. Target User

- Casual-to-moderate readers who start books but struggle to finish them
- People who want structure without feeling like they're using a productivity tool
- Primary market context: Indonesian readers. UI ships in English first (see §10); build copy with i18n in mind so a Bahasa Indonesia pass is a translation effort, not a rewrite

---

## 3. MVP Scope — 5 Core Modules

### 3.1 Preference Profiling
**Purpose:** Understand the reader before recommending books.

- Onboarding questionnaire (as shipped): display name, favorite genres (multi-select), reading goal (books/year)
- Genre weights are stored as `genre_weights` (all selected genres start at 0.8). **Auto-shift is a fast-follow, not yet implemented** — weights are currently static after onboarding (see AGENTS Phase 7.4)
- The `profiles` table also carries `preferred_session_minutes` and `format_preference` in the reference schema, but MVP onboarding does not collect them yet

**Data model sketch (as implemented):**
```
profiles
- user_id
- display_name
- genre_weights (jsonb, e.g. {"mystery": 0.8, "fantasy": 0.8})
- yearly_goal
- (reserved: preferred_session_minutes, format_preference — not collected in MVP)
```

### 3.2 Personalized Reading Queue
- The queue is a "Want to Read" list grouped by status: `want_to_read | reading | finished` (no `queued`/`abandoned` status in MVP)
- Queue items carry an optional `reason_text` string; Discover search *and* curated genre browsing (not search-first exclusively) feed books into the queue via Add to Library
- Queue re-ranking based on genre weights is a **fast-follow, not yet implemented** (see AGENTS Phase 7.5). Ranks are append-order today

### 3.3 Reading Schedule
- Users create reading blocks on the dedicated Schedule screen (not during onboarding): day, start time, duration, label, and an optional linked book from their queue
- Home surfaces the next upcoming block as a session card and passes its duration as `target_minutes` to the reading session
- Auto-adjustment based on actual completion is a fast-follow, not MVP

### 3.4 Reading Session Tracker
- Deliberately minimal: a **stopwatch** (counts up, no countdown) with optional `target_minutes` shown as a progress reference and stored on the row for target-performance analytics
- Flow: Start → End Session → summary modal (actual vs. target) → page-input modal → session row written with `duration_seconds`, `pages_read`, and `target_minutes`
- No in-session stats, no highlights, no notes in MVP

### 3.5 Weekly Reading Coach
- Turns raw session logs into a short narrative insight + one actionable recommendation, e.g.:
  > "You read 95 pages across 4 sessions. Mystery books kept your average session 12 minutes longer than nonfiction. Try alternating genres to maintain consistency."
- This is a rules-based or lightweight-LLM-generated summary, not a full analytics dashboard
- **As implemented:** rule-based template function (`lib/weekly-coach.ts`) that computes on-the-fly each Profile load — **not yet persisted** to the `weekly_insights` table (see AGENTS Phase 7.6)

---

## 4. Explicitly Out of Scope (Post-MVP)

Social feed, friends, book clubs, reading challenges, AI chatbot, large recommendation engine, notes/highlights, audiobook integration.

Rationale: each adds complexity without strengthening the core loop above. Revisit only after the core loop is validated with real usage data.

**Note:** an earlier draft of this PRD also excluded reviews/ratings, streak visuals, and advanced statistics on principle. That restriction has been relaxed (see §7) — subtle progress/consistency visuals and light stat display are now acceptable as long as they stay within the editorial visual language, not a dashboard one.

---

## 5. User Flow

```
Sign Up → Genre Profiling (onboarding) → Add books to Queue (Discover)
→ Set Reading Schedule (Schedule screen) → Read (stopwatch session)
→ Log Session (summary + pages) → Profile Updates
→ Recommendations Update (loops back to Queue / Discover)
```

---

## 6. Information Architecture

```
Home        → Continue Reading / Next Session / Want to Read / Recently Finished / Weekly Progress
Discover    → Curated collections, genre browse, search
Library     → Queue grouped by status (Want to Read / Reading / Finished)
Profile     → Reading Goal / Weekly Coach / Annual Journey (stat tiles)
             / Consistency Vine / Favorite Genres / Recent Finishes / Target Performance
Schedule    → Dedicated screen (not a tab): Today's Blocks / All Blocks
```

**Status note:** the shipped UI implements four bottom-nav tabs — **Home, Discover, Library, Profile** — driven by a custom bottom bar in `(tabs)/_layout.tsx`. The former **Journey** screen was merged into **Profile**; its sections (Weekly Coach, Consistency Vine, Recent Finishes, Target Performance) plus Reading Goal, Annual Journey stat tiles, and Favorite Genres now live there. The **Evolving Tastes** section, the **Personal Library** shortcut card, and the **Reading Preferences** list were dropped from Profile in a later cleanup (their underlying data/queries were removed too where unused). **Schedule is implemented** (see §3.3) as its own dedicated screen rather than a tab, reachable from Home; its blocks pass `target_minutes` to the reading session. **Book Detail** and **Reading Session** are pushed as stack screens, and **Auth / Sign-in / Onboarding** sit outside the tabs.

---

## 7. Design Direction

### 7.1 Positioning
Readay should read as a **premium lifestyle product for passionate readers** — prioritizing beautiful book discovery, cozy reading, and personalized recommendations first, with habit coaching woven subtly into the interface rather than presented as its own feature.

**Inspiration:**
- Editorial magazine layouts
- Premium bookstore cafés
- Cozy reading corners
- Modern lifestyle apps
- Beautiful physical books displayed on a coffee table

**Explicitly avoid the visual language of:**
- Health dashboards
- Productivity apps
- Data-heavy analytics
- Busy ebook marketplaces
- Social-media feeds

(Light consistency/streak and stat elements are allowed — see §7.3 — as long as they're styled editorially rather than like a gamified tracker or dashboard.)

### 7.2 Visual System
- **Palette:** soft cream / warm off-white backgrounds, muted greens, charcoal text, subtle warm gray surfaces, gentle accent colors drawn from book cover palettes (not a fixed brand-blue system — accents can shift per screen/context to feel curated)
- **Typography:** elegant, editorial typeface pairing (a refined serif or high-contrast display face for titles, clean sans for body/UI) with generous whitespace and confident type scale
- **Shape language:** rounded cards, 16–24px corner radius, soft/diffused shadows rather than hard drop shadows
- **Spacing:** generous, unhurried — content should breathe, never feel dense
- **Overall tone:** calm, sophisticated, inviting, slightly luxurious — never corporate, clinical, or "app-like" in the generic sense

### 7.3 Interaction Principles
- Book covers are the primary visual anchor on every screen, not icons or charts
- One primary action per screen
- Habit coaching primarily surfaces as warm, editorial-style copy (e.g. a short narrative line), but light consistency/progress visuals (e.g. a soft dot-based streak indicator, a goal progress bar, a small stat tile) are acceptable **as a secondary layer**, provided they're styled in the same warm/editorial visual language as the rest of the app — muted colors, soft shapes, generous spacing — rather than a sharp, data-dashboard treatment
- Avoid: bright gamification badges, streak "flames"/fire icons, hard-edged metric cards, or anything that reads as a productivity-app dashboard at a glance
- Reference mood: a curated bookstore café app that happens to quietly know your stats — not Spotify's data-forward UI, not Headspace's wellness-app chrome, and not a gamified habit tracker either

---

## 8. Tech Stack

### 8.1 Fixed (your choice)
| Layer | Choice | Notes |
|---|---|---|
| Mobile framework | **Expo (React Native)** | Use Expo Router for file-based navigation; EAS Build for store builds |
| Backend | **Supabase** | Postgres + Auth + Storage + Realtime + Edge Functions |

> **Note on Supabase setup:** Devan is configuring and provisioning Supabase (project, database, auth, RLS policies, Edge Functions, etc.) independently. Any agent/assistant working from this PRD should **not** set up, provision, or scaffold Supabase infrastructure directly — the schema and RLS notes below (§8.3) are a **reference design only**, to align on data shape, not an instruction to execute.

### 8.2 Recommended additions (easy to use, powerful enough for MVP)

| Need | Recommendation | Why |
|---|---|---|
| Language | **TypeScript** | You're already migrating JS→TS elsewhere; keep it consistent, catches schema mismatches with Supabase types early |
| State management | **Zustand** | Minimal boilerplate vs Redux, works cleanly with Expo; use React Query alongside it |
| Server state / caching | **TanStack Query (React Query)** | Handles Supabase fetch caching, retries, and optimistic updates for session logging — important for offline-ish reading sessions |
| Styling | **NativeWind** (Tailwind for RN) | You already use Tailwind on web projects — same mental model, fast to theme "calm/minimal" design |
| Forms | **React Hook Form** | Lightweight, good for onboarding questionnaire |
| Navigation | **Expo Router** | File-based, built for Expo, avoids extra React Navigation config |
| Auth | **Supabase Auth** (email + password) | Email confirmation disabled — `signUp` auto-confirms; `signInWithPassword` for returning users |
| Book metadata | **Open Library API** | You've already integrated this before (book tracker project) — reuse that experience, free, no key required |
| Notifications (schedule reminders) | **Expo Notifications** | Native local/push notifications without a separate service for MVP |
| Recommendation logic (MVP) | **Rule-based scoring in a Supabase Edge Function** (weighted genre score + recency decay) | Don't reach for ML yet — a transparent weighted formula is easier to debug, explain, and iterate on than a black-box model, and it's enough to prove the loop works |
| Weekly Coach insight text | **Anthropic API (Claude) called from a Supabase Edge Function**, given a small structured payload of the week's sessions | Cheap to generate short narrative insights; keep prompts deterministic (temperature low) so insights don't feel erratic week to week |
| Analytics (product, not user-facing) | **PostHog** (self-hosted or cloud free tier) | Understand where users drop off in the loop — cheap to add early |

### 8.3 Suggested Supabase schema (MVP) — reference only, not to be provisioned by an agent

```sql
-- users handled by Supabase Auth

profiles (
  user_id uuid primary key references auth.users,
  display_name text,
  genre_weights jsonb default '{}',   -- all selected genres start at 0.8
  yearly_goal int,
  preferred_session_minutes int,       -- reserved; not collected in MVP onboarding
  format_preference text,              -- reserved; not collected in MVP onboarding
  created_at timestamptz default now()
)

books (
  id uuid primary key default gen_random_uuid(),
  open_library_id text unique,         -- upsert target for Open Library caching
  title text,
  author text,
  cover_url text,
  genres text[],
  rating numeric,                      -- avg rating shown on Book Detail (not yet populated)
  rating_count int,
  estimated_read_minutes int,          -- "Time to read: 4h 30m" (not yet populated)
  mood_tags text[],                    -- e.g. ["Reflective"] (not yet populated)
  available_formats text[],            -- e.g. ["hardcover", "ebook", "audiobook"] (not yet populated)
  description text,
  isbn text,
  publisher text,
  published_date text,
  page_count int
)

queue_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  book_id uuid references books,
  reason_text text default '',         -- optional "why this book" string
  rank int,                            -- append-order in MVP; re-ranking is a fast-follow
  status text default 'want_to_read',  -- want_to_read | reading | finished
  current_page int default 0,          -- persisted reading progress
  created_at timestamptz default now(),
  updated_at timestamptz default now()
  -- current_chapter / selected_format: reserved, not used in MVP
)

reading_sessions (
  id uuid primary key,                 -- client-generated v4 UUID
  user_id uuid references auth.users,
  book_id uuid references books,
  date timestamptz,                    -- session start, inserted as ISO string
  duration_seconds int,                -- stopwatch elapsed time
  pages_read int default 0,
  target_minutes int                   -- optional, from the schedule block duration
)

schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  day_of_week int,                     -- 0-6
  start_time time,                     -- HH:MM
  end_time time,                       -- derived from start_time + duration
  label text default 'Reading Session',
  book_id uuid references books        -- optional; nullable
)

weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  week_start date,
  summary_text text,
  recommendation_text text
)
```

Row Level Security: intended policy shape is `user_id = auth.uid()` on every table — for Devan's own reference when configuring Supabase, not something an agent should apply.

**Schema notes (as implemented, deltas from the original design):**
- `reading_sessions` uses `date` + `duration_seconds` + optional `target_minutes` rather than `started_at` + `duration_minutes`; the UI computes `pages_read` from a start/end current-page delta.
- `queue_items` statuses are `want_to_read | reading | finished` (no `queued`/`abandoned`).
- `schedule_blocks` carries `label`, `end_time` (derived), and an optional `book_id` for the Home session card.
- `books` was extended with description/isbn/publisher/published_date/page_count to support Open Library caching (see AGENTS 7.3 migration).
- Stat tiles, Consistency Vine dots, completion rate, and Target Performance are all **computed from `reading_sessions` / `queue_items` on read** — no extra tables. A daily "did the user log at least one session" boolean per day, derived on the fly or cached in `weekly_insights`, drives the Consistency Vine dot row.

---

## 9. Success Metrics (MVP)

- % of started books marked "finished" (primary north star)
- Weekly active reading sessions per user
- Queue acceptance rate (books started from the queue vs. books started after a manual Discover search — search/curated browse *is* in MVP via the Discover tab, so this compares queue-driven vs. search-driven starts)
- Retention: users still logging sessions at week 4

---

## 10. Decisions

1. **Weekly Coach insights:** Rule-based/templated for MVP. Revisit an LLM-generated version later once there's enough real session data to justify it.
2. **Language:** English first at launch. Bahasa Indonesia as a fast-follow.
3. **Offline session logging:** Not in MVP. Fast-follow once the core loop is validated.