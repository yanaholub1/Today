import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import TokenPreview from './TokenPreview'
import ComponentLibraryPreview from './ComponentLibraryPreview'
import { TabLayout } from './layouts/TabLayout'
import { FlowLayout } from './layouts/FlowLayout'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { ReturningUserLoadingScreen } from './screens/ReturningUserLoadingScreen'
import { SignUpScreen } from './screens/SignUpScreen'
import { SignInScreen } from './screens/SignInScreen'
import { CheckInScreen } from './screens/CheckInScreen'
import { EntriesScreen } from './screens/EntriesScreen'
import { PatternsScreen } from './screens/PatternsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { IntentionFlowScreen } from './screens/IntentionFlowScreen'
import { MoodFlowScreen } from './screens/MoodFlowScreen'
import { DayDetailScreen } from './screens/DayDetailScreen'
import { DayLogStoreProvider } from './lib/dayLogStore'
import { AuthProvider, useAuth } from './lib/authStore'
import { useThemeColor } from './lib/useThemeColor'
import { CHECKIN_FAB_SPLASH_GRADIENT, ONBOARDING_SPLASH_GRADIENT } from './lib/splashGradients'
import { peekFirstLoadSplashAvailable } from './lib/firstLoadSplash'
import { hasCompletedOnboarding } from './lib/onboardingFlag'

/**
 * Shown only for the brief window before Supabase's initial `getSession()`
 * resolves (see authStore.tsx's own doc comment) — a real value beats a
 * blank flash of onboarding/app content while a persisted session is still
 * being confirmed.
 *
 * Review fix: this used to always be a plain white screen with a "Loading…"
 * label, regardless of what it was about to lead into — for a fresh,
 * signed-out visitor (the common case: no session yet, about to land on
 * Onboarding's own pink gradient), that meant a visible white-then-pink
 * flash, plus a label that only ever shows for well under a second and so
 * reads as a glitch more than a real loading state. Neither is needed:
 * Supabase persists a session to `localStorage` under a `sb-*-auth-token`
 * key, and that persisted value is there SYNCHRONOUSLY, before its own
 * `getSession()` call (an async round-trip through the SDK's internal
 * lock) resolves — so `hasPersistedSupabaseSession` below can make an
 * immediate, no-network guess at which background this screen should
 * already be, without waiting on `status` to leave `'loading'`. Wrong
 * guesses (a stale/expired token, or a session that fails to restore)
 * self-correct the moment `status` actually resolves and the parent guard
 * re-renders real content — this component never makes routing decisions,
 * only a cosmetic one. The same `#ffdcf5` swap OnboardingScreen itself
 * applies once mounted (`useThemeColor`) is applied speculatively here too
 * — otherwise the content would already read as pink while the mobile
 * status bar/toolbar chrome stayed white for this same brief window,
 * re-opening the exact seam that swap exists to close.
 */
function hasPersistedSupabaseSession(): boolean {
  try {
    return Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
  } catch {
    return false
  }
}

/**
 * The giant circle below is the same "fills the screen" opening beat
 * `useSplashCollapse` (src/lib/useSplashCollapse.ts) plays for whichever
 * real destination takes over once `status` resolves — `OnboardingScreen`
 * for a signed-out guess, `BottomNav`'s check-in FAB for a signed-in one —
 * so there's no gap where this screen's own background is visible without
 * a circle already covering it before the real one exists to hand off to.
 * Same gradient on both sides of that handoff (`splashGradients.ts`) is
 * what makes the swap invisible; this copy is a static, unanimated `vmax`
 * circle (no JS measurement needed — it never has to land anywhere, only
 * sit there giant until the real one takes over).
 *
 * Signed-in branch is additionally gated on `peekFirstLoadSplashAvailable()`
 * — unlike the signed-out branch (which is allowed to replay, matching
 * `OnboardingScreen`'s own on-revisit behavior), the check-in FAB's own
 * landing animation is a true first-load-only thing (`firstLoadSplash.ts`).
 *
 * Review fix: this component is now only ever reached via
 * `RedirectIfRegistered` (the dormant `/sign-up`/`/sign-in` routes — see
 * `RootRoute`'s own doc comment for why the primary flow no longer goes
 * through it at all) — its own doc comment there covers this screen's
 * current, narrower role; nothing else to update here.
 */
function AuthLoadingScreen() {
  const [pink] = useState(() => !hasPersistedSupabaseSession())
  const [showCircle] = useState(() => pink || peekFirstLoadSplashAvailable())
  useThemeColor(pink && '#ffdcf5')
  return (
    <div className="relative mx-auto h-screen w-full max-w-[393px]" style={{ background: pink ? 'linear-gradient(225deg, #ffdcf5 0%, #fff5fb 100%)' : 'white' }}>
      {showCircle && (
        // `fixed`, not `absolute` — on a viewport wider than this app's own
        // 393px column (e.g. desktop, testing in a browser window), an
        // `absolute` circle here would be clipped to the COLUMN's own
        // width by its `relative` parent, showing only a narrow vertical
        // sliver of the circle's gradient instead of covering the whole
        // screen. `fixed` positions against the viewport directly, same as
        // `useSplashCollapse`'s own overlay (OnboardingScreen/BottomNav) —
        // matching that, not a new pattern.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-1/2 left-1/2 rounded-full"
          style={{
            width: '250vmax',
            height: '250vmax',
            transform: 'translate(-50%, -50%)',
            backgroundImage: pink ? ONBOARDING_SPLASH_GRADIENT : CHECKIN_FAB_SPLASH_GRADIENT,
          }}
        />
      )}
    </div>
  )
}

/**
 * Single source of truth for `theme-color` across the whole app — review
 * fix: this used to be each pink-needing screen's own job (`OnboardingScreen`,
 * later `ReturningUserLoadingScreen` too) calling `useThemeColor('#ffdcf5')`
 * itself and relying on ITS OWN unmount to reset back to white. That broke
 * the moment a route could reach a non-splash screen WITHOUT ever mounting
 * the one component whose unmount did the resetting — exactly what
 * happened when the returning-user `/loading` path was added: it's a
 * DIFFERENT component from `OnboardingScreen`, so `OnboardingScreen`'s own
 * reset logic never ran for that path, leaving the pink splash default
 * (`index.html`'s own static `<meta>` value) stuck for the rest of the
 * session. Rather than also patching `ReturningUserLoadingScreen` (and
 * every future splash-like screen after it), theme-color is now driven
 * purely by the CURRENT ROUTE, decided in exactly one place: pink for
 * `/onboarding`/`/loading`, white for literally everything else,
 * regardless of which component happens to be mounted or how the user got
 * there. `OnboardingScreen`/`ReturningUserLoadingScreen` no longer call
 * `useThemeColor` themselves — this component is now the only caller for
 * both.
 *
 * Deliberately does NOT cover `/sign-up`/`/sign-in` — `AuthLoadingScreen`
 * below still owns its own SPECULATIVE pink/white guess there (based on
 * `hasPersistedSupabaseSession()`, not just the route), which this
 * component's own plain white default for "every other route" would
 * otherwise fight over the same meta tag. Rendered as an early sibling of
 * `<Routes>` (not nested inside it) specifically so React's own
 * children-before-parent/earlier-sibling-before-later effect ordering
 * settles this route's color FIRST, before `AuthLoadingScreen`'s own
 * (deeper, later) effect — letting AuthLoadingScreen's own more specific
 * guess win for as long as it's mounted, with no explicit coordination
 * needed between the two.
 */
const SPLASH_THEME_COLOR = '#ffdcf5'
const SPLASH_ROUTES = new Set(['/onboarding', '/loading'])

function ThemeColorByRoute() {
  const { pathname } = useLocation()
  useThemeColor(SPLASH_ROUTES.has(pathname) ? SPLASH_THEME_COLOR : undefined)
  return null
}

/**
 * `/` no longer renders a screen of its own (`CheckInGateScreen`, the old
 * mandatory full-screen hero-card gate, was removed entirely per Fix 30 —
 * the floating tab-bar button, via `CheckInMenuSheet`, is now the app's
 * only entry point into either flow). `/` is now a pure redirect: into
 * `/checkin` once this device has completed onboarding, into
 * `/onboarding` otherwise.
 *
 * Review fix — auth PAUSED, not removed: this used to redirect on
 * `useAuth()`'s real Supabase `status` (async, hence `AuthLoadingScreen`
 * while it resolved). Real accounts are on hold for now (Supabase's
 * email-sending rate limit was blocking testing) — entry is decided by
 * `hasCompletedOnboarding()` instead, a plain synchronous localStorage
 * read (`onboardingFlag.ts`), so there's no async window to fill with a
 * loading screen here anymore; the redirect just happens immediately.
 * `authStore.tsx`/`SignUpScreen`/`SignInScreen` are untouched and still
 * fully reachable at `/sign-up`/`/sign-in` (still gated by real auth, via
 * `RedirectIfRegistered` below) — this only changes how the PRIMARY entry
 * path decides where to send a visitor, not whether the auth system
 * itself still works if reached directly.
 *
 * Review fix — returning visitors now land on `/loading` (was
 * `/checkin` directly): see `ReturningUserLoadingScreen`'s own doc
 * comment for what plays there and why. New (never-onboarded) visitors
 * are unaffected — still `/onboarding`, unchanged.
 */
function RootRoute() {
  return <Navigate to={hasCompletedOnboarding() ? '/loading' : '/onboarding'} replace />
}

/**
 * Route guard for every screen that requires onboarding to be complete —
 * Check-in, Journal, Patterns, both task flows, the day-detail view,
 * settings, profile. Wraps the `TabLayout`/`FlowLayout` route groups as a
 * single outer layout route (no path of its own) rather than gating each
 * leaf route individually, so a new gated route added later just needs
 * to sit inside one of those two groups to be covered automatically.
 *
 * Review fix — replaces the old auth-based `RequireRegistration` (real
 * `useAuth()` status + a wait on `dayLogStore`'s own `loading` flag):
 * with no real sign-in in the primary flow anymore, `dayLogStore` always
 * has a `null` userId here, which it already handles as an intentional,
 * immediately-resolved empty state (no fetch to wait for, see that
 * file's own `useEffect`) — so there's no more async loading window to
 * gate on, and this reduces to the same plain synchronous
 * `hasCompletedOnboarding()` check `RootRoute` uses. Concretely: Check-in/
 * Journal/Patterns will render with no data and silently no-op on save
 * while this is the active flow (every write in `dayLogStore.tsx` already
 * early-returns on a `null` userId) — expected while auth is paused, not
 * a bug, but worth knowing if something looks like it "didn't save."
 */
function RequireOnboarded() {
  if (!hasCompletedOnboarding()) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/**
 * Inverse guard for the DORMANT `/sign-up`/`/sign-in` routes — unchanged
 * from before this file's onboarding-flag review fix (see `RootRoute`'s
 * own doc comment): still real, async `useAuth()` status, still exactly
 * what it did when these were the primary entry path. `/onboarding`
 * itself no longer uses this — see `RedirectIfOnboarded` below, its
 * flag-based counterpart — since sign-up/sign-in are reached only if
 * someone navigates there directly (nothing in the primary flow links to
 * them anymore); if auth is ever turned back into the primary flow, this
 * guard doesn't need to change, only what wraps it.
 */
function RedirectIfRegistered({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'loading') return <AuthLoadingScreen />
  return status === 'signedIn' ? <Navigate to="/checkin" replace /> : <>{children}</>
}

/**
 * Flag-based counterpart to `RedirectIfRegistered`, wrapping `/onboarding`
 * itself now (review fix — that used to be `RedirectIfRegistered` too,
 * before auth was paused as the primary flow's own gate; see
 * `RootRoute`'s doc comment for the full reasoning). Once this device HAS
 * completed onboarding, landing back on `/onboarding` (a stale bookmark,
 * tapping back, etc.) should skip straight back into the app, same
 * "don't show the first-run flow twice" intent as before, just driven by
 * the local flag instead of a real session.
 *
 * Review fix — Settings' own "Replay onboarding" needs to reach this same
 * route while the flag is (necessarily) already set, without the flag
 * itself changing (the next cold start must still skip straight to
 * `/checkin`). `navigate('/onboarding', { state: { replay: true } })`
 * marks that one navigation as an explicit replay via router location
 * state rather than a URL/localStorage change, so a stale bookmark or the
 * back button — anything that lands here WITHOUT that state — still
 * redirects away exactly as before.
 */
function RedirectIfOnboarded({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isReplay = (location.state as { replay?: boolean } | null)?.replay === true
  if (isReplay) return <>{children}</>
  return hasCompletedOnboarding() ? <Navigate to="/checkin" replace /> : <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <DayLogStoreProvider>
        <ThemeColorByRoute />
        <Routes>
          <Route path="/" element={<RootRoute />} />
          {/* Bare route, no layout — doesn't need the tab bar or a task-flow header, owns its whole viewport. Guarded by RedirectIfOnboarded so a returning visitor skips straight back into the app. */}
          <Route
            path="/onboarding"
            element={
              <RedirectIfOnboarded>
                <OnboardingScreen />
              </RedirectIfOnboarded>
            }
          />
          {/*
            DORMANT (review fix): real Supabase email/password auth,
            unhooked from the primary entry flow rather than deleted —
            see RootRoute's own doc comment for why, and note the
            resulting gap: nothing in the primary flow links here
            anymore, and a successful sign-in/sign-up no longer
            auto-navigates anywhere on its own, since the routing that
            used to do that (watching real auth `status`) has been
            replaced by the onboarding flag for the primary flow. Still
            fully reachable by URL, still real Supabase calls, still
            gated by RedirectIfRegistered exactly as before — untouched,
            just not part of any button's own navigation anymore.
          */}
          <Route
            path="/sign-up"
            element={
              <RedirectIfRegistered>
                <SignUpScreen />
              </RedirectIfRegistered>
            }
          />
          <Route
            path="/sign-in"
            element={
              <RedirectIfRegistered>
                <SignInScreen />
              </RedirectIfRegistered>
            }
          />

          {/* Everything below requires onboarding to be complete — see RequireOnboarded above. */}
          <Route element={<RequireOnboarded />}>
            {/* Bare route, same reasoning as /onboarding above — its own screen owns the whole viewport, no tab bar/flow header. */}
            <Route path="/loading" element={<ReturningUserLoadingScreen />} />

            {/* Tab screens — BottomNav is part of this layout, present the whole time. */}
            <Route element={<TabLayout />}>
              <Route path="/checkin" element={<CheckInScreen />} />
              <Route path="/entries" element={<EntriesScreen />} />
              <Route path="/patterns" element={<PatternsScreen />} />
            </Route>

            {/* Full-screen task flows + settings — no tab bar for the duration. */}
            <Route element={<FlowLayout />}>
              <Route path="/checkin/intention" element={<IntentionFlowScreen />} />
              <Route path="/checkin/mood" element={<MoodFlowScreen />} />
              <Route path="/day" element={<DayDetailScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
          </Route>

          {/* Stage 1/2 dev previews — kept reachable, not part of the app's real IA, deliberately NOT behind the registration guard so the component library stays browsable without going through the flow. */}
          <Route path="/tokens" element={<TokenPreview />} />
          <Route path="/components" element={<ComponentLibraryPreview />} />
        </Routes>
      </DayLogStoreProvider>
    </AuthProvider>
  )
}

export default App
