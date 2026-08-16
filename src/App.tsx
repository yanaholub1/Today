import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import TokenPreview from './TokenPreview'
import ComponentLibraryPreview from './ComponentLibraryPreview'
import { TabLayout } from './layouts/TabLayout'
import { FlowLayout } from './layouts/FlowLayout'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { RegistrationScreen } from './screens/RegistrationScreen'
import { CheckInScreen } from './screens/CheckInScreen'
import { EntriesScreen } from './screens/EntriesScreen'
import { PatternsScreen } from './screens/PatternsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { IntentionFlowScreen } from './screens/IntentionFlowScreen'
import { MoodFlowScreen } from './screens/MoodFlowScreen'
import { DayDetailScreen } from './screens/DayDetailScreen'
import { DayLogStoreProvider, useDayLogStore } from './lib/dayLogStore'
import { AuthProvider, useAuth } from './lib/authStore'
import { useThemeColor } from './lib/useThemeColor'
import { CHECKIN_FAB_SPLASH_GRADIENT, ONBOARDING_SPLASH_GRADIENT } from './lib/splashGradients'
import { peekFirstLoadSplashAvailable } from './lib/firstLoadSplash'

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
 * `RequireRegistration` can render this screen again later in a session
 * (its `dayLogLoading` branch), and by then the FAB's own splash has
 * already played and has nothing left to hand off to — showing the circle
 * again there would be a flash with no landing, not a real loading beat.
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
 * `/` no longer renders a screen of its own (`CheckInGateScreen`, the old
 * mandatory full-screen hero-card gate, was removed entirely per Fix 30 —
 * the floating tab-bar button, via `CheckInMenuSheet`, is now the app's
 * only entry point into either flow). `/` is now a pure redirect: into
 * `/checkin` once signed in, into `/onboarding` otherwise. Needs to live
 * inside `AuthProvider` to read auth state, which is why it's a component
 * here rather than a plain ternary in `<Routes>` (that provider wraps
 * `<Routes>`, not the other way around) — same reasoning the old
 * `isRegistered`-based version of this component had.
 */
function RootRoute() {
  const { status } = useAuth()
  if (status === 'loading') return <AuthLoadingScreen />
  return <Navigate to={status === 'signedIn' ? '/checkin' : '/onboarding'} replace />
}

/**
 * Route guard for every screen that requires a signed-in user — Check-in,
 * Journal, Patterns, both task flows, the day-detail view, settings,
 * profile. Wraps the `TabLayout`/`FlowLayout` route groups as a single
 * outer layout route (no path of its own) rather than gating each leaf
 * route individually, so a new gated route added later just needs to sit
 * inside one of those two groups to be covered automatically. Stage 6
 * (Supabase/magic-link auth) swapped the old mock `isRegistered` flag for
 * real `useAuth()` status here — confirmed this guard's own shape didn't
 * need a rework, just a different source for the boolean, per the plan.
 *
 * Also waits on `dayLogStore`'s own `loading` flag before rendering the
 * app: without this, a screen could mount for one render with today's
 * data still empty (the fetch kicked off by the just-resolved `userId`
 * hasn't returned yet), which is enough for `IntentionFlowScreen`'s
 * once-at-mount `deriveIntentionState` gate to freeze on the wrong state.
 * Gating here, once, is simpler than threading a loading check into every
 * individual screen.
 */
function RequireRegistration() {
  const { status } = useAuth()
  const { loading: dayLogLoading } = useDayLogStore()
  if (status === 'loading') return <AuthLoadingScreen />
  if (status === 'signedOut') return <Navigate to="/onboarding" replace />
  if (dayLogLoading) return <AuthLoadingScreen />
  return <Outlet />
}

/**
 * Inverse guard for onboarding/registration themselves — once a user IS
 * signed in, reaching either of these routes again this session (e.g. a
 * stale bookmark, or tapping back) should land them back in the app, not
 * show the first-run flow a second time. Kept out of `OnboardingScreen`/
 * `RegistrationScreen` themselves (neither screen was meant to own this
 * check — see each screen's own doc comment) so both stay pure UI, no
 * store reads of their own beyond what they already need to submit.
 */
function RedirectIfRegistered({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'loading') return <AuthLoadingScreen />
  return status === 'signedIn' ? <Navigate to="/checkin" replace /> : <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <DayLogStoreProvider>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          {/* Bare routes, no layout — neither needs the tab bar or a task-flow header, each owns its whole viewport. Guarded by RedirectIfRegistered so a returning signed-in user skips straight back into the app. */}
          <Route
            path="/onboarding"
            element={
              <RedirectIfRegistered>
                <OnboardingScreen />
              </RedirectIfRegistered>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfRegistered>
                <RegistrationScreen />
              </RedirectIfRegistered>
            }
          />

          {/* Everything below requires a signed-in user — see RequireRegistration above. */}
          <Route element={<RequireRegistration />}>
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
