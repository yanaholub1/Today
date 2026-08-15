import type { DayLog } from '../components/CompletionSummaryCard'

export function hasDayContent(log: Pick<DayLog, 'intention' | 'moodCheckIns'>): boolean {
  return !!log.intention || log.moodCheckIns.length > 0
}

/** Calendar day arithmetic (not just -24h) — mock data needs this to land on the intended date regardless of time-of-day. */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export interface MonthSection {
  label: string
  /** Descending date order (most recent first) — per spec, not Figma (these list nodes only show single cards, not a month grouping). */
  days: DayLog[]
}

/**
 * Picks the ONE month section shown below "Today" (Fix 22's own spec, not
 * from Figma): the current calendar month if it has at least one day with
 * content, otherwise the most recent PAST month that does — skipping any
 * empty months in between entirely, never showing an empty month header.
 * Returns null only if no past month has any content at all.
 *
 * Only ever surfaces one section — this stage doesn't build a scrolling
 * multi-month feed, so months further back than the one returned are
 * simply not looked at.
 */
export function pickMonthSection(pastDayLogs: DayLog[], today: Date): MonthSection | null {
  const contentDays = pastDayLogs.filter(hasDayContent)
  if (contentDays.length === 0) return null

  const byMonthKey = new Map<string, DayLog[]>()
  for (const log of contentDays) {
    const key = `${log.date.getFullYear()}-${log.date.getMonth()}`
    const bucket = byMonthKey.get(key)
    if (bucket) bucket.push(log)
    else byMonthKey.set(key, [log])
  }

  const monthsDescending = [...byMonthKey.values()].sort((a, b) => b[0].date.getTime() - a[0].date.getTime())

  const currentMonthDays = monthsDescending.find((days) => isSameMonth(days[0].date, today))
  const chosenDays = currentMonthDays ?? monthsDescending[0]

  chosenDays.sort((a, b) => b.date.getTime() - a.date.getTime())

  const monthDate = chosenDays[0].date
  const label = monthDate.getFullYear() === today.getFullYear() ? new Intl.DateTimeFormat('en-US', { month: 'long' }).format(monthDate) : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthDate)

  return { label, days: chosenDays }
}
