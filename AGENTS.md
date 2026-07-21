# Execution Plan — Readay (for AI coding agents)

**Companion to:** PRD-Readay.md — read that first for product context, design direction, and decisions. This document translates it into build order for an AI coding agent (e.g. Claude Code) working alongside Devan. **UI/front-end is generated separately via a web chat LLM session; this agent's scope is backend wiring, integration, and QA — not UI design.**

---

## 0. Ground Rules for the Agent

0. **UI ownership:** The front-end UI/screens are provided separately (generated via a web chat LLM session, using the PRD's design direction as the brief). This agent's job is **not** to design or build UI from scratch. Its job is to:
   - Wire the provided UI components/screens to real data (Supabase queries/mutations)
   - Check for runtime errors, type errors, and broken states
   - Verify data is rendering correctly (right fields, correct formatting, loading/empty/error states behave)
   - Flag — not silently "fix" — any place where the provided UI seems to need a structural change to work correctly; that goes back through the web chat UI process, not this agent
1. **Do not provision, configure, or run migrations against Supabase.** Devan is setting up the Supabase project (auth, database, RLS, Edge Functions) independently. The schema in the PRD (§8.3) and in this plan is a **reference contract** — build the app to talk to that shape, but do not create/alter the live project. If a task requires a schema change, propose the SQL/migration file for Devan to review and run — don't execute it.
2. **Design direction comes from the provided front-end code, not this document.** The actual visual/art direction may evolve or differ from what's in the PRD by the time front-end code is provided. The agent should not compare screens against PRD §7 or flag "design mismatches" — just follow the provided front-end code as the source of truth, and focus on errors, data correctness, and optimization as described above.
3. **Habit-coaching UI is subtle, not a feature.** Never build a "stats" or "analytics" screen as a primary nav item with charts. Weekly Coach output is short narrative text (see PRD §3.5), templated/rule-based for MVP (PRD §10.1) — no LLM call needed yet.
4. **Scope discipline:** if a task resembles anything in PRD §4 (social, ratings, streak animations, notes/highlights, audiobooks, chatbot), stop and flag it rather than building it.
5. **Language:** all copy/strings in English for MVP, but never hardcode raw strings inline — route through a simple i18n/strings layer from day one so the Bahasa Indonesia fast-follow (PRD §10.2) is a translation pass, not a refactor. If the provided UI hardcodes strings, that's something to flag/refactor into the strings layer as part of wiring it up.
6. **Offline logging is out of scope for MVP** (PRD §10.3) — but don't paint the session-logging flow into a corner; keep the write path simple enough that a local queue can be added later without a schema change.
7. **Open Library API for real book data.** Use Open Library's free API (`/search.json`, `/works/{id}.json`, `covers.openlibrary.org`) for Discover search, book details, and cover images. Cache results in Supabase `books` table via upsert by `open_library_id`. No API key required.

---

## 1. Suggested Build Order

### Phase 1 — Foundations
- [ ] Init Expo project (TypeScript template), Expo Router for navigation (check first, if done, don't touch nor change anything, just remove the default example code, page, components, etc.)
- [ ] Install & configure: NativeWind (Tailwind for RN), Zustand, TanStack Query, React Hook Form
- [ ] Set up Supabase client (`lib/supabase.ts`) reading URL/anon key from env — **assume Devan will supply `.env` values; agent does not create the Supabase project itself**
- [ ] Set up i18n strings layer (even if only `en.json` exists for now) — all UI text pulled from it, never inline
- [ ] Confirm design tokens (colors, radii, spacing, type scale) match what's coming from the web-chat-generated UI, so wiring doesn't require re-theming later

### Phase 2 — Receive & Integrate Provided UI
- [ ] Drop in UI components/screens as provided from the web chat LLM output
- [ ] Sanity-check each file compiles cleanly in the Expo/TypeScript project (imports, types, RN-vs-web API mismatches — web-generated UI sometimes uses DOM APIs that don't exist in React Native, catch those here)
- [ ] Treat the provided UI as source of truth for design — no comparison against PRD §7

### Phase 3 — Auth & Onboarding (wiring)

**Auth method: email+password signup + sign-in (email confirmation disabled in Supabase).** No OTP step — `signUp` creates and confirms the user immediately. The user must not be treated as onboarded until a `profiles` row exists.

- [x] **Signup — email + password.** Call `supabase.auth.signUp({ email, password })` behind the provided signup UI. Since email confirmation is disabled in Supabase settings, the user is auto-confirmed and a session is returned immediately.
- [x] **Sign-in (returning users).** Call `supabase.auth.signInWithPassword({ email, password })` behind the provided sign-in UI.
- [x] Wire onboarding form (already built) to React Hook Form state + submit handler
- [x] Write onboarding answers to `profiles` table shape (per PRD §8.3 reference schema) — agent writes the *client code* that calls Supabase, not the schema itself

### Phase 4 — Core Loop, Screen by Screen (wiring + data QA)
For each screen below: connect to Supabase via TanStack Query, verify loading/empty/error states render correctly, verify the right fields show the right data, and check nothing breaks on edge cases (empty queue, zero sessions logged, etc.). Do not alter layout/visual design — that's owned by the provided UI.

**Trigger/function points across Phase 4 (agent writes client code; Devan provisions DB-side):**
- Genre weights auto-shift when a session is completed or abandoned (§3.1). Agent writes the client-side API call that notifies the update. Devan provisions the DB trigger or Edge Function that recalculates `profiles.genre_weights` from `reading_sessions`.
- Profile stat tiles (reading time, pages turned, goal progress) and Journey streak/consistency data are **computed from `reading_sessions` and `queue_items` on read** — no new table. Agent writes the query; Devan may choose to materialize via a DB function or view.

1. **Profile** (§3.1 reference) — read/write `profiles`; genre weights rendered wherever the provided UI places them. Profile stat tiles (reading time, pages, goal) computed from `reading_sessions`. ✅ *Done*
2. **Queue / Library → "Next Read"** (§3.2) — `queue_items` lib created with full CRUD. Library screen is still a placeholder (needs UI from web chat). Home screen's "Next Read" section wired to top queued item.
3. **Schedule** (§3.3) — `schedule_blocks` lib created. Home screen shows upcoming block. **No dedicated Schedule screen exists yet** (needs UI from web chat — the PRD explicitly requires a Schedule tab or reachable screen).
4. **Session Tracker** (§3.4) — wire Start → Done flow to write a `reading_sessions` row; verify minutes/pages persist correctly. ✅ *Done*
5. **Weekly Coach** (§3.5) — rule-based template function implemented in `lib/weekly-coach.ts`, renders into Journey screen. Not yet persisted to `weekly_insights` table (computes on-the-fly).

### Phase 5 — Home (wiring)
- [x] Bind Home sections (greeting/streak, Currently Reading, Next Read, Upcoming Session, Recently Finished) to Phase 4 queries
- [x] QA that no section silently fails or shows stale data

### Phase 6 — QA Pass
- [x] Cross-check every screen against Definition of Done (§2 below)
- [ ] Verify notifications (Expo Notifications) fire correctly for schedule reminders, and that copy matches what was provided (agent doesn't rewrite copy — flag if missing)
- [ ] Regression check after any Supabase schema proposal is applied by Devan

### Phase 7 — Remaining MVP Gaps

**Goal:** Close the gap between the current state and a fully-functioning MVP per PRD §1.3, §3, §5, §6.

#### 7.1 — Schedule Screen (PRD §3.3, §6)
- **Why:** The PRD's IA (§6) lists Schedule as its own nav destination (`Schedule → Weekly Calendar / Upcoming Sessions`). Currently only a summary reads from `schedule_blocks` on the Home screen — users have no way to create/edit/delete their schedule blocks.
- **Depends on:** UI from web chat (Schedule screen design). Onboarding should also capture free-time blocks.
- **What to wire:** CRUD for `schedule_blocks` table. TanStack Query mutations. React Hook Form for block creation (day_of_week, start_time, duration_minutes).

#### 7.2 — Library Screen — Queue Management (PRD §3.2)
- **Why:** The Library tab is a placeholder. Users need to see their full queue (grouped by status), change book status, and manage their list.
- **Depends on:** UI from web chat (Library grid/list design).
- **What to wire:** Query `queue_items` joined with `books`. Tabs/sections for queued / reading / finished. Status toggle mutation. Book cover rendering.

#### 7.3 — Discover + Book Detail via Open Library API (PRD §3.2)
- **Why:** Both screens are 100% hardcoded mock data. Users can't discover real books or see real book metadata.
- **No UI dependency** — screens already exist with mock data; just swap in real data while preserving layout.
- **What to wire:**
  1. Migrate `books` table to match Open Library schema (see reference below)
  2. `lib/open-library.ts` — raw API client:
     - `searchBooks(query)` → `https://openlibrary.org/search.json?q={query}`
     - `getBookDetails(olId)` → `https://openlibrary.org/works/{olId}.json`
     - `getBooksBySubject(subject)` → `https://openlibrary.org/subjects/{subject}.json?limit=20`
     - Cover URL builder: `https://covers.openlibrary.org/b/id/{cover_id}-L.jpg`
  3. `lib/book-service.ts` — orchestrator: search OL → upsert to Supabase `books` → return local book objects
  4. **Discover screen:** wire search (debounced 300ms), genre-filtered browsing, "Based on Your Favorites" from `profile.genre_weights`, "Perfect for Tonight" from curated subject
  5. **Book Detail screen:** read book from Supabase `books` table by `book_id` route param; compute progress from `reading_sessions` for this `book_id`
  6. **Actions:** "Add to Queue" → `addToQueue()`, "Start Reading" → navigate to `reading-session?book_id={id}`
- **Migration proposal (for Devan to run):**
  ```sql
  CREATE TABLE IF NOT EXISTS public.books (
    id uuid primary key default gen_random_uuid(),
    open_library_id text unique,
    title text not null,
    author text,
    cover_url text,
    genres text[],
    rating numeric,
    rating_count int,
    estimated_read_minutes int,
    mood_tags text[],
    available_formats text[],
    description text,
    isbn text,
    publisher text,
    published_date text,
    page_count int
  );
  ```

#### 7.4 — Genre Weight Auto-Shift (PRD §3.1)
- **Why:** Genre weights are static after onboarding. The PRD says they should shift dynamically when a session is completed or abandoned.
- **What to wire:**
  - Client-side: after `createReadingSession()`, call a Supabase Edge Function endpoint (or direct DB call) that recalculates weights
  - Devan provisions: DB trigger or Edge Function that reads recent `reading_sessions` and updates `profiles.genre_weights`

#### 7.5 — Queue Re-Ranking (PRD §3.2)
- **Why:** Queue rank is static. It should re-rank when genre weights change.
- **What to wire:**
  - After genre weight recalculation (7.4), re-fetch and re-sort `queue_items` by a weighted score derived from genre match
  - Can be client-side (re-sort in TanStack Query on cache invalidation) or via Edge Function

#### 7.6 — Weekly Coach Persistence (PRD §8.3)
- **Why:** Weekly Coach currently computes on-the-fly each Journey load. Should cache to `weekly_insights` for consistency.
- **What to wire:**
  - Write `generateWeeklyInsight()` output to `weekly_insights` table (upsert by week_start)
  - Read from `weekly_insights` first; fall back to on-the-fly generation if no cached row
  - Invalidate when new sessions are logged

#### 7.7 — Foundational Layer Cleanup
- **i18n/strings layer (AGENTS #5):** Create `lib/strings/en.json` with all UI copy. Refactor every screen to pull strings from the layer. Enables Bahasa Indonesia fast-follow (PRD §10.2).
- **Error handling:** Add Toast/Alert to all async Supabase operations. Show retry buttons on query failures.
- **Hardcoded items on Profile:** Preferences section and avatar URL need a schema/storage solution (post-MVP). For MVP, link avatar to Gravatar by email or supabase auth avatar.

---

### Phase 8 — Reading Session & Library Flow Fixes

**Goal:** Complete the Start Reading → Session → End Session loop so it works end-to-end with real data.

#### 8.1 — Wire Reading Session to Real Book Data
- **Why:** `reading-session.tsx` still uses hardcoded mock data (book cover, avatar, Cicero quote). The timer and session-saving work, but the UI doesn't show the actual book being read.
- **What to fix:**
  1. Read `book_id` from the query params (already supported)
  2. Fetch book details from the `books` table via `book_id`
  3. Show the real cover image, title, and author instead of mock data
  4. Keep the timer, pause, and End Session flow as-is
  5. Remove the hardcoded quote/avatar/cover

#### 8.2 — Library "Start Reading" Redirects to Reading Session
- **Why:** The Library screen's "Start Reading" button (on the "Want to Read" tab) only toggles the queue item status to `reading` but does NOT navigate to the reading session screen. Users must manually find and tap the book again.
- **What to fix:**
  1. After `statusMutation` succeeds for `want_to_read → reading`, call `router.push(\`/reading-session?book_id=${item.book_id}\`)` so the user lands directly in the session
  2. Use `onSuccess` of the mutation to navigate (after cache invalidation)

#### 8.3 — Library "Start Reading" Also in Reading Tab
- **Why:** The Reading tab shows books with status `reading` but no way to resume. Add a "Resume" button that also navigates to the reading session.
- **What to fix:**
  1. In the Reading tab's action row, if status is `reading`, show a "Resume" button instead of "Start Reading"
  2. Both "Start Reading" (Want to Read) and "Resume" (Reading) navigate to the session

---

### Phase 9 — Home Screen Enhancements

**Goal:** Make the Home screen more dynamic and useful for multi-book readers.

#### 9.1 — Currently Reading Carousel
- **Why:** Home screen "Currently Reading" section shows only 1 book (the top reading queue item). If a user reads multiple books simultaneously, only the most recent one appears.
- **What to wire:**
  1. Change `getCurrentlyReading` query (or add a new one) to return ALL books with status `reading`, ordered by recently updated
  2. Replace the single hero card with a horizontal `ScrollView` carousel
  3. Each card shows cover, title, author, and "Resume" button
  4. When queue is empty, show the existing empty state CTA

---

### Phase 10 — Schedule Screen Cleanup

**Goal:** Simplify the schedule screen to reduce cognitive load — show only user-created blocks, not an empty week grid.

#### 10.1 — Remove Burden Days View
- **Why:** The weekly calendar grid shows all 7 days even when empty, creating visual noise. Users only need their created blocks + an "Add Block" interface.
- **What to fix:**
  1. Remove the "Weekly Calendar" section showing all 7 days
  2. Keep "Today's Blocks" section
  3. Add a simple list of all blocks (flat, no day grid) below Today's section
  4. Keep the "Add Block" button in the header and inline "+ Add block" CTAs
  5. Keep the form for creating/editing blocks

---

## 2. Definition of Done (per screen)

A screen is done when it passes all of:
- [ ] Data renders correctly from Supabase (right fields, correct formatting, no placeholder/mock data left in)
- [ ] Loading, empty, and error states all behave correctly (no blank crashes, no infinite spinners)
- [ ] No compile/type errors, no RN-incompatible web APIs left over from the provided UI
- [ ] Visual output is unchanged from the provided front-end code — agent hasn't altered layout/design
- [ ] All copy still comes from the strings/i18n layer (flagged if the provided UI hardcoded strings)
- [ ] No direct Supabase schema changes were made to wire it up

---

## 3. What to Flag Back to Devan (don't just proceed)

- Any point where a feature request resembles PRD §4 (out of scope)
- Any point where a schema change beyond PRD §8.3 seems necessary
- Any data-rendering bug that seems to stem from a UI structural issue rather than a wiring bug
- Before adding any new third-party package not listed in PRD §8.2