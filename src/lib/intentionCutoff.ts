// The optional daily cutoff time after which "Set today's intention"
// disables itself for the rest of the day — same today:* localStorage
// mechanism as onboardingFlag.ts/displayName.ts, kept as the synchronous
// source of truth deriveIntentionState() reads from. Also best-effort
// mirrored to Supabase user_metadata by authStore.tsx (same mechanism
// already used for display_name) so a real account carries the setting
// across devices; local storage doesn't need to know about that side.
const CUTOFF_TIME_KEY = 'today:intentionCutoffTime'

/** 24h "HH:mm" local time, or null if the user hasn't set one — no cutoff enforced, the same unrestricted behavior every existing user already has. */
export function getIntentionCutoffTime(): string | null {
  try {
    const stored = localStorage.getItem(CUTOFF_TIME_KEY)
    return stored && /^\d{2}:\d{2}$/.test(stored) ? stored : null
  } catch {
    return null
  }
}

/** Null clears the stored cutoff (removes the key) rather than persisting an empty string — same degradation pattern as displayName.ts's setDisplayName. */
export function setIntentionCutoffTime(time: string | null): void {
  try {
    if (time) {
      localStorage.setItem(CUTOFF_TIME_KEY, time)
    } else {
      localStorage.removeItem(CUTOFF_TIME_KEY)
    }
  } catch {
    // Ignore — a private-browsing/storage-disabled context just keeps the feature off, a reasonable degradation, not a crash.
  }
}

/** Plain hour/minute comparison — both `cutoffTime` and `now` are already local, no timezone math needed. */
export function isPastIntentionCutoff(cutoffTime: string, now: Date = new Date()): boolean {
  const [hours, minutes] = cutoffTime.split(':').map(Number)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= hours * 60 + minutes
}

/** "8:00 PM" style formatting for the explanatory message — reuses the browser's own locale time formatting rather than hand-rolling AM/PM logic. */
export function formatCutoffTime(cutoffTime: string): string {
  const [hours, minutes] = cutoffTime.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
