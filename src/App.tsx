import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
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

/**
 * Registration fix — `/` no longer renders a screen of its own
 * (`CheckInGateScreen`, the old mandatory full-screen hero-card gate, was
 * removed entirely per Fix 30 — the floating tab-bar button, via
 * `CheckInMenuSheet`, is now the app's only entry point into either flow).
 * `/` is now a pure redirect: into `/checkin` once registered, into
 * `/onboarding` otherwise. Needs to live inside `DayLogStoreProvider` to
 * read the flag, which is why it's a component here rather than a plain
 * ternary in `<Routes>` (that provider wraps `<Routes>`, not the other
 * way around) — same reasoning the old version of this component had.
 */
function RootRoute() {
  const { isRegistered } = useDayLogStore()
  return <Navigate to={isRegistered ? '/checkin' : '/onboarding'} replace />
}

/**
 * Route guard for every screen that requires registration — Check-in,
 * Journal, Patterns, both task flows, the day-detail view, settings,
 * profile. Wraps the `TabLayout`/`FlowLayout` route groups as a single
 * outer layout route (no path of its own) rather than gating each leaf
 * route individually, so a new gated route added later just needs to sit
 * inside one of those two groups to be covered automatically. Stage 6
 * (Supabase/magic-link auth) should be able to swap `isRegistered` for
 * real auth state without touching this component at all.
 */
function RequireRegistration() {
  const { isRegistered } = useDayLogStore()
  return isRegistered ? <Outlet /> : <Navigate to="/onboarding" replace />
}

/**
 * Inverse guard for onboarding/registration themselves — once a user IS
 * registered, reaching either of these routes again this session (e.g. a
 * stale bookmark, or tapping back) should land them back in the app, not
 * show the first-run flow a second time. Kept out of `OnboardingScreen`/
 * `RegistrationScreen` themselves (neither screen was meant to own this
 * check — see each screen's own doc comment) so both stay pure UI, no
 * store reads of their own beyond what they already need to submit.
 */
function RedirectIfRegistered({ children }: { children: ReactNode }) {
  const { isRegistered } = useDayLogStore()
  return isRegistered ? <Navigate to="/checkin" replace /> : <>{children}</>
}

function App() {
  return (
    <DayLogStoreProvider>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        {/* Bare routes, no layout — neither needs the tab bar or a task-flow header, each owns its whole viewport. Guarded by RedirectIfRegistered so a returning registered user skips straight back into the app. */}
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

        {/* Everything below requires registration — see RequireRegistration above. */}
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
  )
}

export default App
