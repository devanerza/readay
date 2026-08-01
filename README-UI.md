# ReadFlow — Expo/React Native conversion

Converted from your 6 HTML mockups into a working Expo Router app using
NativeWind (Tailwind for React Native), `react-hook-form`, and TypeScript.

## Screen map

| Source file      | Page name           | New file                          |
|-------------------|---------------------|------------------------------------|
| code-1.html       | Cozy Reading Hub     | `app/(tabs)/home.tsx`             |
| code-2.html       | Discover             | `app/(tabs)/discover.tsx`         |
| code-3.html       | Book Detail (Midnight Library) | `app/book-detail.tsx`  |
| code-4.html       | Focused Reading / Session | `app/reading-session.tsx`   |
| code-5.html       | Your Journey         | merged into `app/(tabs)/profile.tsx` |
| code-6.html       | Profile              | `app/(tabs)/profile.tsx`          |
| —                 | Library (no mockup given) | `app/(tabs)/library.tsx`          |

Tabs live under `app/(tabs)/`, driven by a custom bottom tab bar in
`app/(tabs)/_layout.tsx` that mirrors the original design's nav (Home,
Discover, Library, Profile). The Journey screen was removed and its sections
(Consistency Vine, Recent Finishes, Evolving Tastes, Weekly Coach, Target
Performance) now live inside Profile. Book Detail and Reading Session are
pushed as stack screens from `app/_layout.tsx`.

## What changed vs. the HTML

- **Tailwind config → `tailwind.config.js`**: all the custom color tokens
  (surface, primary, on-surface-variant, etc.), spacing scale, and font
  sizes from your original `tailwind.config` script were ported 1:1 into a
  NativeWind preset, so class names like `bg-surface-container-low`,
  `text-on-surface-variant`, `px-margin-page` all work unchanged.
- **Fonts**: EB Garamond + Inter are loaded via `@expo-google-fonts/*` in
  `app/_layout.tsx` (Material Symbols isn't available as a font package for
  RN, so icons are mapped instead — see below).
- **Icons**: Material Symbols → `@expo/vector-icons` `MaterialIcons`, mapped
  in `components/Icon.tsx` (e.g. `book_2` → `menu-book`, `person_2` →
  `person`). Swap this out for `react-native-vector-icons` MaterialSymbols or
  a custom icon font if you want an exact glyph match.
- **Search bar (Discover)**: rebuilt with `react-hook-form`'s `Controller` so
  the search field is form-managed and ready to wire to real search logic
  (`onSearch` in `discover.tsx`).
- **Timer (Reading Session)**: now a **stopwatch** — it counts up from 00:00 and
  keeps running until the user taps "End Session". An optional target (passed
  via `?target_minutes=`) from a schedule block shows a progress bar + "Target
  reached!" flash, and the post-session summary compares actual vs. target.
- **Hover/mousemove micro-interactions** (parallax on book cover, scroll
  reveal via `IntersectionObserver`) don't have direct RN equivalents and
  were dropped in favor of `active:scale-95`-style press feedback, which is
  the standard mobile equivalent.
- **Horizontal carousels** (`overflow-x-auto`) → `ScrollView horizontal`.

## Setup

```bash
npx create-expo-app readflow --template blank-typescript
# then copy these files into it, or use this folder directly
npm install
npx expo start
```

Make sure `app.json` has `"scheme"` set if you plan to deep link, and that
`expo-router` is set as your `main` entry (already done in `package.json`).

## Notes / TODO

- `library.tsx` was built without an original mockup (none was included) and
  now shows the user's queue grouped by status (Want to Read / Reading /
  Finished) with status toggles and a styled remove-book confirmation modal.
- All book cover/avatar images point at the original `lh3.googleusercontent.com`
  URLs from your mockups — swap these for your own asset pipeline (Supabase
  storage, etc.) when ready.
