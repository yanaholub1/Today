import { supabase } from './supabaseClient'
import { dateKey, localDayBounds, mapDayLog, mapIntention, mapMoodCheckIn } from './dayLogStore'
import type { DayLogRecord, DayLogRow, IntentionRecord, IntentionRow, MoodCheckInRecord, MoodCheckInRow } from './dayLogStore'

/** One day's full data, grouped — the common shape both `EntriesScreen`'s Journal history and `PatternsScreen`'s aggregation feed off, each adapting it to their own display/aggregation shape locally. */
export interface DayBundle {
  date: string // YYYY-MM-DD, local
  dayLog: DayLogRecord | null
  intentions: IntentionRecord[]
  moodCheckIns: MoodCheckInRecord[]
}

/**
 * Every day BEFORE today with real data, most recent first — "today" itself
 * always comes from the live `useDayLogStore()` instead, same split the old
 * mock history data had (see `EntriesScreen.tsx`/`PatternsScreen.tsx`'s own
 * doc comments: neither screen's history section reads from this store's
 * "today," it's the live context that owns that).
 *
 * A day can have a `day_logs` row with no mood check-ins, mood check-ins
 * with no `day_logs` row (mood-only day), or both — grouping has to handle
 * all three, so mood check-ins are bucketed by their own LOCAL calendar
 * date (via `dateKey`) independently of whichever `day_logs` rows exist,
 * then merged.
 */
export async function fetchPastDayBundles(userId: string): Promise<DayBundle[]> {
  const todayKey = dateKey(new Date())
  const { startIso: todayStartIso } = localDayBounds(new Date())

  const [dayLogsRes, moodRes] = await Promise.all([
    supabase.from('day_logs').select('*').eq('user_id', userId).lt('date', todayKey).order('date', { ascending: false }).returns<DayLogRow[]>(),
    supabase.from('mood_checkins').select('*').eq('user_id', userId).lt('created_at', todayStartIso).order('created_at', { ascending: false }).returns<MoodCheckInRow[]>(),
  ])
  if (dayLogsRes.error) console.error('Failed to load past day logs', dayLogsRes.error)
  if (moodRes.error) console.error('Failed to load past mood check-ins', moodRes.error)

  const dayLogRows = dayLogsRes.data ?? []
  const moodRows = moodRes.data ?? []

  const dayLogIds = dayLogRows.map((r) => r.id)
  const intentionRes = dayLogIds.length > 0 ? await supabase.from('intentions').select('*').in('day_log_id', dayLogIds).returns<IntentionRow[]>() : null
  if (intentionRes?.error) console.error('Failed to load past intentions', intentionRes.error)
  const intentionRows = intentionRes?.data ?? []

  const intentionsByDayLogId = new Map<string, IntentionRecord[]>()
  for (const row of intentionRows) {
    const mapped = mapIntention(row)
    const list = intentionsByDayLogId.get(mapped.dayLogId) ?? []
    list.push(mapped)
    intentionsByDayLogId.set(mapped.dayLogId, list)
  }

  const moodsByDateKey = new Map<string, MoodCheckInRecord[]>()
  for (const row of moodRows) {
    const mapped = mapMoodCheckIn(row)
    const key = dateKey(new Date(mapped.createdAt))
    const list = moodsByDateKey.get(key) ?? []
    list.push(mapped)
    moodsByDateKey.set(key, list)
  }

  const bundles: DayBundle[] = []
  const seenDateKeys = new Set<string>()

  for (const row of dayLogRows) {
    const dayLog = mapDayLog(row)
    const dayIntentions = (intentionsByDayLogId.get(dayLog.id) ?? []).sort((a, b) => a.position - b.position)
    bundles.push({ date: dayLog.date, dayLog, intentions: dayIntentions, moodCheckIns: moodsByDateKey.get(dayLog.date) ?? [] })
    seenDateKeys.add(dayLog.date)
  }

  for (const [key, moods] of moodsByDateKey) {
    if (seenDateKeys.has(key)) continue
    bundles.push({ date: key, dayLog: null, intentions: [], moodCheckIns: moods })
  }

  bundles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return bundles
}

/** Same 3 fields `patternsAggregation.ts`'s functions expect (`dayLog`/`intentions`/`moodCheckIns`), `dayLog` required — this used to be `patternsHistoryMock.ts`'s seeded-PRNG mock shape; now it's just what `toPatternsMockDay` below adapts a real `DayBundle` into. */
export interface PatternsMockDay {
  dayLog: DayLogRecord
  intentions: IntentionRecord[]
  moodCheckIns: MoodCheckInRecord[]
}

/**
 * Adapts a `DayBundle` into `PatternsMockDay` for `patternsAggregation.ts`,
 * which dereferences `dayLog.date` directly (every function in that file
 * predates real data, built against the old mock generator's guarantee
 * that EVERY day — even ones with zero intentions/mood check-ins — still
 * got a full `dayLog` row). A real mood-only day (no `day_logs` row at
 * all) gets a synthetic placeholder here instead, purely so it still
 * buckets into the right calendar day for range filtering — its `energy:
 * null` never reaches the UI (Patterns doesn't render an energy trend
 * yet, see PatternsScreen.tsx's own doc comment).
 */
export function toPatternsMockDay(bundle: DayBundle): PatternsMockDay {
  const dayLog: DayLogRecord = bundle.dayLog ?? { id: `synthetic-${bundle.date}`, userId: '', date: bundle.date, energy: null, createdAt: `${bundle.date}T00:00:00.000Z` }
  return { dayLog, intentions: bundle.intentions, moodCheckIns: bundle.moodCheckIns }
}
