import type { DayLogRecord, IntentionRecord, MoodCheckInRecord } from './dayLogStore'
import type { SphereId, EnergyLevel } from './spheres'
import { SPHERES } from './spheres'
import type { MoodQuadrantId } from './moodCategories'
import { REFLECTION_TAGS } from './reflectionTags'
import { TECHNIQUES } from './moodTechniques'
import { subDays } from './journalHistory'
import type { PatternsMockDay } from './dayLogHistory'

/** Pure aggregation/filtering over the combined (today's live data + past-day history, both real Supabase rows as of Stage 6) record arrays — no rendering, no component state. Kept separate from PatternsScreen.tsx so that screen stays focused on layout. */

// ---------------------------------------------------------------------------
// Shared time range (Fix 25) — the one control that filters every section.
// ---------------------------------------------------------------------------

/**
 * Review fix — replaces the earlier 4-way '7d'/'30d'/'3m'/'all' range with
 * exactly the 3 options the new spec calls for: a rolling 7-day window, a
 * SPECIFIC calendar month (picked via the quick-filter row, not a rolling
 * 30-day window like the old '30d'), and all-time. Default is 'all' (also
 * per spec — see PatternsScreen.tsx).
 */
export type PatternsTimeRange = '7d' | 'month' | 'all'

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function isSameCalendarMonth(date: Date, monthRef: Date): boolean {
  return date.getFullYear() === monthRef.getFullYear() && date.getMonth() === monthRef.getMonth()
}

function isWithinRange(dateKey: string, range: PatternsTimeRange, selectedWeekStart: Date, selectedMonth: Date): boolean {
  const date = startOfDay(new Date(dateKey))
  if (range === '7d') {
    const weekEnd = subDays(selectedWeekStart, -6)
    return date.getTime() >= selectedWeekStart.getTime() && date.getTime() <= weekEnd.getTime()
  }
  if (range === 'month') return isSameCalendarMonth(date, selectedMonth)
  return true // 'all'
}

export interface PatternsDataset {
  dayLogs: DayLogRecord[]
  intentions: IntentionRecord[]
  moodCheckIns: MoodCheckInRecord[]
}

/**
 * Filters the fetched day-log history (`mockDays` — real rows as of Stage
 * 6, see `dayLogHistory.ts`) by the selected time range and merges in
 * today's real data from the live store. Filters
 * at the DAY level first (each mock day already bundles its own
 * `dayLog`/`intentions`/`moodCheckIns` together), then flattens — rather
 * than filtering the 3 arrays independently, which would need a separate
 * `dayLogId` → date join for intentions (they don't carry their own date).
 *
 * `selectedWeekStart`/`selectedMonth` only matter for their own matching
 * range ('7d'/'month' respectively) — ignored otherwise, so callers can
 * always pass their current picker state without branching. Review fix:
 * '7d' is no longer always "the 7 days ending today" — 327:4998 shows
 * multiple swipeable week tabs, so `selectedWeekStart` is real picker
 * state now (see `buildAvailableWeeks`), not derived from `now`.
 */
export function buildPatternsDataset(
  mockDays: PatternsMockDay[],
  liveToday: PatternsMockDay | null,
  range: PatternsTimeRange,
  selectedWeekStart: Date,
  selectedMonth: Date,
): PatternsDataset {
  const filteredMock = mockDays.filter((d) => isWithinRange(d.dayLog.date, range, selectedWeekStart, selectedMonth))
  const days = liveToday ? [liveToday, ...filteredMock] : filteredMock
  return {
    dayLogs: days.map((d) => d.dayLog),
    intentions: days.flatMap((d) => d.intentions),
    moodCheckIns: days.flatMap((d) => d.moodCheckIns),
  }
}

export interface MonthOption {
  /** `"<year>-<0-indexed month>"`, stable across re-renders — used as both a Map key and a React list key. */
  key: string
  /** The 1st of that month, local time — what the picker actually stores/compares by. */
  date: Date
  label: string
}

/**
 * Review fix — the quick-filter row's month tabs (part 2 of the brief).
 * Deliberately built from the FULL, un-range-filtered day-log history
 * (mock + live), not `PatternsDataset` — the whole point is to list every
 * month that HAS data regardless of whatever range is currently selected,
 * so switching to "Month" always offers a real, populated set of tabs
 * rather than being circularly filtered by itself. Most-recent-first;
 * label is short-month ("Aug") for the current year, short-month + year
 * for prior years — the same year-aware pattern `journalHistory.ts`'s
 * `pickMonthSection` already uses for its own section headers, just the
 * `short` (not `long`) month form since this renders as a compact tab
 * row, not a page heading.
 */
export function buildAvailableMonths(mockDays: PatternsMockDay[], liveToday: PatternsMockDay | null, now: Date = new Date()): MonthOption[] {
  const days = liveToday ? [liveToday, ...mockDays] : mockDays
  const seen = new Map<string, Date>()
  for (const d of days) {
    const date = new Date(d.dayLog.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (!seen.has(key)) seen.set(key, new Date(date.getFullYear(), date.getMonth(), 1))
  }
  return [...seen.entries()]
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(([key, date]) => ({
      key,
      date,
      label:
        date.getFullYear() === now.getFullYear()
          ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
          : new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date),
    }))
}

/**
 * A date-span quick-filter tab's own label (e.g. "AUG 10 – 16"), verified
 * against 323:3948/327:4998/329:5398 — same-month spans only show the
 * month abbreviation once; a span crossing a month boundary repeats it
 * for the end date. Generalized (review fix) beyond just "the current
 * 7-day window" — also drives each swipeable week tab's own label
 * (`buildAvailableWeeks`) and the single "All time" tab's full-span label
 * (computed by the caller from its own already-filtered dataset).
 */
export function formatDateRangeLabel(start: Date, end: Date): string {
  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start).toUpperCase()
  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(end).toUpperCase()
  return startMonth === endMonth ? `${startMonth} ${start.getDate()} – ${end.getDate()}` : `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`
}

export interface WeekOption {
  /** Index-based, stable across re-renders (0 = the 7 days ending today). */
  key: string
  /** Start of this window, local time — what the picker actually stores/compares by. */
  start: Date
  label: string
}

/**
 * Review fix (part 4) — 327:4998 shows the '7d' range as swipeable week
 * tabs, not a single static label like the earlier pass assumed. Returns
 * `count` non-overlapping, most-recent-first 7-day windows ending on
 * `now`'s own day. Unlike `buildAvailableMonths`, this doesn't filter down
 * to windows that actually have data — the old seeded mock history was
 * dense enough that every recent week had something in it, so this never
 * needed the extra pass; a real (sparser) user's history can now surface
 * a week tab with nothing in it, same as any other range/filter combo
 * with too little data (each section's own `EmptyState`/`MIN_SAMPLE_SIZE`
 * handling already covers that, unchanged).
 */
export function buildAvailableWeeks(now: Date = new Date(), count = 6): WeekOption[] {
  const todayStart = startOfDay(now)
  const options: WeekOption[] = []
  for (let i = 0; i < count; i++) {
    const end = subDays(todayStart, i * 7)
    const start = subDays(end, 6)
    options.push({ key: `${i}`, start, label: formatDateRangeLabel(start, end) })
  }
  return options
}

// ---------------------------------------------------------------------------
// Section 2 — Energy over time
// ---------------------------------------------------------------------------

const ENERGY_VALUE: Record<EnergyLevel, number> = { low: 1, medium: 2, high: 3 }

export interface EnergyTrendPoint {
  date: Date
  energy: EnergyLevel
  value: number // 1-3, for charting
}

/** One point per day that actually has an energy value, oldest first. Days with no `dayLog`/energy (nothing logged that day) are simply absent — not zero-filled — since a gap is a real "nothing recorded" state, not a low value. */
export function buildEnergyTrend(dayLogs: DayLogRecord[]): EnergyTrendPoint[] {
  return dayLogs
    .filter((log): log is DayLogRecord & { energy: EnergyLevel } => log.energy !== null)
    .map((log) => ({ date: new Date(log.date), energy: log.energy, value: ENERGY_VALUE[log.energy] }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// ---------------------------------------------------------------------------
// Section 1 — Mood over time (a stacked-dot timeline, not an averaged line)
// ---------------------------------------------------------------------------

export interface MoodTimelineEntry {
  quadrant: MoodQuadrantId
  createdAt: string
}

export interface MoodTimelineBucket {
  key: string
  label: string
  date: Date
  entries: MoodTimelineEntry[]
}

/**
 * One bucket per calendar day for the 7-day/30-day ranges (a real
 * day-by-day timeline, matching the brief's own "positioned by day").
 * Multiple check-ins on the same day are NOT averaged into one mark —
 * every entry survives into `bucket.entries`, in chronological order,
 * for the caller to stack visually.
 *
 * For 3-month/all-time, bucketing to 1 day/column would mean 90+ (or, at
 * this mock dataset's full ~150-day span, ~150) columns — not pixel-
 * specified by the brief, which explicitly says to use judgment here, so
 * this widens the bucket instead of rendering that many day-columns:
 * 7 days/bucket ("weekly") for 3 months (~13 columns), 14 days/bucket
 * ("fortnightly") for all-time (scales with however much history exists,
 * rather than a hardcoded column count). Entries within a wider bucket
 * still all survive individually (still "stacked, not averaged") — the
 * bucket just represents a wider slice of the calendar, not a coarser
 * summary of its contents.
 */
export function buildMoodTimeline(moodCheckIns: MoodCheckInRecord[], range: PatternsTimeRange, now: Date = new Date()): MoodTimelineBucket[] {
  // Not currently wired into PatternsScreen (Review fix moved "Mood over
  // time" out of the Intention subtab pending the Mood subtab's own
  // spec) — kept compiling against the new 3-value range type so it's
  // ready to reuse once that spec lands, rather than deleted.
  const bucketDays = range === '7d' ? 1 : range === 'month' ? 7 : 14
  const todayStart = startOfDay(now)

  let totalDays: number
  if (range === '7d') totalDays = 7
  else if (range === 'month') totalDays = 31
  else {
    // 'all' — span from the oldest check-in actually present to today, so
    // the timeline's own length tracks however much history actually
    // exists rather than a hardcoded constant.
    const oldestMs = moodCheckIns.length > 0 ? Math.min(...moodCheckIns.map((e) => startOfDay(new Date(e.createdAt)).getTime())) : todayStart.getTime()
    totalDays = Math.max(1, Math.round((todayStart.getTime() - oldestMs) / 86400000) + 1)
  }
  const bucketCount = Math.max(1, Math.ceil(totalDays / bucketDays))

  const grouped = new Map<number, MoodCheckInRecord[]>()
  for (const entry of moodCheckIns) {
    const offsetDays = Math.floor((todayStart.getTime() - startOfDay(new Date(entry.createdAt)).getTime()) / 86400000)
    if (offsetDays < 0 || offsetDays >= totalDays) continue
    const bucketIndex = Math.floor(offsetDays / bucketDays)
    const arr = grouped.get(bucketIndex) ?? []
    arr.push(entry)
    grouped.set(bucketIndex, arr)
  }

  const buckets: MoodTimelineBucket[] = []
  for (let bucketIndex = bucketCount - 1; bucketIndex >= 0; bucketIndex--) {
    const bucketEnd = subDays(todayStart, bucketIndex * bucketDays)
    const bucketStart = subDays(todayStart, bucketIndex * bucketDays + bucketDays - 1)
    const label = bucketDays === 1 ? new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(bucketEnd) : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(bucketStart)
    const entries = (grouped.get(bucketIndex) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    buckets.push({ key: `${bucketIndex}`, label, date: bucketEnd, entries: entries.map((e) => ({ quadrant: e.quadrant, createdAt: e.createdAt })) })
  }
  return buckets
}

// ---------------------------------------------------------------------------
// Section 3 — Life areas prioritized (pure frequency, no rate)
// ---------------------------------------------------------------------------

export interface SphereFrequencyStat {
  sphere: SphereId
  count: number
}

/** How often each sphere was picked for an intention, most-picked first. Spheres never picked in the selected range are simply absent — this is "what you prioritized," not a fixed roster (that's section 4's job). */
export function buildSphereFrequency(intentions: IntentionRecord[]): SphereFrequencyStat[] {
  const counts = new Map<SphereId, number>()
  for (const intention of intentions) counts.set(intention.sphere, (counts.get(intention.sphere) ?? 0) + 1)
  return [...counts.entries()]
    .map(([sphere, count]) => ({ sphere, count }))
    .sort((a, b) => b.count - a.count)
}

// ---------------------------------------------------------------------------
// Section 4 — Performance per life area (ALL 8, with a sample-size floor)
// ---------------------------------------------------------------------------

/** Applied wherever a rate/percentage is shown (explicitly sections 3&4 of the brief — in practice just section 4 here, since section 3 is a plain count, not a rate, and section 6 shows counts too). Below this many logged intentions, a sphere's own completion rate isn't shown as a ranked result. */
export const MIN_SAMPLE_SIZE = 3

export interface SpherePerformanceStat {
  sphere: SphereId
  total: number
  completed: number
  rate: number // 0-1
  enoughData: boolean
  /** `glad` per REFLECTED intention for this sphere, in the order they were logged — drives the "How it went" card's row of filled/outline circles (review fix). Same length as `total`. */
  outcomes: boolean[]
}

/**
 * Completion (`glad === true`) rate per life sphere — ALL 8 spheres
 * always appear (explicit direct request: an 8-area roster shouldn't have
 * an arbitrary top/bottom cutoff), regardless of whether they were used
 * in the selected range at all. Spheres at/above `MIN_SAMPLE_SIZE` are
 * ranked by rate, descending, and sort ahead of every under-sampled
 * sphere — the under-sampled ones are listed after, but NOT ranked
 * against each other by rate (their rate isn't reliable enough to rank
 * by), just by raw volume so the list order is still stable.
 *
 * Review fix: `total`/`completed`/`outcomes` now only count REFLECTED
 * intentions (`glad !== null`) — an unreflected intention no longer
 * silently counts as "not completed" in the denominator. This is a real
 * semantic change from the original bar-chart version (which counted
 * every logged intention regardless of reflection status), required by
 * the new "How it went" card's own display: a row of one circle per
 * REFLECTED outcome plus an "N Went well • M Not really" count that must
 * sum to `total` — neither reads correctly if unreflected intentions are
 * mixed into the denominator. `MIN_SAMPLE_SIZE` is unchanged (3), just now
 * applied to this reflected count instead.
 */
export function buildSpherePerformance(intentions: IntentionRecord[]): SpherePerformanceStat[] {
  const stats = new Map<SphereId, { total: number; completed: number; outcomes: boolean[] }>()
  for (const sphereId of Object.keys(SPHERES) as SphereId[]) stats.set(sphereId, { total: 0, completed: 0, outcomes: [] })
  for (const intention of intentions) {
    if (intention.glad === null) continue
    const s = stats.get(intention.sphere)!
    s.total += 1
    s.outcomes.push(intention.glad)
    if (intention.glad) s.completed += 1
  }
  const all = [...stats.entries()].map(([sphere, s]) => ({
    sphere,
    total: s.total,
    completed: s.completed,
    rate: s.total > 0 ? s.completed / s.total : 0,
    enoughData: s.total >= MIN_SAMPLE_SIZE,
    outcomes: s.outcomes,
  }))
  const enough = all.filter((s) => s.enoughData).sort((a, b) => b.rate - a.rate)
  const thin = all.filter((s) => !s.enoughData).sort((a, b) => b.total - a.total)
  return [...enough, ...thin]
}

// ---------------------------------------------------------------------------
// Section 5 — What helps / gets in the way (overall, or filtered by sphere)
// ---------------------------------------------------------------------------

export interface TagFrequency {
  tagId: string
  obstacleLabel: string
  helperLabel: string
  obstacleCount: number
  helperCount: number
  total: number
}

/**
 * Obstacle vs. helper counts per reflection tag, from every REFLECTED
 * intention (`glad` non-null) — optionally narrowed to a single sphere
 * first (`sphereFilter`), matching the ONE flexible view the brief asks
 * for ("Overall" = no filter) rather than 8 pre-built per-area sections.
 * `glad === false` counts toward that tag's `obstacleCount`, `glad ===
 * true` toward `helperCount` — the SAME tag id either way (REFLECTION_TAGS'
 * own 1:1 obstacle/helper pairing), so the two counts are directly
 * comparable per the brief's own requirement. Sorted by total frequency
 * (obstacle+helper) descending. Tags with zero occurrences are left out.
 */
export function buildTagFrequency(intentions: IntentionRecord[], sphereFilter?: SphereId | null): TagFrequency[] {
  const relevant = sphereFilter ? intentions.filter((i) => i.sphere === sphereFilter) : intentions
  const counts = new Map<string, { obstacle: number; helper: number }>()
  for (const intention of relevant) {
    if (!intention.tag || intention.glad === null) continue
    const entry = counts.get(intention.tag) ?? { obstacle: 0, helper: 0 }
    if (intention.glad) entry.helper += 1
    else entry.obstacle += 1
    counts.set(intention.tag, entry)
  }
  return REFLECTION_TAGS.filter((pair) => counts.has(pair.id))
    .map((pair) => {
      const { obstacle, helper } = counts.get(pair.id)!
      return { tagId: pair.id, obstacleLabel: pair.obstacle, helperLabel: pair.helper, obstacleCount: obstacle, helperCount: helper, total: obstacle + helper }
    })
    .sort((a, b) => b.total - a.total)
}

export interface LabeledCount {
  tagId: string
  label: string
  count: number
}

export interface HelperObstacleLists {
  helpers: LabeledCount[]
  obstacles: LabeledCount[]
}

/**
 * Review fix — 323:3948's "Helpers and obstacles" card ranks helpers and
 * obstacles as two INDEPENDENT top-N lists (its own example shows 3
 * helpers and 3 obstacles drawn from 6 different underlying tag ids, not
 * 3 shared pairs) rather than `buildTagFrequency`'s paired dual-bar rows
 * (still exported above, unused for now — kept in case a future spec
 * wants the paired view again). Reuses that same function's own per-tag
 * counting logic/REFLECTION_TAGS source, just split into 2 flat,
 * independently-sorted lists instead of 1 list of pairs.
 */
export function buildHelperObstacleLists(intentions: IntentionRecord[], sphereFilter?: SphereId | null): HelperObstacleLists {
  const relevant = sphereFilter ? intentions.filter((i) => i.sphere === sphereFilter) : intentions
  const helperCounts = new Map<string, number>()
  const obstacleCounts = new Map<string, number>()
  for (const intention of relevant) {
    if (!intention.tag || intention.glad === null) continue
    const target = intention.glad ? helperCounts : obstacleCounts
    target.set(intention.tag, (target.get(intention.tag) ?? 0) + 1)
  }
  const toList = (counts: Map<string, number>, labelFor: (id: string) => string | undefined): LabeledCount[] =>
    [...counts.entries()]
      .map(([tagId, count]) => ({ tagId, label: labelFor(tagId) ?? tagId, count }))
      .sort((a, b) => b.count - a.count)
  return {
    helpers: toList(helperCounts, (id) => REFLECTION_TAGS.find((t) => t.id === id)?.helper),
    obstacles: toList(obstacleCounts, (id) => REFLECTION_TAGS.find((t) => t.id === id)?.obstacle),
  }
}

// ---------------------------------------------------------------------------
// Section 6 — Techniques that helped vs. didn't (separate from section 5 —
// this is about mood_checkins' own technique/`better` fields, not
// intentions' sphere/tag fields)
// ---------------------------------------------------------------------------

export interface TechniqueOutcome {
  techniqueId: string
  label: string
  count: number
}

export interface TechniqueOutcomes {
  helped: TechniqueOutcome[]
  didntHelp: TechniqueOutcome[]
}

/**
 * Two independent rankings — techniques used where `better === true`, and
 * techniques used where `better === false` — driven directly by the
 * `better` boolean on `mood_checkins` grouped by `technique`, per the
 * brief's own description. A raw count, not a percentage/chart: at the
 * scale of ~7 possible techniques (Stage 4b's own quadrant→tag mapping),
 * a simple two-list ranking reads faster than a chart would. Check-ins
 * with no technique, or an unanswered "Do you feel better?" (`better ===
 * null`), don't count toward either list.
 */
export function buildTechniqueOutcomes(moodCheckIns: MoodCheckInRecord[]): TechniqueOutcomes {
  const helpedCounts = new Map<string, number>()
  const didntCounts = new Map<string, number>()
  for (const entry of moodCheckIns) {
    if (!entry.technique || entry.better === null) continue
    const target = entry.better ? helpedCounts : didntCounts
    target.set(entry.technique, (target.get(entry.technique) ?? 0) + 1)
  }
  const toList = (counts: Map<string, number>): TechniqueOutcome[] =>
    TECHNIQUES.filter((t) => counts.has(t.id))
      .map((t) => ({ techniqueId: t.id, label: t.label, count: counts.get(t.id)! }))
      .sort((a, b) => b.count - a.count)
  return { helped: toList(helpedCounts), didntHelp: toList(didntCounts) }
}

// ---------------------------------------------------------------------------
// Mood subtab — Mood Tracker card (3 view-states, one per time-range value)
// ---------------------------------------------------------------------------

export interface MoodWeekEntry {
  id: string
  emotion: string
  quadrant: MoodQuadrantId
}

export interface MoodWeekRow {
  key: string
  date: Date
  dayLabel: string
  dateLabel: string
  entries: MoodWeekEntry[]
}

/**
 * '7d' view (323:4461) — one row per day of the selected week (always 7,
 * `selectedWeekStart`..+6, oldest first, matching the node's own Mon→Sun
 * order), each carrying every check-in logged that calendar day with its
 * real emotion word (unlike `buildMoodTimeline`, which only keeps
 * `quadrant` — this view's own "today" row needs the actual word, e.g.
 * "Upset"). Same-day check-ins are NOT averaged, same principle as
 * `buildMoodTimeline`.
 */
export function buildMoodWeekRows(moodCheckIns: MoodCheckInRecord[], weekStart: Date): MoodWeekRow[] {
  const start = startOfDay(weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(start, -i)
    const entries = moodCheckIns
      .filter((e) => startOfDay(new Date(e.createdAt)).getTime() === date.getTime())
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((e) => ({ id: e.id, emotion: e.emotion, quadrant: e.quadrant }))
    return {
      key: `${i}`,
      date,
      dayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      dateLabel: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date).toUpperCase(),
      entries,
    }
  })
}

export interface MoodMonthCell {
  day: number
  date: Date
  quadrants: MoodQuadrantId[]
}

export interface MoodMonthGrid {
  /** Empty cells before day 1, so day 1 lands under its real Mon-Sun weekday column. */
  leadingBlanks: number
  cells: MoodMonthCell[]
}

/**
 * 'month' view (312:2980) — a full calendar grid for `monthRef`'s own
 * month, Monday-first (JS `Date.getDay()` is Sunday-first, `0`, so the
 * leading-blank count is `(getDay() + 6) % 7` to convert). Each real day
 * carries every check-in's quadrant that fell on it (icons only in this
 * view — no emotion words, per the node).
 */
export function buildMoodMonthGrid(moodCheckIns: MoodCheckInRecord[], monthRef: Date): MoodMonthGrid {
  const year = monthRef.getFullYear()
  const month = monthRef.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7

  const byDay = new Map<number, MoodQuadrantId[]>()
  for (const entry of moodCheckIns) {
    const d = new Date(entry.createdAt)
    if (d.getFullYear() !== year || d.getMonth() !== month) continue
    const arr = byDay.get(d.getDate()) ?? []
    arr.push(entry.quadrant)
    byDay.set(d.getDate(), arr)
  }

  const cells: MoodMonthCell[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    return { day, date: new Date(year, month, day), quadrants: byDay.get(day) ?? [] }
  })
  return { leadingBlanks, cells }
}

export interface TopEmotionStat {
  emotion: string
  quadrant: MoodQuadrantId
  count: number
}

/**
 * 'all' view (323:2233) — the most-logged individual emotion words,
 * ranked by frequency. Each emotion word maps to exactly one quadrant
 * (`ALL_EMOTIONS`'s own fixed partition — ../lib/moodTechniques.ts), so
 * counting by word alone is unambiguous; the quadrant just comes along
 * for its color. `limit` isn't a "show more" cap (no such control exists
 * on this card) — just how many rows this view renders.
 */
export function buildTopEmotions(moodCheckIns: MoodCheckInRecord[], limit = 6): TopEmotionStat[] {
  const counts = new Map<string, { quadrant: MoodQuadrantId; count: number }>()
  for (const entry of moodCheckIns) {
    const existing = counts.get(entry.emotion)
    if (existing) existing.count += 1
    else counts.set(entry.emotion, { quadrant: entry.quadrant, count: 1 })
  }
  return [...counts.entries()]
    .map(([emotion, v]) => ({ emotion, quadrant: v.quadrant, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
