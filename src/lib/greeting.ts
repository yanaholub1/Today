/** Hour of day (24h, local time) at which the app considers evening to have arrived. Shared by the greeting and, later, the Intention card's real state logic (Stage 4) — kept as one constant so they can't drift apart. Not yet user-configurable; the brief calls that a later nice-to-have. */
export const EVENING_HOUR = 18

export function isEvening(date: Date = new Date()): boolean {
  return date.getHours() >= EVENING_HOUR
}

/**
 * Binary "Good morning" / "Good evening" per the brief — no afternoon
 * variant. `name` is optional (review fix — was always appended as a
 * hardcoded `MOCK_USER_NAME` by each caller): when set, appended as
 * "Good evening, Yana"; when not, the plain time-based greeting alone.
 * Owns the FULL string (not just the time-based prefix) specifically so
 * the two call sites (CheckInScreen.tsx, EntriesScreen.tsx) don't each
 * repeat their own "look up the name, conditionally append a comma"
 * logic — one shared place for it instead.
 */
export function getGreeting(name?: string | null, date: Date = new Date()): string {
  const base = isEvening(date) ? 'Good evening' : 'Good morning'
  return name ? `${base}, ${name}` : base
}
