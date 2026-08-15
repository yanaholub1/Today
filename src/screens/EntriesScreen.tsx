import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompletionSummaryCard } from '../components/CompletionSummaryCard'
import type { DayLog, IntentionLog, MoodCheckInLogEntry } from '../components/CompletionSummaryCard'
import { HomeHeader } from '../components/HomeHeader'
import { SecondaryNav } from '../components/SecondaryNav'
import type { SecondaryNavSection } from '../components/SecondaryNav'
import { pickMonthSection, subDays } from '../lib/journalHistory'
import { useDayLogStore } from '../lib/dayLogStore'
import type { IntentionRecord, MoodCheckInRecord } from '../lib/dayLogStore'
import type { SphereId } from '../lib/spheres'
import { getGreeting } from '../lib/greeting'
import { QUADRANT_TO_MOOD_CATEGORY } from '../lib/moodCategories'
import type { MoodQuadrantId } from '../lib/moodCategories'
import { cn } from '../lib/cn'
import type { DayDetailNavState } from './DayDetailScreen'

// Mock — real name needs an authenticated user, not built yet. Matches HomeHeader's own mock name in CheckInScreen.
const MOCK_USER_NAME = 'Yana'

const TODAY = new Date()

// Varied per mock day (review fix) — a single shared `MOCK_INTENTION`
// object with a hardcoded `energyLevel: 'low'` previously made every
// history card's battery icon look "stuck" on low regardless of the day,
// masking that `CompletionSummaryCard` already reads `intention.energyLevel`
// correctly. `MOCK_INTENTION_OVERFLOW` also covers 3 spheres/day (the
// Stage 4a cap) so the new intention-row "+1" overflow has a real case to
// render, mirroring 294:2939/302:1723's own 2-visible-plus-"+1" example.
const MOCK_INTENTION_OVERFLOW: IntentionLog = { spheres: ['health', 'work', 'funHobbies'], energyLevel: 'high' }
const MOCK_INTENTION_MEDIUM: IntentionLog = { spheres: ['health', 'work'], energyLevel: 'medium' }
const MOCK_INTENTION_LOW: IntentionLog = { spheres: ['health'], energyLevel: 'low' }
const MOCK_MOOD_CHECK_INS: MoodCheckInLogEntry[] = [
  { id: '1', emotion: 'Upset', categoryId: 'off' },
  { id: '2', emotion: 'Exhausted', categoryId: 'off' },
]
const MOCK_MOOD_CHECK_INS_OVERFLOW: MoodCheckInLogEntry[] = [
  ...MOCK_MOOD_CHECK_INS,
  { id: '3', emotion: 'Anxious', categoryId: 'off' },
  { id: '4', emotion: 'Hopeful', categoryId: 'calm' },
  { id: '5', emotion: 'Focused', categoryId: 'high' },
]

/** Builds one full `IntentionRecord` for the day-detail view's own mock history — `CompletionSummaryCard`'s own `IntentionLog` (spheres+energy only) has no room for real per-intention text/glad/tag, which the new detail view needs. `glad: null` (still-unreflected) always gets `tag: null` and `reflectedAt: null`, matching what the real store would produce. */
function mockIntention(dayId: string, position: 1 | 2 | 3, sphere: SphereId, text: string, glad: boolean | null, tagId: string | null, reflectedAt: Date): IntentionRecord {
  return { id: `${dayId}-i${position}`, dayLogId: dayId, text, sphere, position, glad, tag: glad === null ? null : tagId, note: null, reflectedAt: glad === null ? null : reflectedAt.toISOString() }
}

/**
 * Builds one full `MoodCheckInRecord` for the day-detail view's Mood
 * subtab — same rationale as `mockIntention` above: `CompletionSummaryCard`'s
 * own `MoodCheckInLogEntry` (id+emotion+categoryId only) has no room for
 * the quadrant/technique/better/liked/note fields the detail view needs,
 * so history days get this richer shape as a separate field rather than
 * repurposing the compact one. `options` stays undefined for a plain
 * check-in with no technique or note — deliberately varied per call site
 * across the mock days below so every conditional combination the Mood
 * subtab can render (plain / note-only / technique-only / technique+note,
 * and `better`/`liked` both true and false) has at least one real example.
 */
function mockMoodCheckIn(
  dayId: string,
  position: number,
  emotion: string,
  quadrant: MoodQuadrantId,
  intensity: number,
  createdAt: Date,
  extra?: { technique?: string; better?: boolean; liked?: boolean; note?: string },
): MoodCheckInRecord {
  return {
    id: `${dayId}-m${position}`,
    userId: 'mock-user',
    createdAt: createdAt.toISOString(),
    emotion,
    quadrant,
    intensity,
    technique: extra?.technique ?? null,
    better: extra?.technique ? (extra.better ?? null) : null,
    liked: extra?.technique ? (extra.liked ?? null) : null,
    note: extra?.note ?? null,
  }
}

/**
 * Scenario A: the current calendar month has check-ins. Offsets of 1-2
 * days are about as close to "today" as a mock date can get while still
 * being reliably in the current month for most days of the month (not
 * hardcoded to any specific real date, so this can't stay guaranteed for
 * every possible "today" — e.g. testing on the 1st or 2nd of a month).
 * Covers intention+mood+reflection and intention-only (no reflection —
 * no thumbs); the other 2 state combos are covered by Scenario B below
 * instead, since cramming all 4 onto guaranteed-in-month days isn't
 * possible without hardcoding a specific date.
 *
 * `intentionRecords`/`energyTime` (day-detail fix) are new fields, not on
 * the shared `DayLog` shape — `MOCK_PAST_LOGS_*` stays `DayLog[]` at the
 * type level (so `CompletionSummaryCard`'s own props still destructure
 * cleanly via `{...log}`) with these two extras added per-entry via
 * intersection, read separately when building the day-detail nav state.
 */
const MOCK_PAST_LOGS_CURRENT_MONTH: (DayLog & { intentionRecords: IntentionRecord[]; moodCheckInRecords: MoodCheckInRecord[]; energyTime?: Date })[] = [
  {
    date: subDays(TODAY, 1),
    intention: MOCK_INTENTION_OVERFLOW,
    gladAboutDay: true,
    moodCheckIns: MOCK_MOOD_CHECK_INS_OVERFLOW,
    energyTime: subDays(TODAY, 1),
    intentionRecords: [
      mockIntention('mock-day-1', 1, 'health', 'Breathing exercise twice a day before the meeting', true, 'plan', subDays(TODAY, 1)),
      mockIntention('mock-day-1', 2, 'work', 'Finish the quarterly report draft before end of day', true, 'plan', subDays(TODAY, 1)),
      mockIntention('mock-day-1', 3, 'funHobbies', 'Read for 20 minutes before bed', true, 'accountability', subDays(TODAY, 1)),
    ],
    // "Both" day (intentions + mood): one plain check-in, one with a technique + note.
    moodCheckInRecords: [
      mockMoodCheckIn('mock-day-1', 1, 'Frustrated', 'high-unpleasant', 4, subDays(TODAY, 1)),
      mockMoodCheckIn('mock-day-1', 2, 'Anxious', 'high-unpleasant', 3, subDays(TODAY, 1), {
        technique: 'paced-breathing',
        better: true,
        liked: true,
        note: 'Took a few minutes to breathe before responding to that email — helped more than I expected.',
      }),
    ],
  },
  {
    date: subDays(TODAY, 2),
    intention: MOCK_INTENTION_MEDIUM,
    moodCheckIns: [],
    energyTime: subDays(TODAY, 2),
    intentionRecords: [
      mockIntention('mock-day-2', 1, 'health', 'Take a short walk at lunch', null, null, subDays(TODAY, 2)),
      mockIntention('mock-day-2', 2, 'work', 'Reply to all pending emails', null, null, subDays(TODAY, 2)),
    ],
    // "Intentions only" day — no mood check-ins, exercises the Mood subtab's empty state.
    moodCheckInRecords: [],
  },
]

/**
 * Scenario B: the current calendar month has NOTHING logged — exercises
 * `pickMonthSection`'s fallback to the most recent non-empty past month.
 * Offsets of 40+ days always land at least one full month back, regardless
 * of how many days are in the current or intervening months. Also covers
 * the 2 state combos Scenario A's tighter offsets couldn't fit: "not
 * really" (ThumbsDown) and mood-only.
 */
const MOCK_PAST_LOGS_FALLBACK_MONTH: (DayLog & { intentionRecords: IntentionRecord[]; moodCheckInRecords: MoodCheckInRecord[]; energyTime?: Date })[] = [
  {
    date: subDays(TODAY, 40),
    intention: MOCK_INTENTION_LOW,
    gladAboutDay: true,
    moodCheckIns: MOCK_MOOD_CHECK_INS_OVERFLOW,
    energyTime: subDays(TODAY, 40),
    intentionRecords: [mockIntention('mock-day-40', 1, 'health', 'Drink 8 glasses of water', true, 'energy', subDays(TODAY, 40))],
    // "Both" day — 3 check-ins spanning all the conditional combos: note-only, technique-only, plain.
    moodCheckInRecords: [
      mockMoodCheckIn('mock-day-40', 1, 'Exhausted', 'low-unpleasant', 2, subDays(TODAY, 40), { note: 'Just wanted to log how tired I felt today.' }),
      mockMoodCheckIn('mock-day-40', 2, 'Calm', 'low-pleasant', 4, subDays(TODAY, 40), { technique: 'nature-pause', better: true, liked: false }),
      mockMoodCheckIn('mock-day-40', 3, 'Anxious', 'high-unpleasant', 3, subDays(TODAY, 40)),
    ],
  },
  {
    date: subDays(TODAY, 43),
    intention: MOCK_INTENTION_MEDIUM,
    gladAboutDay: false,
    moodCheckIns: MOCK_MOOD_CHECK_INS,
    energyTime: subDays(TODAY, 43),
    intentionRecords: [
      mockIntention('mock-day-43', 1, 'health', 'Meditate for 10 minutes', false, 'distractions', subDays(TODAY, 43)),
      mockIntention('mock-day-43', 2, 'work', 'Organize desk and clear inbox', false, 'changes', subDays(TODAY, 43)),
    ],
    // "Both" day — technique tried but didn't help (better: false), to exercise the gray/unfilled CheckCircle state.
    moodCheckInRecords: [
      mockMoodCheckIn('mock-day-43', 1, 'Sad', 'low-unpleasant', 3, subDays(TODAY, 43), {
        technique: 'gratitude-note',
        better: false,
        liked: true,
        note: "Tried writing something I'm grateful for but it didn't shift my mood much.",
      }),
      mockMoodCheckIn('mock-day-43', 2, 'Down', 'low-unpleasant', 2, subDays(TODAY, 43)),
    ],
  },
  {
    // Offset 44, not the original 46 — 46 lands one calendar month further
    // back than Day -40/-43 above, outside `pickMonthSection`'s single
    // most-recent-month window, making this day unreachable from the
    // Journal list. 44 stays in the same July section so this "mood-only"
    // combo is actually navigable for validation.
    date: subDays(TODAY, 44),
    moodCheckIns: MOCK_MOOD_CHECK_INS,
    intentionRecords: [],
    // "Mood check-ins only" day — zero intentions, exercises the Intention subtab's own empty state instead.
    moodCheckInRecords: [
      mockMoodCheckIn('mock-day-44', 1, 'Content', 'low-pleasant', 4, subDays(TODAY, 44), { note: 'A quiet, easy day overall.' }),
      mockMoodCheckIn('mock-day-44', 2, 'Grateful', 'low-pleasant', 5, subDays(TODAY, 44), { technique: 'loving-kindness', better: true, liked: true }),
    ],
  },
]

type DevScenario = 'currentMonth' | 'fallbackMonth'

/**
 * Journal tab (Fix 22) — placed here rather than behind the Check-in
 * screen's Notes/Practices switcher (Fix 18): the 3 history-list nodes
 * fetched for this fix don't show that switcher anywhere in their own
 * frames, and the task brief itself named this tab as the more likely
 * fit when ambiguous, so implementing it here is a resolved ambiguity,
 * not a confirmed placement — flagged in case the switcher turns out to
 * be the intended entry point instead.
 *
 * Fix 24 correction: re-verified against 230:17230 (this screen's actual
 * full-page mockup, not just its history-card sub-frame) — its own top
 * two rows, 230:17080 (greeting header) and 230:16931 (Notes/Practices +
 * "All time" switcher), belong directly above "Today" here too, not just
 * on CheckInScreen. Both are a straight reuse of `HomeHeader`/`SecondaryNav`
 * (same components CheckInScreen already uses), so this screen's own
 * shell now mirrors CheckInScreen's: full-bleed `HomeHeader`, then an
 * inset `px-5` wrapper holding `SecondaryNav` (`mt-5`) before "Today"
 * (also `mt-5`, matching CheckInScreen's rhythm). The switcher doesn't
 * change which content renders below it — same as CheckInScreen, neither
 * fetched node shows what "Practices" actually contains, so it stays a
 * visual-only toggle for now.
 *
 * Layout values (title size, gaps) are the task's own spec, not pulled
 * from Figma — none of the 3 fetched nodes (128:679/697/715) show more
 * than a single card, so there's no month-header or list-spacing example
 * to verify against.
 *
 * Reuses CompletionSummaryCard with `context="history"` for every past
 * day — see that component's own doc comment for exactly what changes
 * between 'today' and 'history'. Whether a day with NOTHING logged
 * should get a card in this list at all wasn't specified by the brief;
 * left out here (`pickMonthSection` already filters days down to only
 * ones with real content) rather than guessed.
 *
 * The "Today" card (Stage 4b) now reads real state from the shared
 * day-log store instead of a local mock — same derivation CheckInScreen
 * uses for its own Today card, so the two stay in sync. The History
 * section below still runs on its own static mock data (`MOCK_PAST_LOGS_*`):
 * the store only tracks a single in-memory "today," with no multi-day
 * persistence, so there's nothing real yet for past days to read from.
 */
export function EntriesScreen() {
  const navigate = useNavigate()
  const [section, setSection] = useState<SecondaryNavSection>('notes')
  const [scenario, setScenario] = useState<DevScenario>('currentMonth')
  const { dayLog, intentions, moodCheckIns } = useDayLogStore()
  const pastLogs = scenario === 'currentMonth' ? MOCK_PAST_LOGS_CURRENT_MONTH : MOCK_PAST_LOGS_FALLBACK_MONTH
  const monthSection = pickMonthSection(pastLogs, TODAY)

  const reflectedIntentions = intentions.filter((intention) => intention.reflectedAt !== null)
  const todayLog: DayLog = {
    date: TODAY,
    intention: intentions.length > 0 && dayLog?.energy ? { spheres: intentions.map((i) => i.sphere), energyLevel: dayLog.energy } : undefined,
    gladAboutDay: reflectedIntentions.length > 0 ? reflectedIntentions.every((intention) => intention.glad === true) : undefined,
    moodCheckIns: moodCheckIns.map((m) => ({ id: m.id, emotion: m.emotion, categoryId: QUADRANT_TO_MOOD_CATEGORY[m.quadrant] })),
  }

  const openTodayDetail = () => {
    const detailState: DayDetailNavState = {
      date: TODAY.toISOString(),
      energy: dayLog?.energy ?? null,
      energyTime: dayLog?.createdAt ?? null,
      intentions,
      moodCheckIns,
    }
    navigate('/day', { state: detailState })
  }

  // History cards carry their own full `intentionRecords`/`moodCheckInRecords`/
  // `energyTime` (see `MOCK_PAST_LOGS_*`'s own doc comment) — `pickMonthSection`
  // returns the SAME objects it was given (just filtered/grouped), so this
  // cast is safe: every day in this list really does have these 3 extra fields.
  const openHistoryDetail = (log: DayLog & { intentionRecords: IntentionRecord[]; moodCheckInRecords: MoodCheckInRecord[]; energyTime?: Date }) => {
    const detailState: DayDetailNavState = {
      date: log.date.toISOString(),
      energy: log.intention?.energyLevel ?? null,
      energyTime: log.energyTime?.toISOString() ?? null,
      intentions: log.intentionRecords,
      moodCheckIns: log.moodCheckInRecords,
    }
    navigate('/day', { state: detailState })
  }

  return (
    <div className="flex min-h-full flex-col pb-8">
      <HomeHeader greeting={`${getGreeting()}, ${MOCK_USER_NAME}`} onSettingsClick={() => navigate('/settings')} onProfileClick={() => navigate('/profile')} />

      <div className="flex flex-1 flex-col px-5">
        {/* self-start — the switcher should hug its own content width, not stretch to the row's full width the way a flex-column child does by default. */}
        <SecondaryNav activeSection={section} onSectionChange={setSection} className="mt-5 self-start" />

        {/* text-lg (18px), not text-xl (20px) — explicit direct correction, applies to every section title on this screen (Today + month headers). */}
        <h1 className="mt-5 font-serif text-lg text-ink">Today</h1>
        <div className="mt-3">
          <CompletionSummaryCard {...todayLog} context="today" onClick={openTodayDetail} />
        </div>

        {monthSection && (
          <>
            {/* mt-3 (12px) — explicit direct correction, was mt-6 (24px, an inferred value borrowing CheckInScreen's own section-to-section rhythm since no spec existed at the time). Now matches the title-to-card gap immediately below it, so every title-adjacent gap on this screen is a uniform 12px. */}
            <h2 className="mt-3 font-serif text-lg text-ink">{monthSection.label}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {monthSection.days.map((log) => (
                <CompletionSummaryCard
                  key={log.date.toISOString()}
                  {...log}
                  context="history"
                  onClick={() => openHistoryDetail(log as DayLog & { intentionRecords: IntentionRecord[]; moodCheckInRecords: MoodCheckInRecord[]; energyTime?: Date })}
                />
              ))}
            </div>
          </>
        )}

        {/* DEV-ONLY: exercises both pickMonthSection branches. Delete once real persisted day-log data exists. */}
        <div className="mt-6 flex flex-wrap gap-1.5 rounded-card border border-dashed border-ink/20 p-2">
          <button
            type="button"
            onClick={() => setScenario('currentMonth')}
            className={cn('focus-ring rounded-pill px-2 py-1 font-sans text-[10px] font-medium', scenario === 'currentMonth' ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60')}
          >
            1. Current month has entries
          </button>
          <button
            type="button"
            onClick={() => setScenario('fallbackMonth')}
            className={cn('focus-ring rounded-pill px-2 py-1 font-sans text-[10px] font-medium', scenario === 'fallbackMonth' ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60')}
          >
            2. Current month empty (fallback)
          </button>
        </div>
      </div>
    </div>
  )
}
