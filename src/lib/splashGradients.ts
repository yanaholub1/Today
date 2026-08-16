/**
 * Shared between `App.tsx`'s `AuthLoadingScreen` (the giant circle shown
 * while auth is still resolving — see that component's own doc comment)
 * and whichever real destination takes over once it resolves
 * (`OnboardingScreen`'s wordmark-dot splash, `BottomNav`'s check-in-FAB
 * splash) — same gradient on both sides of that handoff is what makes it
 * invisible. Centralized here rather than one screen importing the other's
 * constant, since neither owns the other.
 */
export const ONBOARDING_SPLASH_GRADIENT = 'linear-gradient(180deg, #F684C3, #F00A5B)'

// Same recipe as BottomNav's own `TAB_BAR_FAB_GRADIENT` — see that file's
// doc comment for why it's a different gradient from the onboarding one
// (different angle/stops, only the middle color shared) despite both
// living in the same pink/magenta family.
export const CHECKIN_FAB_SPLASH_GRADIENT = 'linear-gradient(141.09deg, #F00A5B 5.3298%, #F63176 51.345%, #FD5F97 105.03%)'
