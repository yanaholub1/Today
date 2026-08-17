// The user's own optional display name — shown in the homepage greeting
// ("Good evening, Yana") when set, falling back to a plain time-based
// greeting when not. Stored the same way, and for the same reason, as
// the onboarding-seen flag (onboardingFlag.ts): this app now determines
// identity/personalization purely on-device, no Supabase account
// required (see App.tsx's own RootRoute doc comment for the fuller
// "auth paused" story) — `localStorage`, a separate app-owned key so it
// can't collide with Supabase's own `sb-*` keys or the onboarding flag's
// own key.
const DISPLAY_NAME_KEY = 'today:displayName'

export function getDisplayName(): string | null {
  try {
    const stored = localStorage.getItem(DISPLAY_NAME_KEY)
    return stored && stored.trim() ? stored : null
  } catch {
    return null
  }
}

/** Blank/whitespace-only clears the stored name (removes the key entirely) rather than persisting an empty string — `getDisplayName()` would treat either the same, but removing keeps localStorage itself clean. */
export function setDisplayName(name: string): void {
  try {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(DISPLAY_NAME_KEY, trimmed)
    } else {
      localStorage.removeItem(DISPLAY_NAME_KEY)
    }
  } catch {
    // Ignore — a private-browsing/storage-disabled context just keeps
    // the generic greeting, a reasonable degradation, not a crash.
  }
}
