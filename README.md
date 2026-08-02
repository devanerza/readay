# Readay 📚

> Your daily reading coach — discover books you'll genuinely enjoy and build a reading habit that lasts.

Readay is a premium, mobile-first reading app that helps readers discover books they love and finish more of them. It replaces a search-first catalog with a personalized "read next" queue, a gentle weekly schedule, minimal friction reading sessions, and quiet habit coaching tucked into a cozy, editorial interface.

> 📖 Product design and roadmap live in **[PRD-Readay.md](./PRD-Readay.md)**. Build/execution notes live in **[Execution-Plan-Readay.md](./Execution-Plan-Readay.md)**.

---

## ✨ Features

### 🔍 Discover
- Real book search against the **Open Library API** (no API key required)
- Curated genre browsing, "Based on Your Favorites" (driven by your genre weights), and "Perfect for Tonight" picks
- Rich **Book Detail** page: description, author, page count, cover, and your reading progress

### 📚 Reading Library / Queue
- **Want to Read / Reading / Finished** tabs
- One-tap status toggles (+ **Resume** and **Start Reading** jump straight into a session)
- Remove-a-book confirmation modal

### 🗓️ Schedule
- Create, edit, and delete reading time blocks (day, start time, duration, optional book)
- **Today's Blocks** and a flat **All Blocks** list
- Home surfaces your next upcoming block and passes its duration into the session as a reading target

### ⏱️ Reading Session Tracker
- Deliberately minimal **stopwatch** (counts up, no countdown)
- Optional target from a schedule block with a progress bar and **"Target reached!"** flash
- **End Session → Summary (actual vs. target) → enter page reached → saves pages** and progress

### 🏠 Home
- Continue Reading (as a carousel of every book you're reading), Next Session, Want to Read, Recently Finished, and a weekly minutes/streak summary

### 🧭 Profile & Weekly Coach
- Reading-goal and genre-preference tiles with stats computed live from your sessions (time, pages, streak, goal progress)
- **Weekly Coach** — a rule-based narrative insight + one actionable recommendation
- Weekly habit grid, evolving genre tastes, and target-performance recap

### 👤 Auth & Onboarding
- Email + password sign-up / sign-in (auto-confirmed — no email verification step)
- Onboarding questionnaire fed into your `profiles` genre weights and goals

---

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Mobile framework | **Expo / React Native** (`~57`) with **Expo Router** (file-based) |
| Backend | **Supabase** (Postgres + Auth) |
| Language | **TypeScript** |
| Styling | **NativeWind** (Tailwind for React Native), EB Garamond + Inter |
| Server state | **TanStack Query (React Query)** |
| Client state | **Zustand** |
| Forms | **React Hook Form** |
| Book metadata | **Open Library API** (search, works, covers, editions) |
| Notifications (planned) | Expo Notifications |

---

## 📁 Project structure

```
src/
├── app/                    # Expo Router (file-based) screens
│   ├── (tabs)/             # Home · Discover · Library · Profile
│   ├── auth.tsx            # Auth / mode toggle
│   ├── sign-in.tsx         # Returning-user sign-in
│   ├── onboarding.tsx      # Preference questionnaire
│   ├── schedule.tsx        # Schedule blocks (read-only screen)
│   ├── book-detail.tsx     # Book details + Add to Library
│   └── reading-session.tsx # Stopwatch session tracker
├── components/             # Reusable UI (BookCard, TabSwitcher, EmptyState, …)
├── lib/                    # Data access & services
│   ├── supabase.ts         # Supabase client
│   ├── queue-items.ts      # Library queue CRUD
│   ├── schedule-blocks.ts  # Schedule blocks CRUD
│   ├── profiles.ts         # Onboarding / profile
│   ├── reading-sessions.ts # Session stats & logging
│   ├── books.ts / book-service.ts  # Book cache + OL orchestration
│   ├── open-library.ts     # Raw Open Library API client
│   └── weekly-coach.ts     # Rule-based insights
├── stores/                 # Zustand (auth)
├── i18n/                   # strings layer (en.json)
├── hooks/                  # theme / color scheme
└── global.css / theme.ts   # design tokens
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js and npm
- An Expo / React Native development environment
- A Supabase project with the schema below

### 2. Install

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 4. Run

```bash
npx expo start
```

Then press **a** (Android), **i** (iOS), **w** (web — React Native Web), or open it in **Expo Go**.

---

## 📦 Supabase setup

The app expects the following tables (RLS policy on each is `user_id = auth.uid()`). See the reference schema in **PRD-Readay.md §8.3** for the full definition:

| Table | Purpose |
|---|---|
| `profiles` | Onboarding answers, genre weights, goal, prefs |
| `books` | Cached book metadata (synced from Open Library) |
| `queue_items` | user's "Want to Read / Reading / Finished" queue |
| `reading_sessions` | logged session deltas + pages + target |
| `schedule_blocks` | user's reading time blocks |
| `weekly_insights` | cached Weekly Coach output |

> The app talks to this shape via the client code only — the schema is provisioned independently (see the PRD's note under Tech Stack).

---

## 🛠️ Notes & roadmap

Implemented:
- [x] Full book discovery + detail via Open Library, cached into the local `books` table
- [x] Library queue with start/resume/session redirection
- [x] Session stopwatch with schedule-driven targets and page logging
- [x] Rule-based Weekly Coach, stats & streak computed from sessions
- [x] i18n strings layer (English)

Upcoming / planned (per the PRD, not yet implemented here):
- Genre-weight auto-shift on session completion, queue re-ranking
- Weekly Coach persistence to `weekly_insights`
- Notifications (Expo Notifications) for schedule reminders
- Bahasa Indonesia locale fast-follow

---

## 📄 License

Private / internal. See the product docs for details.