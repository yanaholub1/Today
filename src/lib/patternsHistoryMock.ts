import type { DayLogRecord, IntentionRecord, MoodCheckInRecord } from './dayLogStore'
import type { SphereId, EnergyLevel } from './spheres'
import { REFLECTION_TAGS } from './reflectionTags'
import { ALL_EMOTIONS } from './moodTechniques'
import { TECHNIQUES } from './moodTechniques'
import { QUADRANT_TO_MOOD_CATEGORY } from './moodCategories'
import { subDays } from './journalHistory'

/**
 * Patterns tab (Stage 5) has nothing to aggregate from: `useDayLogStore`
 * (Stage 4a/4b) only ever holds ONE in-memory day ("today"), same
 * limitation `EntriesScreen` already worked around with its own
 * screen-local `MOCK_PAST_LOGS_*` arrays rather than extending the shared
 * store's actual shape (see that screen's own doc comment). This file is
 * the same move for Patterns, at a scale that can actually exercise a
 * 7-day/30-day/3-month/all-time range control (Fix 25) — 150 days (~5
 * months), so "3 months" and "All time" are genuinely different slices,
 * not the same data relabeled.
 *
 * Reuses the store's own record types (`DayLogRecord`/`IntentionRecord`/
 * `MoodCheckInRecord`) rather than inventing parallel shapes, so
 * lib/patternsAggregation.ts can treat this mock history and today's real
 * store data identically (same fields, just concatenated).
 *
 * Generated with a small seeded PRNG (fixed seed, not `Math.random`) so
 * the dataset — and therefore every chart/ranking built on it — is
 * IDENTICAL across reloads. Distributions are deliberately weighted (not
 * uniform) per sphere/tag/technique so rankings/completion rates have real
 * spread (e.g. Health completes far more than Finances), and a few
 * scenarios are seeded explicitly rather than left to chance:
 *  - `homeEnvironment` and `finances` are given the lowest pick weight on
 *    purpose, so they reliably land under the 3-entry minimum-sample floor
 *    within shorter ranges (7/30 days) while still accumulating enough
 *    volume over "All time" to rank normally — exercising BOTH the
 *    "not enough data yet" state and the normal ranked state for the same
 *    spheres, just at different time ranges.
 *  - a same-day double/triple mood check-in is forced onto 3 specific
 *    recent days (see `FORCED_MULTI_MOOD_DAYS`) so the mood timeline's
 *    stacking behavior is checkable without hunting for a day the random
 *    draw happened to produce one.
 */

// Mulberry32 — tiny deterministic PRNG, fixed seed. Not cryptographic,
// just needs to be stable and fast for generating ~150 days of mock data.
function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260808)
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]
const chance = (p: number) => rand() < p

const TODAY = new Date()
const HISTORY_DAYS = 150

// Weighted per-sphere "how often does this sphere get picked, and how
// often does an intention in it end up glad=true" — deliberately uneven
// so both the frequency ranking (section 3) and completion-rate ranking
// (section 4) have real spread. `homeEnvironment`/`finances` are
// intentionally the rarest, to exercise the minimum-sample-size floor at
// shorter ranges (see file-level doc comment).
const SPHERE_WEIGHTS: { sphere: SphereId; pickWeight: number; gladRate: number }[] = [
  { sphere: 'health', pickWeight: 5, gladRate: 0.85 },
  { sphere: 'work', pickWeight: 4, gladRate: 0.5 },
  { sphere: 'personalGrowth', pickWeight: 3, gladRate: 0.7 },
  { sphere: 'family', pickWeight: 3, gladRate: 0.78 },
  { sphere: 'romance', pickWeight: 2, gladRate: 0.6 },
  { sphere: 'funHobbies', pickWeight: 2, gladRate: 0.9 },
  { sphere: 'finances', pickWeight: 1, gladRate: 0.3 },
  { sphere: 'homeEnvironment', pickWeight: 1, gladRate: 0.4 },
]
const SPHERE_POOL: SphereId[] = SPHERE_WEIGHTS.flatMap((s) => Array(s.pickWeight).fill(s.sphere))
const SPHERE_GLAD_RATE: Record<SphereId, number> = Object.fromEntries(SPHERE_WEIGHTS.map((s) => [s.sphere, s.gladRate])) as Record<SphereId, number>

// Weighted reflection tags — 'energy'/'plan'/'distractions'/'priority'
// recur often (the "usual suspects"), the rest show up occasionally, so
// the obstacle/helper frequency ranking has a clear top few, not a flat
// 9-way tie.
const TAG_POOL: string[] = [
  ...Array(6).fill('energy'),
  ...Array(5).fill('plan'),
  ...Array(5).fill('distractions'),
  ...Array(4).fill('priority'),
  ...Array(3).fill('deadline'),
  ...Array(3).fill('checkIn'),
  ...Array(2).fill('realisticPlan'),
  ...Array(2).fill('changes'),
  ...Array(1).fill('accountability'),
]

const ENERGY_POOL: EnergyLevel[] = ['low', 'low', 'medium', 'medium', 'medium', 'high']

// Techniques weighted so paced-breathing dominates usage (and mostly
// "helps"), a couple of others see moderate use with mixed results, and
// the rest are rare — plus a real share of check-ins skip a technique
// entirely (technique: null), matching the real flow's "Complete
// check-in"/"Skip practice" shortcuts.
const TECHNIQUE_USE_WEIGHTS: { id: string; weight: number; betterRate: number }[] = [
  { id: 'paced-breathing', weight: 6, betterRate: 0.85 },
  { id: 'nature-pause', weight: 4, betterRate: 0.7 },
  { id: 'expressive-writing', weight: 3, betterRate: 0.65 },
  { id: 'progressive-muscle-relaxation', weight: 3, betterRate: 0.5 },
  { id: 'gratitude-note', weight: 2, betterRate: 0.75 },
  { id: 'focused-attention', weight: 2, betterRate: 0.55 },
  { id: 'loving-kindness', weight: 1, betterRate: 0.6 },
]
const TECHNIQUE_POOL = TECHNIQUE_USE_WEIGHTS.flatMap((t) => Array(t.weight).fill(t.id))
const TECHNIQUE_BETTER_RATE: Record<string, number> = Object.fromEntries(TECHNIQUE_USE_WEIGHTS.map((t) => [t.id, t.betterRate]))

// Forces a 2-checkin and a 3-checkin day within the most recent week, so
// the mood timeline's "stack, don't average" behavior (Fix 25) is visible
// on every time range, including the default 7-day one, without relying
// on the random draw to have happened to produce one nearby.
const FORCED_MULTI_MOOD_DAYS: Record<number, number> = { 2: 3, 5: 2 } // offset-from-today -> checkin count

function buildDay(offsetFromToday: number) {
  const date = subDays(TODAY, offsetFromToday)
  const dateKey = date.toISOString().slice(0, 10)
  const dayLogId = `mock-day-${dateKey}`
  const energy = pick(ENERGY_POOL)

  const dayLog: DayLogRecord = {
    id: dayLogId,
    userId: 'mock-user',
    date: dateKey,
    energy,
    createdAt: date.toISOString(),
  }

  // 0-3 intentions/day (up to the Stage 4a cap of 3) — weighted toward
  // 1-2 so a 3-intention day reads as a genuinely full day, not the norm.
  const intentionCount = pick([0, 1, 1, 2, 2, 2, 3, 3])
  const intentions: IntentionRecord[] = Array.from({ length: intentionCount }, (_, i) => {
    const sphere = pick(SPHERE_POOL)
    const glad = chance(SPHERE_GLAD_RATE[sphere])
    const tag = pick(TAG_POOL)
    return {
      id: `${dayLogId}-intention-${i + 1}`,
      dayLogId,
      text: 'Mock past intention',
      sphere,
      position: (i + 1) as 1 | 2 | 3,
      glad,
      tag,
      note: null,
      reflectedAt: date.toISOString(),
    }
  })

  // 0-2 mood check-ins/day by default; a couple of specific recent days
  // are forced higher (see `FORCED_MULTI_MOOD_DAYS`) to guarantee a
  // visible same-day stack near the top of every time range.
  const moodCount = FORCED_MULTI_MOOD_DAYS[offsetFromToday] ?? pick([0, 1, 1, 1, 2, 2])
  const moodCheckIns: MoodCheckInRecord[] = Array.from({ length: moodCount }, (_, i) => {
    const { emotion, quadrant } = pick(ALL_EMOTIONS)
    const intensity = 1 + Math.floor(rand() * 5)
    const usesTechnique = chance(0.65)
    const technique = usesTechnique ? pick(TECHNIQUE_POOL) : null
    const better = technique ? chance(TECHNIQUE_BETTER_RATE[technique]) : chance(0.5)
    const liked = technique ? chance(0.6) : null
    // Spread same-day check-ins across the day so they sort in a stable,
    // plausible order (morning/midday/evening) rather than all sharing
    // one identical timestamp.
    const createdAt = new Date(date)
    createdAt.setHours(8 + i * 5)
    return {
      id: `${dayLogId}-mood-${i + 1}`,
      userId: 'mock-user',
      createdAt: createdAt.toISOString(),
      emotion,
      quadrant,
      intensity,
      technique,
      better,
      liked,
      note: null,
    }
  })

  return { dayLog, intentions, moodCheckIns }
}

export interface PatternsMockDay {
  dayLog: DayLogRecord
  intentions: IntentionRecord[]
  moodCheckIns: MoodCheckInRecord[]
}

/** Per-day bundles, most recent first (offsets 1..HISTORY_DAYS — yesterday back, never "today" itself, which comes from the live store instead). Range filtering (Fix 25) filters THIS array by `dayLog.date` first, then flattens, rather than filtering the 3 flat arrays independently with a separate date join. */
export const PATTERNS_MOCK_DAYS: PatternsMockDay[] = Array.from({ length: HISTORY_DAYS }, (_, i) => buildDay(i + 1))

// Re-exported so PatternsScreen/aggregation code doesn't need a second
// import just for this metadata.
export { TECHNIQUES, REFLECTION_TAGS, QUADRANT_TO_MOOD_CATEGORY }
