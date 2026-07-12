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

---

## 1. Suggested Build Order

### Phase 1 — Foundations
- [ ] Init Expo project (TypeScript template), Expo Router for navigation
- [ ] Install & configure: NativeWind (Tailwind for RN), Zustand, TanStack Query, React Hook Form
- [ ] Set up Supabase client (`lib/supabase.ts`) reading URL/anon key from env — **assume Devan will supply `.env` values; agent does not create the Supabase project itself**
- [ ] Set up i18n strings layer (even if only `en.json` exists for now) — all UI text pulled from it, never inline
- [ ] Confirm design tokens (colors, radii, spacing, type scale) match what's coming from the web-chat-generated UI, so wiring doesn't require re-theming later

### Phase 2 — Receive & Integrate Provided UI
- [ ] Drop in UI components/screens as provided from the web chat LLM output
- [ ] Sanity-check each file compiles cleanly in the Expo/TypeScript project (imports, types, RN-vs-web API mismatches — web-generated UI sometimes uses DOM APIs that don't exist in React Native, catch those here)
- [ ] Treat the provided UI as source of truth for design — no comparison against PRD §7

### Phase 3 — Auth & Onboarding (wiring)
- [ ] Supabase Auth integration (magic link / OTP — no password screens) behind the provided auth UI
- [ ] Wire onboarding form (already built) to React Hook Form state + submit handler
- [ ] Write onboarding answers to `profiles` table shape (per PRD §8.3 reference schema) — agent writes the *client code* that calls Supabase, not the schema itself

### Phase 4 — Core Loop, Screen by Screen (wiring + data QA)
For each screen below: connect to Supabase via TanStack Query, verify loading/empty/error states render correctly, verify the right fields show the right data, and check nothing breaks on edge cases (empty queue, zero sessions logged, etc.). Do not alter layout/visual design — that's owned by the provided UI.
1. **Profile** (§3.1 reference) — read/write `profiles`; genre weights rendered wherever the provided UI places them
2. **Queue / Library → "Next Read"** (§3.2) — bind `queue_items` list; verify cover + reason text render per item, ranking order is respected
3. **Schedule** (§3.3) — bind `schedule_blocks`; verify day/time data round-trips correctly
4. **Session Tracker** (§3.4) — wire Start → Done flow to write a `reading_sessions` row; verify minutes/pages persist correctly
5. **Weekly Coach** (§3.5) — implement the rule-based template function that reads `reading_sessions` and produces the narrative text/recommendation string; verify it renders into the provided insight component correctly, including when there's insufficient data for the week

### Phase 5 — Home (wiring)
- [ ] Bind Home sections (Today's Reading, Continue Reading, Next Session, Weekly Progress line) to the relevant queries built in Phase 4
- [ ] QA that no section silently fails or shows stale data

### Phase 6 — QA Pass
- [ ] Cross-check every screen against Definition of Done (§2 below)
- [ ] Verify notifications (Expo Notifications) fire correctly for schedule reminders, and that copy matches what was provided (agent doesn't rewrite copy — flag if missing)
- [ ] Regression check after any Supabase schema proposal is applied by Devan

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
