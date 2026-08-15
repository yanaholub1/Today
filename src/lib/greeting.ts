/** Hour of day (24h, local time) at which the app considers evening to have arrived. Shared by the greeting and, later, the Intention card's real state logic (Stage 4) — kept as one constant so they can't drift apart. Not yet user-configurable; the brief calls that a later nice-to-have. */
export const EVENING_HOUR = 18

export function isEvening(date: Date = new Date()): boolean {
  return date.getHours() >= EVENING_HOUR
}

/** Binary "Good morning" / "Good evening" per the brief — no afternoon variant. */
export function getGreeting(date: Date = new Date()): string {
  return isEvening(date) ? 'Good evening' : 'Good morning'
}
