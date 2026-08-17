import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompletionSummaryCard } from '../components/CompletionSummaryCard'
import type { DayLog, IntentionLog } from '../components/CompletionSummaryCard'
import { DaySummaryCard } from '../components/DaySummaryCard'
import { HomeHeader } from '../components/HomeHeader'
import { SecondaryNav } from '../components/SecondaryNav'
import type { SecondaryNavSection } from '../components/SecondaryNav'
import { pickMonthSection } from '../lib/journalHistory'
import { useDayLogStore } from '../lib/dayLogStore'
import type { IntentionRecord, MoodCheckInRecord } from '../lib/dayLogStore'
import { useAuth } from '../lib/authStore'
import { fetchPastDayBundles } from '../lib/dayLogHistory'
import type { DayBundle } from '../lib/dayLogHistory'
import { getGreeting } from '../lib/greeting'
import { getDisplayName } from '../lib/displayName'
import { QUADRANT_TO_MOOD_CATEGORY } from '../lib/moodCategories'
import { cn } from '../lib/cn'
import type { DayDetailNavState } from './DayDetailScreen'

const TODAY = new Date()

type PastLog = DayLog & { intentionRecords: IntentionRecord[]; moodCheckInRecords: MoodCheckInRecord[]; energyTime?: Date }

/** Adapts one `DayBundle` (dayLogHistory.ts's shared per-day query result) into this screen's own `DayLog` display shape — same field derivation `CheckInScreen`/this screen already use for "today," just applied to a past day's real rows instead of the live store's. */
function toPastLog(bundle: DayBundle): PastLog {
  const reflected = bundle.intentions.filter((intention) => intention.reflectedAt !== null)
  const intention: IntentionLog | undefined = bundle.intentions.length > 0 && bundle.dayLog?.energy ? { spheres: bundle.intentions.map((i) => i.sphere), energyLevel: bundle.dayLog.energy } : undefined
  return {
    date: new Date(`${bundle.date}T00:00:00`),
    intention,
    gladAboutDay: reflected.length > 0 ? reflected.every((i) => i.glad === true) : undefined,
    moodCheckIns: bundle.moodCheckIns.map((m) => ({ id: m.id, emotion: m.emotion, categoryId: QUADRANT_TO_MOOD_CATEGORY[m.quadrant] })),
    intentionRecords: bundle.intentions,
    moodCheckInRecords: bundle.moodCheckIns,
    energyTime: bundle.dayLog ? new Date(bundle.dayLog.createdAt) : undefined,
  }
}

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
 * Stage 6: the History section now reads real data — `fetchPastDayBundles`
 * (dayLogHistory.ts) queries every `day_logs`/`intentions`/`mood_checkins`
 * row before today for the signed-in user, RLS-scoped. This replaced the
 * screen's own `MOCK_PAST_LOGS_*` arrays and the dev-only scenario
 * switcher that used to sit below the list (that switcher's own comment
 * said to delete it "once real persisted day-log data exists" — this is
 * that point). "Today" itself still reads from the live `useDayLogStore()`
 * context, same split as before — that store only ever tracks today.
 */
export function EntriesScreen() {
  const navigate = useNavigate()
  const [section, setSection] = useState<SecondaryNavSection>('notes')
  const { dayLog, intentions, moodCheckIns } = useDayLogStore()
  const { userId } = useAuth()
  const [pastLogs, setPastLogs] = useState<PastLog[]>([])

  useEffect(() => {
    if (!userId) {
      setPastLogs([])
      return
    }
    let cancelled = false
    fetchPastDayBundles(userId).then((bundles) => {
      if (!cancelled) setPastLogs(bundles.map(toPastLog))
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const monthSection = pickMonthSection(pastLogs, TODAY)

  const reflectedIntentions = intentions.filter((intention) => intention.reflectedAt !== null)
  const todayLog: DayLog = {
    date: TODAY,
    intention: intentions.length > 0 && dayLog?.energy ? { spheres: intentions.map((i) => i.sphere), energyLevel: dayLog.energy } : undefined,
    gladAboutDay: reflectedIntentions.length > 0 ? reflectedIntentions.every((intention) => intention.glad === true) : undefined,
    moodCheckIns: moodCheckIns.map((m) => ({ id: m.id, emotion: m.emotion, categoryId: QUADRANT_TO_MOOD_CATEGORY[m.quadrant] })),
  }
  // Review fix — same derivation CheckInScreen already uses: a truly empty
  // today (no intention, no mood check-ins) renders DaySummaryCard's
  // dashed "What's on your mind today?" card below, not
  // CompletionSummaryCard — this screen used to always render the latter
  // unconditionally, which is what let "Not set yet" show up alone as a
  // stand-in for true emptiness (see CompletionSummaryCard's own doc
  // comment for the other half of this fix).
  const hasDayContent = !!todayLog.intention || todayLog.moodCheckIns.length > 0
  // Review fix — same two-height distinction CheckInScreen's own Today
  // card already makes (`isCompleteEmpty`): a device that has NEVER
  // logged anything gets the big, flex-1 empty-state card; once real
  // history exists (even if today itself is still empty) the card hugs
  // its own content instead. `pastLogs` is already fetched above for the
  // month-section list below, so this is free — no new query. Before this
  // fix, this screen's own Today card had no such distinction at all
  // (always natural-height), which is what made it visibly SHRINK
  // relative to CheckInScreen's own big card the moment a user navigated
  // here (e.g. Patterns → Journal) while genuinely having zero entries
  // ever — two screens showing the same conceptual empty state at two
  // different sizes.
  const isCompleteEmpty = !hasDayContent && pastLogs.length === 0

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

  const openHistoryDetail = (log: PastLog) => {
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
    <div className={cn('flex min-h-full flex-col', !isCompleteEmpty && 'pb-8')}>
      <HomeHeader greeting={getGreeting(getDisplayName())} onSettingsClick={() => navigate('/settings')} onProfileClick={() => navigate('/profile')} />

      <div className="flex flex-1 flex-col px-5">
        {/* self-start — the switcher should hug its own content width, not stretch to the row's full width the way a flex-column child does by default. */}
        <SecondaryNav activeSection={section} onSectionChange={setSection} className="mt-5 self-start" />

        {/* text-lg (18px), not text-xl (20px) — explicit direct correction, applies to every section title on this screen (Today + month headers). */}
        <h1 className="mt-5 font-serif text-lg text-ink">Today</h1>
        <div className={cn('mt-3', isCompleteEmpty && 'flex flex-1 flex-col')}>
          {hasDayContent ? (
            <CompletionSummaryCard {...todayLog} context="today" onClick={openTodayDetail} />
          ) : isCompleteEmpty ? (
            // Same flex-1/mb-[77px] FAB-clearance mechanism as CheckInScreen's
            // own complete-empty card — see this screen's own `isCompleteEmpty`
            // doc comment above.
            <DaySummaryCard className="mb-[77px] flex-1" />
          ) : (
            <DaySummaryCard className="h-[166px]" />
          )}
        </div>

        {monthSection && (
          <>
            {/* mt-3 (12px) — explicit direct correction, was mt-6 (24px, an inferred value borrowing CheckInScreen's own section-to-section rhythm since no spec existed at the time). Now matches the title-to-card gap immediately below it, so every title-adjacent gap on this screen is a uniform 12px. */}
            <h2 className="mt-3 font-serif text-lg text-ink">{monthSection.label}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {monthSection.days.map((log) => (
                <CompletionSummaryCard key={log.date.toISOString()} {...log} context="history" onClick={() => openHistoryDetail(log as PastLog)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
