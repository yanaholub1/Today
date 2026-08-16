# Handoff — "Today" app

A React 19 + TypeScript + Vite + Tailwind CSS v4 wellness app ("Today" — mood check-ins + daily intentions), matched pixel-for-pixel against a Figma file throughout its build, now migrated onto a real Supabase backend with a motion pass on top. Full product brief: [today_app_brief.md](today_app_brief.md).

## ⚠️ Read this first

**The working tree has a large amount of uncommitted work.** `git log` shows exactly one commit (`64afff3`, "Baseline snapshot before Supabase migration") — everything since then (the entire Supabase migration + all motion work described below) is **uncommitted**. Run `git status` before doing anything destructive. The user has asked to commit once before and then interrupted the request — it's still pending. Don't commit without asking first (per this project's own established norm this session).

## Running it locally

```bash
npm install
npm run dev   # now runs `vite --host`, exposes on the local network too
```

`.env.local` already exists (gitignored) with **real, working Supabase credentials** — see below. If it's ever missing, `supabaseClient.ts` throws immediately at import time with a clear message (the whole app fails to mount until it's filled in); copy `.env.example` to `.env.local` and fill in the two `VITE_SUPABASE_*` values from the project's dashboard.

The app is a fixed-width mobile layout (`max-w-[393px]`) — narrow the browser or use devtools' device toolbar.

## Supabase project (real, live)

- Project: **"today"**, id `hogdooxokwhqicveiqfo`, org `jfgqcabdgsanmqjbtcyl` ("yanaholub1's Org"), region `us-east-1`, free tier ($0/mo — auto-pauses after 7 days of inactivity, first request after a pause is just slow, not broken).
- Created and schema applied via the Supabase MCP server (`apply_migration`, migration name `initial_schema_with_rls`) — **not** through the dashboard SQL editor. If you have MCP access in the new chat, keep using it for further schema changes so they stay tracked as migrations; [supabase/schema.sql](supabase/schema.sql) is a reference copy of what's actually deployed (keep it in sync manually if you change the schema).
- 4 tables, all RLS-enabled, zero security-advisor findings as of last check: `day_logs`, `intentions`, `mood_checkins`, `favorite_techniques`. RLS follows current Supabase best practices — `(select auth.uid())` wrapping (huge perf win, avoids per-row re-evaluation), `to authenticated` on every policy, separate SELECT/INSERT/UPDATE/DELETE policies per table rather than one `FOR ALL`. Full reasoning is in `schema.sql`'s own comments.
- Auth: Supabase magic-link (passwordless email), via `src/lib/authStore.tsx`.

## What's done vs. pending

Every task is complete except **end-to-end validation of the real sign-in flow** (task #40 in this session's tracker) — i.e., actually clicking a real magic-link email and confirming session persistence + a two-account RLS test. Everything else (schema, RLS, data-layer migration, all UI screens migrated off mock data, all 3 motion features) has been built and verified via automated browser/code checks, but a real human clicking a real email link hasn't happened yet in this session.

### 1. Mock-data → Supabase migration (previous session)
Replaced the entire mock `dayLogStore` (in-memory, single "today" only) with real Supabase reads/writes, keeping every consuming screen's hook signature identical so no screen needed changes beyond the data layer:
- `src/lib/supabaseClient.ts` — the client.
- `src/lib/authStore.tsx` — real magic-link auth (`signInWithMagicLink`, `signOut`, session state via `getSession`/`onAuthStateChange`). Session persistence is Supabase's own default (`persistSession: true`, localStorage) — not something built here.
- `src/lib/dayLogStore.tsx` — same `useDayLogStore()` hook every screen already called; internals now do real Supabase reads/writes for **today only**. `toggleFavoriteTechnique` is **optimistic** (local state flips before the network write resolves, rolled back on failure) — this matters for the heart-burst animation below, which must not be delayed by a round-trip.
- `src/lib/dayLogHistory.ts` — shared range-query fetcher (`fetchPastDayBundles`) for "everything before today," used by both `EntriesScreen.tsx`'s Journal history and `PatternsScreen.tsx`'s aggregation (`toPatternsMockDay` adapts a `DayBundle` into the shape `patternsAggregation.ts`'s pure functions already expected — that module itself is untouched).
- `src/screens/RegistrationScreen.tsx` — rewired for real magic-link (same visual recipe as before, new copy + a "check your email" step reusing `FlowSuccessScreen`).
- `App.tsx`'s route guards (`RequireRegistration`/`RedirectIfRegistered`/`RootRoute`) read real `useAuth()` status now instead of a mock flag; `RequireRegistration` also waits on `dayLogStore`'s own `loading` flag so the app never mounts on a stale-empty state right after sign-in resolves.
- `SettingsScreen.tsx` — real logout button, wired to `signOut()`.
- Deleted `patternsHistoryMock.ts` (the old 150-day seeded-PRNG generator) entirely.

### 2. Motion pass (this session)
Three explicitly-requested animations, all with `prefers-reduced-motion` handling:

**a) App-wide pressed states** — one shared `.pressable` CSS utility (`index.css`, `:active` → `scale(0.96)` + opacity dip, 100ms), applied to every discrete tap target across ~29 files (buttons, chips, pills, icon targets, picker rows — see git diff for the full list). Deliberately **excluded** from `IntensitySlider`'s own draggable track (continuous drag, not a tap). Replaced two pre-existing one-off `active:*` implementations (`HeroActionCard`, `FlowActionButton`) with the shared class. `main.tsx` also registers a no-op `touchstart` listener at the app root — a well-known iOS Safari requirement for `:active` to fire at all.

**b) Onboarding logo splash** (`src/screens/OnboardingScreen.tsx`) — plays once on mount, before the rest of the screen's content appears: a giant circle (geometry pulled from Figma node `342:5736` via MCP — 1004px diameter, 27px above center) collapses via a FLIP-technique transform onto the real wordmark dot's *measured* position (not hardcoded, so it survives layout changes), does one ball-drop bounce against the row (single CSS `@keyframes`, `translateY`-only — never `scale`, so the circle's own shape can't distort), then the "t"/"day" letters slide out from behind it. The overlay circle and the real dot are pixel-identical at rest, so the final handoff is an **atomic, unfaded swap** (real dot's opacity restored + overlay unmounted in the same tick) — no fade, since fading was what caused an earlier "disappears then reappears" bug. Total sequence ≈2.1s. Skips entirely under reduced-motion.

Several real bugs were found and fixed here, worth knowing about if you touch this file again:
- The dot `<img>`'s bounding box (15×20, from its SVG's own padding) is *not* square — sizing the overlay to that full box instead of the true 15×15 circle made it visibly oval once scaled ~67× for the giant state. Fixed by deriving a proper square `circleRect` from the image rect.
- The bounce was originally two separately JS-reassigned CSS `transition`s chained mid-flight — a fragile pattern that visibly distorted the shape during the handoff. Rewrote as one atomic `@keyframes` animation.
- The real dot `<img>` was never actually hidden during the sequence — it was just fully covered by the overlay, so the moment the bounce moved the overlay away from its resting spot, the stationary real dot underneath became visible too ("two circles"). Now explicitly hidden (`opacity: 0`) for the sequence's duration and restored at the atomic swap.

**c) Favorite-heart burst** (`TechniqueCard.tsx` only, not `PracticeCard.tsx` — that list's heart only ever *un*favorites, so there's no "saving" moment to animate) — a second heart icon layered over the real one, pure CSS `@keyframes` (scale 1→1.7, opacity 0.9→0, 450ms), triggered only on a genuine `false→true` transition (tracked via `useRef`, never fires on mount or on unfavoriting). Purely decorative — doesn't block or delay the actual favorite toggle (see the optimistic-update note above).

## Codebase conventions worth knowing

- Every component has a doc comment citing which Figma node(s) it was verified against, and "review fix" comments marking explicit corrections made mid-session — this is a long-running pattern, keep following it if you add new components.
- Shared interactive-state CSS lives in `index.css` under `@layer utilities` (`.focus-ring`, `.focus-ring-field`, `.pressable`, `.heart-burst`, `.splash-circle-bounce`) — prefer adding here over one-off Tailwind arbitrary values when a pattern repeats.
- `npx tsc -b` (or `npm run build`) after every change — this project has been kept at zero type errors throughout.
- Visual/behavioral changes get verified live via the Browser preview tooling, not just asserted. For anything timing-based (the splash sequence, the bounce), the reliable trick used repeatedly this session: force a fresh mount via `window.history.pushState` + a `popstate` event dispatch (cheaper than a full page reload, and works around React Router not remounting on an identical path) — then sample `getComputedStyle`/`getBoundingClientRect` at scheduled `await new Promise(r => setTimeout(r, …))` delays *inside one injected script*, not via separate tool calls (separate calls have too much round-trip latency to catch anything sub-second). Keep polling intervals ≥50ms in a tight loop — a `docs/mindfulness.md`-worthy discovery: intervals under ~25ms with 20+ iterations caused a spurious one-off false reading during this session (not a real app bug, just harness noise).
- The dev server's Vite dependency cache occasionally serves stale console errors referencing long-deleted files after many HMR cycles in one session — if console output looks wrong/stale, `rm -rf node_modules/.vite` and restart the preview server before trusting it.
- No git repo existed at the start of this session (see the earlier Supabase-migration task) — it was `git init`'d specifically so risky migrations would be reviewable/revertible. Keep using it that way; don't let more work pile up uncommitted than necessary.

## Structure quick-reference

- `src/lib/` — data layer (`dayLogStore`, `dayLogHistory`, `authStore`, `supabaseClient`, `patternsAggregation`) + static reference config (`spheres`, `moodTechniques`, `reflectionTags`, `moodCategories`).
- `src/components/` — shared UI primitives + a few multi-use cards.
- `src/screens/` — one file per route; `intentionFlow/` holds the two-part (morning/evening) intention flow.
- `src/App.tsx` — full route tree + the three auth-guard components.
- `supabase/schema.sql` — reference copy of the deployed schema (see the Supabase section above for how it's actually applied).
