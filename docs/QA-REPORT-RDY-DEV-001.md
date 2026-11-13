# QA Report — [RDY-DEV-001] Continue development Readay

**Agent:** Neo (@neodev_a_bot) · **Branch:** `refactor/ux-flow` · **Date:** 2026-11-13
**Scope:** health check · repo hygiene · QA Phase 4–6 per `Execution-Plan-Readay.md`
**Hard limits respected:** no live Supabase project touched (no schema change, no query run), no layout/visual change to existing UI.

---

## 1. Health check — result

| Check | Command | Before | After |
|---|---|---|---|
| Typecheck | `npx tsc -p tsconfig.json --noEmit` | 1 error | **0 errors** |
| Lint | `npx expo lint` | **11 errors**, 7 warnings | **0 errors**, 1 info warning |
| Bundle (Android) | `npx expo export --platform android` | — | **exit 0**, `entry-*.hbc` 5.8 MB |
| Bundle (iOS) | `npx expo export --platform ios` | — | **exit 0**, `entry-*.hbc` 5.6 MB |

### Errors fixed
1. `src/app/_layout.tsx(1,8) TS2882` — missing type declaration for the NativeWind `global.css` side-effect import → added `css.d.ts` (`declare module "*.css"`).
2. `react-hooks/refs` ×3 — `Animated.Value` held in `useRef(...).current` and read during render (`Toast.tsx`, `Skeleton.tsx`, `(tabs)/_layout.tsx`) → moved to `useState(() => new Animated.Value(...))` (same identity, no re-animation, no re-render churn).
3. `no-unused-vars` ×2 — unused `TouchableOpacity` import; unused `CachedInsight` type.
4. `react-hooks/exhaustive-deps` ×3 — missing `router` dep (`index.tsx`, `(tabs)/_layout.tsx`); missing backfill-mutation deps (`book-detail.tsx`, guarded by `hasBackfilled*` refs so no re-fire loop).

### Warning left on purpose (not fixable without redesign)
`onboarding.tsx:46` — `react-hooks/incompatible-library`: React Compiler skips memoising the component because React Hook Form's `watch()` cannot be memoised safely. Informational only; fixing it means restructuring the onboarding form (flagged, not changed).

## 2. Repo hygiene — decisions

| Path | Size | Decision |
|---|---|---|
| `references/` | 264 K, 5 files | **tracked** — Solace Reads screenshots + `DESIGN_NOTES.md` are the UI source of truth |
| `mockups/` | 16 K, 1 file | **tracked** — design-phase artifact |
| `wireframes/` | 196 K | already tracked (commit `5362e84`) |
| `uts-pitch/` | 1.4 M, 31 files | **`.gitignore`d** — closed UTS deliverable, stays on disk in the workspace |
| `package-lock.json` | — | verified clean, nothing to commit |

## 3. QA Phase 4–6

### Phase 4 — Core loop, screen by screen (wiring verified statically + by typecheck/bundle)
| # | Area | Verdict | Notes |
|---|---|---|---|
| 4.1 | Profile reads/writes `profiles` | OK | `lib/profiles.ts` → `profiles`; screen renders goal + genre weights |
| 4.2 | Library / Next Read ranking | OK | `reRankQueue` sorts by genre score desc, ties by `rank`, returns a copy (no DB write); applied on the *Want to Read* tab only |
| 4.3 | Schedule `schedule_blocks` round-trip | OK | `end_time` derived from `start_time + duration_minutes` with midnight wrap; read orders by `day_of_week, start_time` |
| 4.4 | Session Tracker write path | OK | `reading_sessions` row on Done (`duration_seconds`, `target_minutes`, `date`); `pages_read` is written **after** the summary via `updateSessionPages` (the `0` at insert is a placeholder, not a bug) |
| 4.5 | Weekly Coach rule-based | OK + **tested** | pure core extracted, 22 assertions pass — see §4 |

### Phase 5 — Home
All five sections bound to Phase 4 queries (`home.tsx`); loading gated by skeletons, `items ?? []` defaults everywhere → no section can hard-fail on an empty query.

### Phase 6 — QA pass
- **States:** every data screen renders a skeleton while loading and falls through to an explicit empty state on error/zero rows. No blank crash risk found; no infinite-spinner path found (`isLoading` false on error after QueryClient `retry: 2`).
- **i18n:** `src/i18n/{index.ts,en.json}` is wired and all **notification** copy comes from it (`notification.*` keys, `{{label}} / {{time}} / {{withBook}}` interpolation verified). Screens do **not** use `t()` yet → Gap A.
- **Notifications:** reminder + prep-timer scheduling verified in code (weekly triggers, `weekday = day_of_week + 1`, 10-minute prep lead with correct day rollback, foreground handler, Android channels). Copy matches the provided strings; nothing missing.
- **No direct Supabase schema change** was made to wire anything.

## 4. Real test evidence — weekly coach

```
$ npm run qa:weekly-insight
1) insufficient data (empty) ............. 5 pass
2) this week only, 3 days, 90 min ....... 5 pass
3) low week (1 day, 10 min) ............. 3 pass
4) full week ............................ 3 pass
5) down trend ........................... 3 pass
6) streak counting ...................... 1 pass
7) month boundary (Oct rows) ............ 2 pass
RESULT: 22 passed, 0 failed
```
`scripts/qa-weekly-insight.mts` (dependency-free, `node --experimental-strip-types`, no network, no live project).

## 5. Gaps left — need a decision from Devan (not fixed)

- **A. i18n not applied to screens (do-not-Done per DoD §2).** 64 hardcoded JSX text literals across 12 screens — `home.tsx` 18, `journey.tsx` 15, `schedule.tsx` 11, `book-detail.tsx` 5, `(tabs)/_layout.tsx` 4, `reading-session.tsx` 3, plus toasts/error strings. Ground Rule 0.5 says this is agent work, but the fix rewrites user-facing wording → that's copy, validated by @academicbuddybot. Recommendation: one dedicated i18n pass, Neo refactors + Theo validates the copy diff.
- **B. No error-state UI.** Query failures land on the empty state (no crash, no infinite spinner), but there's no "couldn't load / retry" affordance. Adding one changes visuals → Iris' domain.
- **C. Streak rule is strict.** Streak counts only if *today* has a session, so it resets to 0 every morning until the first session is logged. Evidence: test 3. Changing this is a product decision.
- **D. Orphan route `(tabs)/discover.tsx`.** The Discover tab was replaced by the Add Book (+) button, but the file remains → `/discover` is still routable, `DiscoverSkeleton` is dead code, and `schedule.tsx` still says *"Add books from Discover first."* Dead route + stale copy; deleting it is a code change, the copy is a content change.
- **E. Timer notification needs a native build.** The ongoing timer uses `react-native-notify-kit` (notifee fork) → it will not appear in Expo Go. Needs a dev build (`expo-dev-client`) on a real device; this sandbox cannot verify it end-to-end.
- **F. `syncBlockReminders` cancels all scheduled notifications** before re-adding block reminders. Safe today (only reminders are scheduled) — flagging for when other notification types are added.
- **G. Web bundle not verified** (`expo export --platform web`); Android + iOS bundles both pass. Web is not a target platform for MVP.

## 6. Commits

| SHA | What |
|---|---|
| `454b6bf` | health check: fix all tsc + eslint errors |
| `1271bb3` | repo hygiene: track design refs, ignore closed pitch archive |
| `f309ed3` | qa: pure weekly-coach core + dependency-free test harness |
