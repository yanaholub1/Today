// Whether this device has ever completed onboarding — the local
// replacement for "is registered," now that entering the app doesn't
// require a real Supabase account. Auth is PAUSED, not removed:
// authStore.tsx and the SignUp/SignInScreen components are untouched and
// still fully reachable at /sign-up and /sign-in — see App.tsx's own doc
// comments for how the entry flow no longer routes through them.
//
// `localStorage` (not sessionStorage, and not a module-level flag like
// firstLoadSplash.ts's own one-shot splash flag) is deliberate: this
// needs to survive real app restarts/reloads, not just persist within
// one tab session — the same persistence guarantee Supabase's own
// session token already relies on in this app (supabaseClient.ts), just
// under a separate, app-owned key so it can never be confused with, or
// accidentally cleared alongside, Supabase's own `sb-*` keys.
const ONBOARDING_COMPLETE_KEY = 'today:onboardingComplete'

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === '1'
  } catch {
    return false
  }
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, '1')
  } catch {
    // Ignore — a private-browsing/storage-disabled context just replays
    // onboarding on the next load, a reasonable degradation, not a crash.
  }
}

/** Explicit sign-out only (authStore.tsx) — since this flag, not real auth status, is what `RequireOnboarded`/`RootRoute` gate the whole app on, clearing it is what actually sends a signed-out user back to `/onboarding` rather than leaving them sitting in an app that just silently lost its data. */
export function clearOnboardingComplete(): void {
  try {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY)
  } catch {
    // Ignore, same degradation as markOnboardingComplete above.
  }
}
