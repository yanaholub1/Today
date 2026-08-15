import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { SphereId, EnergyLevel } from './spheres'
import type { MoodQuadrantId } from './moodCategories'

/** Matches the brief's schema shape (`day_logs`) — mock, in-memory only, single user, today only. */
export interface DayLogRecord {
  id: string
  userId: string
  date: string // YYYY-MM-DD, local
  energy: EnergyLevel | null
  createdAt: string
}

/** Up to 3 intentions per day — re-verified against 253:1904 ("You've chosen enough for today ... let these 3 intentions have your attention for now."), Fix 24's explicit correction of the earlier 1-intention cap. */
export const MAX_INTENTIONS_PER_DAY = 3

/** Matches the brief's schema shape (`intentions`). `tag` stores a single ReflectionTagPair id (lib/reflectionTags.ts), not the display label — review fix, reverting an earlier `tags: string[]` multi-select pass back to exactly 1 tag per reflection, Stage 4a's original shape. */
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
 * Matches the brief's schema shape (`mood_checkins`). `technique` stores a
 * TechniqueDef id (lib/moodTechniques.ts). `technique`/`better`/`liked` are
 * all nullable — explicit direct request restructured this flow so a
 * check-in can complete without ever touching a technique ("Complete
 * check-in" straight from the intensity screen, or "Skip practice"), and
 * `better` specifically is only ever set when the user answers the
 * "Do you feel better?" bottom sheet — dismissing it (tap outside) still
 * completes the check-in, just with `better: null`.
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
  /**
   * Commits the whole morning flow at once (both intentions, if 2 were
   * set, plus the day's energy) rather than writing incrementally as the
   * user progresses through steps — the flow screens hold their own draft
   * state locally and only call this on genuine completion, so the shared
   * store never has to represent a half-finished morning (e.g. an
   * intention with no energy value yet, which `IntentionLog` — the shape
   * CompletionSummaryCard consumes — can't express since `energyLevel`
   * isn't optional there).
   */
  submitMorningIntentions: (drafts: MorningIntentionDraft[], energy: EnergyLevel) => void
  /** Same rationale as above: the evening flow only writes once, on the last card's "Save reflection" tap. */
  submitEveningReflections: (reflections: EveningReflectionInput[]) => void
  moodCheckIns: MoodCheckInRecord[]
  /** Same commit-once-on-completion rationale, mirrored from the intention flow (Stage 4b): the mood flow writes here only on the final check-back screen's "Save check-in" tap. */
  submitMoodCheckIn: (input: MoodCheckInInput) => void
  /**
   * Review fix (no Figma node — inferred from established patterns; see
   * PracticeCard.tsx / CheckInScreen.tsx's own doc comments). IDs into
   * `TECHNIQUES` (lib/moodTechniques.ts) the user has favorited, read by
   * the home screen's "Practices" subtab. Scoped per TECHNIQUE TYPE, not
   * per check-in instance — favoriting "Paced Breathing" once during any
   * mood check-in makes it show up once here, regardless of how many
   * check-ins ever use it. Deliberately a SEPARATE list from any single
   * `MoodCheckInRecord.liked` value: unfavoriting later must not rewrite
   * an already-saved check-in's own historical `liked` answer.
   */
  favoriteTechniqueIds: string[]
  toggleFavoriteTechnique: (id: string) => void
  /**
   * Registration fix (no Figma node yet — see RegistrationScreen.tsx's own
   * doc comment) — mock, in-memory only flag, same "no real persistence"
   * pattern as everything else in this store. Supersedes the earlier
   * onboarding-only `hasSeenOnboarding` flag (Fix 29): this is now the
   * SINGLE gate the router checks (`RequireRegistration` in App.tsx) for
   * every screen except onboarding/registration themselves — reaching any
   * gated route without registering redirects all the way back to
   * `/onboarding`, so a separate "has onboarding been seen" flag would
   * just be redundant state tracking the same thing. Stage 6 (Supabase/
   * magic-link auth) will replace this flag with real auth state — the
   * route guard itself is written so that swap shouldn't need a rework,
   * just a different source for this one boolean.
   */
  isRegistered: boolean
  register: () => void
}

const DayLogStoreContext = createContext<DayLogStoreValue | null>(null)

const MOCK_USER_ID = 'mock-user'

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Shared mock data store for `day_logs`/`intentions` (Stage 4) — a plain
 * React context, single in-memory day log for "today" (no multi-day
 * persistence needed yet; the Journal history list, Fix 22, still runs on
 * its own separate mock data until real persistence exists). Both the
 * Check-in gate screen/tab-bar menu's dynamic "Set intention" state and
 * the home screen's Today card now read from this instead of their own
 * dev-only toggles.
 */
export function DayLogStoreProvider({ children }: { children: ReactNode }) {
  const [dayLog, setDayLog] = useState<DayLogRecord | null>(null)
  const [intentions, setIntentions] = useState<IntentionRecord[]>([])
  const [moodCheckIns, setMoodCheckIns] = useState<MoodCheckInRecord[]>([])
  // Seeded with 2 favorites (review fix) so the Practices subtab has real
  // content to review out of the box, in addition to the empty state
  // being reachable by unfavoriting both.
  const [favoriteTechniqueIds, setFavoriteTechniqueIds] = useState<string[]>(['paced-breathing', 'nature-pause'])
  const [isRegistered, setIsRegistered] = useState(false)

  const submitMorningIntentions = (drafts: MorningIntentionDraft[], energy: EnergyLevel) => {
    const now = new Date()
    const id = dayLog?.id ?? `day-${dateKey(now)}`
    setDayLog({ id, userId: MOCK_USER_ID, date: dateKey(now), energy, createdAt: dayLog?.createdAt ?? now.toISOString() })
    setIntentions(
      drafts.map((draft, index) => ({
        id: `${id}-intention-${index + 1}`,
        dayLogId: id,
        text: draft.text,
        sphere: draft.sphere,
        position: (index + 1) as 1 | 2 | 3,
        glad: null,
        tag: null,
        note: null,
        reflectedAt: null,
      })),
    )
  }

  const submitEveningReflections = (reflections: EveningReflectionInput[]) => {
    const now = new Date().toISOString()
    setIntentions((prev) =>
      prev.map((intention) => {
        const reflection = reflections.find((r) => r.intentionId === intention.id)
        if (!reflection) return intention
        return { ...intention, glad: reflection.glad, tag: reflection.tag, note: reflection.note || null, reflectedAt: now }
      }),
    )
  }

  const submitMoodCheckIn = (input: MoodCheckInInput) => {
    const now = new Date()
    setMoodCheckIns((prev) => [
      ...prev,
      {
        id: `mood-${now.getTime()}`,
        userId: MOCK_USER_ID,
        createdAt: now.toISOString(),
        emotion: input.emotion,
        quadrant: input.quadrant,
        intensity: input.intensity,
        technique: input.technique,
        better: input.better,
        liked: input.liked,
        note: input.note.trim() || null,
      },
    ])
  }

  const toggleFavoriteTechnique = (id: string) => {
    setFavoriteTechniqueIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  const register = () => setIsRegistered(true)

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
        isRegistered,
        register,
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
