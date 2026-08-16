import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { SphereId, EnergyLevel } from './spheres'
import type { MoodQuadrantId } from './moodCategories'
import { supabase } from './supabaseClient'
import { useAuth } from './authStore'

/** Matches the `day_logs` table (supabase/schema.sql). */
export interface DayLogRecord {
  id: string
  userId: string
  date: string // YYYY-MM-DD, local
  energy: EnergyLevel | null
  createdAt: string
}

/** Up to 3 intentions per day — `MAX_INTENTIONS_PER_DAY` (3), enforced by the `intentions` table's own `position between 1 and 3` check. */
export const MAX_INTENTIONS_PER_DAY = 3

/** Matches the `intentions` table. `tag` stores a single ReflectionTagPair id (lib/reflectionTags.ts), not the display label — one tag per reflection, not an array. */
export interface IntentionRecord {
  id: string
  dayLogId: string
  text: string
  sphere: SphereId
  position: 1 | 2 | 3
  glad: boolean | null
  tag: string | null
  note: string | null
  reflectedAt: string | null
}

export interface MorningIntentionDraft {
  text: string
  sphere: SphereId
}

export interface EveningReflectionInput {
  intentionId: string
  glad: boolean
  tag: string
  note: string
}

/**
 * Matches the `mood_checkins` table. `technique` stores a TechniqueDef id
 * (lib/moodTechniques.ts). `technique`/`better`/`liked` are all nullable —
 * a check-in can complete without ever touching a technique ("Complete
 * check-in" straight from the intensity screen, or "Skip practice"), and
 * `better` specifically is only ever set when the user answers the
 * "Do you feel better?" bottom sheet.
 */
export interface MoodCheckInRecord {
  id: string
  userId: string
  createdAt: string
  emotion: string
  quadrant: MoodQuadrantId
  intensity: number // 1-5
  technique: string | null
  better: boolean | null
  liked: boolean | null
  note: string | null
}

export interface MoodCheckInInput {
  emotion: string
  quadrant: MoodQuadrantId
  intensity: number
  technique: string | null
  better: boolean | null
  liked: boolean | null
  note: string
}

interface DayLogStoreValue {
  dayLog: DayLogRecord | null
  intentions: IntentionRecord[]
  /** Commits the whole morning flow at once (both intentions, if any were set, plus the day's energy) — the flow screens hold their own draft state locally and only call this on genuine completion. Callers don't await this (fire-and-forget, matching the app's existing optimistic-transition pattern); failures are logged, not surfaced in the UI yet. */
  submitMorningIntentions: (drafts: MorningIntentionDraft[], energy: EnergyLevel) => Promise<void>
  /** Same rationale as above: the evening flow only writes once, on the last card's "Save reflection" tap. */
  submitEveningReflections: (reflections: EveningReflectionInput[]) => Promise<void>
  moodCheckIns: MoodCheckInRecord[]
  /** Same commit-once-on-completion rationale, mirrored from the intention flow. */
  submitMoodCheckIn: (input: MoodCheckInInput) => Promise<void>
  /** IDs into `TECHNIQUES` (lib/moodTechniques.ts) the user has favorited, read by the home screen's "Practices" subtab — a separate `favorite_techniques` join table, not a single check-in's own `liked` answer. */
  favoriteTechniqueIds: string[]
  toggleFavoriteTechnique: (id: string) => Promise<void>
  /** True while today's initial data is being fetched (or refetched after sign-in) — `App.tsx`'s `RequireRegistration` waits on this too, so the app never mounts on a stale empty state right after auth resolves. */
  loading: boolean
}

const DayLogStoreContext = createContext<DayLogStoreValue | null>(null)

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Start/end of the given LOCAL calendar day, as real instants (ISO strings
 * with an explicit UTC offset) — not naive string concatenation. Postgres
 * has no idea what the browser's local timezone is, so comparing
 * `created_at` (a `timestamptz`) against a date-only string would silently
 * use the DB session's own timezone instead of the user's, shifting the
 * day boundary for anyone not in UTC. Computing real `Date` objects first
 * and letting `.toISOString()` do the conversion keeps this correct.
 */
export function localDayBounds(date: Date): { startIso: string; endIso: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export interface DayLogRow {
  id: string
  user_id: string
  date: string
  energy: EnergyLevel | null
  created_at: string
}
export interface IntentionRow {
  id: string
  day_log_id: string
  text: string
  sphere: SphereId
  position: 1 | 2 | 3
  glad: boolean | null
  tag: string | null
  note: string | null
  reflected_at: string | null
}
export interface MoodCheckInRow {
  id: string
  user_id: string
  created_at: string
  emotion: string
  quadrant: MoodQuadrantId
  intensity: number
  technique: string | null
  better: boolean | null
  liked: boolean | null
  note: string | null
}

export function mapDayLog(row: DayLogRow): DayLogRecord {
  return { id: row.id, userId: row.user_id, date: row.date, energy: row.energy, createdAt: row.created_at }
}
export function mapIntention(row: IntentionRow): IntentionRecord {
  return { id: row.id, dayLogId: row.day_log_id, text: row.text, sphere: row.sphere, position: row.position, glad: row.glad, tag: row.tag, note: row.note, reflectedAt: row.reflected_at }
}
export function mapMoodCheckIn(row: MoodCheckInRow): MoodCheckInRecord {
  return { id: row.id, userId: row.user_id, createdAt: row.created_at, emotion: row.emotion, quadrant: row.quadrant, intensity: row.intensity, technique: row.technique, better: row.better, liked: row.liked, note: row.note }
}

/**
 * Real data store for today's `day_logs`/`intentions`/`mood_checkins`/
 * `favorite_techniques` (Stage 6 — replaces the earlier in-memory mock).
 * Keeps the exact same context shape/hook name every consuming screen
 * already calls (`CheckInScreen`, `MorningIntentionFlow`,
 * `EveningReflectionFlow`, `MoodFlowScreen`, `IntentionFlowScreen`,
 * `CheckInMenuSheet`) — only the internals moved from `useState` to real
 * Supabase reads/writes, so none of those screens needed to change.
 * `isRegistered`/`register` moved out to `authStore.tsx` (real auth now),
 * so they're no longer part of this value.
 *
 * "Today" only, same scope as before — the Journal history list and
 * Patterns tab do their own separate range queries for past days rather
 * than extending this store's shape (see `EntriesScreen.tsx`/
 * `PatternsScreen.tsx`'s own doc comments).
 */
export function DayLogStoreProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [dayLog, setDayLog] = useState<DayLogRecord | null>(null)
  const [intentions, setIntentions] = useState<IntentionRecord[]>([])
  const [moodCheckIns, setMoodCheckIns] = useState<MoodCheckInRecord[]>([])
  const [favoriteTechniqueIds, setFavoriteTechniqueIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const refetchToday = useCallback(async (uid: string) => {
    const today = dateKey(new Date())
    const { startIso, endIso } = localDayBounds(new Date())

    const [dayLogRes, moodRes, favRes] = await Promise.all([
      supabase.from('day_logs').select('*').eq('user_id', uid).eq('date', today).maybeSingle<DayLogRow>(),
      supabase.from('mood_checkins').select('*').eq('user_id', uid).gte('created_at', startIso).lte('created_at', endIso).order('created_at', { ascending: true }).returns<MoodCheckInRow[]>(),
      supabase.from('favorite_techniques').select('technique_id').eq('user_id', uid).returns<{ technique_id: string }[]>(),
    ])

    if (dayLogRes.error) console.error('Failed to load today\'s day log', dayLogRes.error)
    if (moodRes.error) console.error('Failed to load mood check-ins', moodRes.error)
    if (favRes.error) console.error('Failed to load favorite techniques', favRes.error)

    const todayLog = dayLogRes.data ? mapDayLog(dayLogRes.data) : null
    setDayLog(todayLog)
    setMoodCheckIns((moodRes.data ?? []).map(mapMoodCheckIn))
    setFavoriteTechniqueIds((favRes.data ?? []).map((r) => r.technique_id))

    if (todayLog) {
      const { data: intentionRows, error } = await supabase.from('intentions').select('*').eq('day_log_id', todayLog.id).order('position', { ascending: true }).returns<IntentionRow[]>()
      if (error) console.error('Failed to load intentions', error)
      setIntentions((intentionRows ?? []).map(mapIntention))
    } else {
      setIntentions([])
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setDayLog(null)
      setIntentions([])
      setMoodCheckIns([])
      setFavoriteTechniqueIds([])
      setLoading(false)
      return
    }
    setLoading(true)
    refetchToday(userId).finally(() => setLoading(false))
  }, [userId, refetchToday])

  const submitMorningIntentions = async (drafts: MorningIntentionDraft[], energy: EnergyLevel) => {
    if (!userId) return
    const today = dateKey(new Date())

    const { data: dayLogRow, error: dayLogError } = await supabase
      .from('day_logs')
      .upsert({ user_id: userId, date: today, energy }, { onConflict: 'user_id,date' })
      .select()
      .single<DayLogRow>()
    if (dayLogError || !dayLogRow) {
      console.error('Failed to save energy/day log', dayLogError)
      return
    }
    const savedDayLog = mapDayLog(dayLogRow)
    setDayLog(savedDayLog)

    // Full replace, not a diff — matches the mock's own overwrite semantics.
    // Morning intentions are only ever submitted once per day (gated by
    // IntentionFlowScreen's `state === 'unset'` check), so this never runs
    // against a day that already has reflected intentions.
    const { error: deleteError } = await supabase.from('intentions').delete().eq('day_log_id', savedDayLog.id)
    if (deleteError) console.error('Failed to clear previous intentions', deleteError)

    if (drafts.length === 0) {
      setIntentions([])
      return
    }
    const rows = drafts.map((draft, index) => ({ day_log_id: savedDayLog.id, text: draft.text, sphere: draft.sphere, position: index + 1 }))
    const { data: inserted, error: insertError } = await supabase.from('intentions').insert(rows).select().returns<IntentionRow[]>()
    if (insertError) {
      console.error('Failed to save intentions', insertError)
      return
    }
    setIntentions((inserted ?? []).map(mapIntention).sort((a, b) => a.position - b.position))
  }

  const submitEveningReflections = async (reflections: EveningReflectionInput[]) => {
    const now = new Date().toISOString()
    const results = await Promise.all(
      reflections.map((r) =>
        supabase
          .from('intentions')
          .update({ glad: r.glad, tag: r.tag, note: r.note.trim() || null, reflected_at: now })
          .eq('id', r.intentionId),
      ),
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) console.error('Failed to save evening reflection', failed.error)

    setIntentions((prev) =>
      prev.map((intention) => {
        const reflection = reflections.find((r) => r.intentionId === intention.id)
        if (!reflection) return intention
        return { ...intention, glad: reflection.glad, tag: reflection.tag, note: reflection.note.trim() || null, reflectedAt: now }
      }),
    )
  }

  const submitMoodCheckIn = async (input: MoodCheckInInput) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: userId,
        emotion: input.emotion,
        quadrant: input.quadrant,
        intensity: input.intensity,
        technique: input.technique,
        better: input.better,
        liked: input.liked,
        note: input.note.trim() || null,
      })
      .select()
      .single<MoodCheckInRow>()
    if (error || !data) {
      console.error('Failed to save mood check-in', error)
      return
    }
    setMoodCheckIns((prev) => [...prev, mapMoodCheckIn(data)])
  }

  const toggleFavoriteTechnique = async (id: string) => {
    if (!userId) return
    const isFavorited = favoriteTechniqueIds.includes(id)
    // Optimistic: flip local state immediately, before the write resolves —
    // motion pass requires the heart's fill (and its burst micro-animation,
    // TechniqueCard.tsx) to react with zero perceived latency, not wait on
    // a network round-trip. Rolled back only if the write actually fails.
    setFavoriteTechniqueIds((prev) => (isFavorited ? prev.filter((existing) => existing !== id) : [...prev, id]))
    if (isFavorited) {
      const { error } = await supabase.from('favorite_techniques').delete().eq('user_id', userId).eq('technique_id', id)
      if (error) {
        console.error('Failed to unfavorite technique', error)
        setFavoriteTechniqueIds((prev) => [...prev, id])
      }
    } else {
      const { error } = await supabase.from('favorite_techniques').insert({ user_id: userId, technique_id: id })
      if (error) {
        console.error('Failed to favorite technique', error)
        setFavoriteTechniqueIds((prev) => prev.filter((existing) => existing !== id))
      }
    }
  }

  return (
    <DayLogStoreContext.Provider
      value={{
        dayLog,
        intentions,
        submitMorningIntentions,
        submitEveningReflections,
        moodCheckIns,
        submitMoodCheckIn,
        favoriteTechniqueIds,
        toggleFavoriteTechnique,
        loading,
      }}
    >
      {children}
    </DayLogStoreContext.Provider>
  )
}

export function useDayLogStore(): DayLogStoreValue {
  const ctx = useContext(DayLogStoreContext)
  if (!ctx) throw new Error('useDayLogStore must be used within a DayLogStoreProvider')
  return ctx
}
