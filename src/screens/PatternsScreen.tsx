import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, CircleHalf } from '@phosphor-icons/react'
import { PillSubtabSwitcher } from '../components/PillSubtabSwitcher'
import { TimeRangePicker } from '../components/TimeRangePicker'
import { RankedBarRow } from '../components/RankedBarRow'
import { SheenSurface } from '../components/SheenSurface'
import { MoodTrackerCard } from '../components/MoodTrackerCard'
import { useDayLogStore } from '../lib/dayLogStore'
import { useAuth } from '../lib/authStore'
import { SPHERES } from '../lib/spheres'
import type { SphereId } from '../lib/spheres'
import { fetchPastDayBundles, toPatternsMockDay } from '../lib/dayLogHistory'
import type { PatternsMockDay } from '../lib/dayLogHistory'
import { cn } from '../lib/cn'
import {
  buildPatternsDataset,
  buildSphereFrequency,
  buildSpherePerformance,
  buildHelperObstacleLists,
  buildTechniqueOutcomes,
  buildAvailableMonths,
  buildAvailableWeeks,
  formatDateRangeLabel,
  MIN_SAMPLE_SIZE,
} from '../lib/patternsAggregation'
import type { PatternsTimeRange } from '../lib/patternsAggregation'

const ALL_SPHERE_IDS = Object.keys(SPHERES) as SphereId[]

const HELPER_GREEN = '#6a9c6a'
// Negative-outcome bar color, shared by "What got in the way" (Helpers and
// obstacles) and "Didn't help" (Practices) — explicit direct correction
// from the original #925477 mauve.
const OBSTACLE_MAUVE = '#A8654E'
// "How it went" circles' single neutral color (both filled/outline
// states), used in both the outcome-dots row and the legend below it —
// explicit direct correction, replacing the earlier Figma-derived
// #353d4f.
const OUTCOME_CIRCLE_COLOR = '#586174'

const INITIAL_VISIBLE = 3
// "How it went" keeps its dot row to ONE line (explicit direct request —
// no wrapping) and overflows to a "+N" indicator past this many. The dot
// frame is fixed at a 4px gap between dots (explicit direct request) and
// fills the row (flex-1) so real dots — not stretched gaps — are what
// visually reach toward the row's far edge; this count is sized so that
// many dots, at 16px each + 4px gap (20px/dot), land close to the card's
// own 321px content width once the "+NN" label and its own fixed 16px gap
// (explicit direct request) are reserved: 13 dots ≈ 256px, leaving ~65px
// for gap + label. Own UX call, not from Figma — 323:3948's own example
// only ever has 3 total per sphere (the 7-day-range state); "All time" can
// realistically accumulate 30-50+ reflected intentions per sphere in this
// app's seeded mock history. Reuses the same "+N" overflow pattern already
// established for CompletionSummaryCard's mood-log/intention rows, rather
// than a new truncation treatment.
const MAX_OUTCOME_DOTS = 13

type PatternsSubtab = 'intention' | 'mood'

const SUBTABS: { id: PatternsSubtab; label: string }[] = [
  { id: 'intention', label: 'Intention' },
  { id: 'mood', label: 'Mood' },
]

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-hero border border-solid border-completion-border bg-white p-4">
      <p className="font-sans text-base font-medium text-ink">{title}</p>
      {children}
    </div>
  )
}

function EmptyState() {
  return <p className="font-sans text-sm text-ink/50">Not enough data yet.</p>
}

/**
 * Patterns tab (Review fix — restructures the earlier Stage 5 "Your
 * trends"/"What works for you" underline-tab grouping). Verified against
 * two nodes: 323:4609 (the new pill subtab switcher — see
 * `PillSubtabSwitcher`'s own doc comment) and 323:3948 (the "Intention"
 * subtab's full content — see each card/section below for its own
 * per-piece sourcing). "Mood" is an intentional placeholder shell only —
 * its real content is a separate, not-yet-specified follow-up; see the
 * `subtab === 'mood'` branch below.
 *
 * No `HomeHeader` on this screen (review fix — explicit direct request,
 * the greeting/settings/profile row doesn't belong on Patterns); the
 * `pt-16` on this screen's own content wrapper below replaces the top
 * inset `HomeHeader` used to provide, so "Patterns" doesn't sit flush
 * against the very top edge.
 *
 * The shared time-range/quick-filter row (part 2 of the brief) is now
 * `sticky top-0` together with the pill switcher, both pinned just below
 * the (non-sticky) "Patterns" title while the cards scroll underneath —
 * the brief only explicitly required the time-range row itself to stick;
 * keeping the switcher sticky alongside it is this component's own
 * assumption for visual consistency, since no fetched node shows a
 * mid-scroll state either way.
 *
 * `range` is now exactly 3 values — '7d' / 'month' / 'all', default
 * 'all'. The quick-filter row's own LAYOUT is verified against 327:4998
 * (multiple swipeable tabs) and 329:5398 (exactly one tab, no fade) —
 * review fix, replacing an earlier pass that had the picker on the right
 * and a non-interactive week label on the left: the time-range picker
 * trigger now sits fixed at the LEFT edge, and the quick-filter tabs
 * scroll/swipe in the remaining space to its right, fading at the cutoff
 * edge (same translucent-gradient technique as the sphere-chip row
 * below) whenever there's more than one tab — exactly one tab (329:5398)
 * gets no fade, since there's nothing to swipe to. Per-range tab content:
 *  - '7d': real swipeable tabs now (327:4998 shows 2, not a static
 *    label like an earlier pass assumed) — `buildAvailableWeeks` returns
 *    the last 6 non-overlapping 7-day windows, most recent first; tapping
 *    one sets `selectedWeekStart` and re-filters everything below.
 *  - 'month': one tab per calendar month that actually has data
 *    (`buildAvailableMonths`, most recent first), tapping one sets
 *    `selectedMonth`.
 *  - 'all': exactly one tab, spanning the whole available period (e.g.
 *    "MAY 12 – AUG 11") — its own min/max dates come straight from the
 *    already-filtered (i.e. unfiltered) dataset, per the brief's own
 *    example.
 *
 * Data: `useDayLogStore()` only ever holds ONE live day ("today"; real
 * Supabase data as of Stage 6). Everything before today comes from
 * `fetchPastDayBundles` (`lib/dayLogHistory.ts`, shared with
 * `EntriesScreen.tsx`'s own history section) — a real range query over
 * `day_logs`/`intentions`/`mood_checkins`, fetched once on mount/user
 * change into `pastDays` state, then adapted per-day via
 * `toPatternsMockDay` into the `PatternsMockDay[]` shape
 * `buildPatternsDataset`/`buildAvailableMonths` already expected (this
 * used to be the seeded-PRNG `PATTERNS_MOCK_DAYS` from the now-deleted
 * `patternsHistoryMock.ts` — same shape, real rows instead of generated
 * ones). `buildPatternsDataset` merges `pastDays` with today after
 * filtering by range/week/month — every section below reads from that one
 * filtered dataset. `buildAvailableMonths`/`buildAvailableWeeks`
 * deliberately don't depend on that filtered dataset (months: reads the
 * unfiltered full history so its tabs don't circularly depend on which
 * month is selected; weeks: pure date math off `now`) — see each
 * function's own doc comment.
 *
 * No mood-quadrant color or icon (Fix 8/9/11) actually appears anywhere
 * in 323:3948's own fetched content — flagged per the brief's own
 * instruction to confirm this rather than silently skip it. "Mood over
 * time"/"Energy over time" aren't part of the Intention subtab's content;
 * their aggregation functions (`buildMoodTimeline`/`buildEnergyTrend`)
 * stay defined in patternsAggregation.ts, unused for now.
 *
 * Mood subtab (this fix — replaces the earlier placeholder shell) has 2
 * cards, both driven by `dataset.moodCheckIns`: `MoodTrackerCard`
 * (323:4461/312:2980/323:2233 — swaps its own internal view by reading
 * `range` directly off the SAME sticky time-range picker above, no
 * second control of its own) and "Practices" (323:4558 — technique
 * `better` outcomes, structurally identical to "Helpers and obstacles"
 * above: top-3 + "Show 3 more", green/mauve bars — confirmed via its own
 * screenshot, not assumed from the name alone). Practices shows raw
 * counts only (no percentage/ratio anywhere in 323:4558), so
 * `MIN_SAMPLE_SIZE` doesn't apply to it — that card has its own
 * independent expand state so switching subtabs never carries over the
 * Intention subtab's "N more" progress.
 */
export function PatternsScreen() {
  const { dayLog, intentions, moodCheckIns } = useDayLogStore()
  const { userId } = useAuth()
  const now = useMemo(() => new Date(), [])

  const [pastDays, setPastDays] = useState<PatternsMockDay[]>([])
  useEffect(() => {
    if (!userId) {
      setPastDays([])
      return
    }
    let cancelled = false
    fetchPastDayBundles(userId).then((bundles) => {
      if (!cancelled) setPastDays(bundles.map(toPatternsMockDay))
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const [subtab, setSubtab] = useState<PatternsSubtab>('intention')
  const [range, setRange] = useState<PatternsTimeRange>('all')
  const availableWeeks = useMemo(() => buildAvailableWeeks(now), [now])
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => availableWeeks[0].start)
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(now))
  const [sphereFilter, setSphereFilter] = useState<SphereId | null>(null)
  const [helperVisible, setHelperVisible] = useState(INITIAL_VISIBLE)
  const [obstacleVisible, setObstacleVisible] = useState(INITIAL_VISIBLE)
  const [practicesHelpedVisible, setPracticesHelpedVisible] = useState(INITIAL_VISIBLE)
  const [practicesDidntHelpVisible, setPracticesDidntHelpVisible] = useState(INITIAL_VISIBLE)

  const liveToday = dayLog ? { dayLog, intentions, moodCheckIns } : null
  const dataset = useMemo(
    () => buildPatternsDataset(pastDays, liveToday, range, selectedWeekStart, selectedMonth),
    [pastDays, range, selectedWeekStart, selectedMonth, dayLog, intentions, moodCheckIns],
  )
  const availableMonths = useMemo(() => buildAvailableMonths(pastDays, liveToday, now), [pastDays, now, dayLog, intentions, moodCheckIns])

  // The single 'all time' quick-filter tab's own label — its span comes
  // straight from the (in this case unfiltered) dataset's own min/max
  // dates, not a separate computation, so it always agrees with exactly
  // what's actually included below.
  const allTimeLabel = useMemo(() => {
    if (dataset.dayLogs.length === 0) return null
    const times = dataset.dayLogs.map((d) => new Date(d.date).getTime())
    return formatDateRangeLabel(new Date(Math.min(...times)), new Date(Math.max(...times)))
  }, [dataset.dayLogs])

  const frameOptions = useMemo(() => {
    if (range === '7d') {
      return availableWeeks.map((w) => ({ key: w.key, label: w.label, active: w.start.getTime() === selectedWeekStart.getTime(), onClick: () => setSelectedWeekStart(w.start) }))
    }
    if (range === 'month') {
      return availableMonths.map((m) => ({
        key: m.key,
        label: m.label,
        active: m.date.getFullYear() === selectedMonth.getFullYear() && m.date.getMonth() === selectedMonth.getMonth(),
        onClick: () => setSelectedMonth(m.date),
      }))
    }
    return allTimeLabel ? [{ key: 'all', label: allTimeLabel, active: true, onClick: undefined }] : []
  }, [range, availableWeeks, selectedWeekStart, availableMonths, selectedMonth, allTimeLabel])

  // Left-edge fade (this fix) — mirrors the right-edge fade below, shown
  // once the quick-filter tabs are scrolled past their start. Tracked via
  // scroll position rather than shown unconditionally like the right fade,
  // since at rest (scrollLeft === 0) there's nothing left to scroll back
  // to and a fade with nothing behind it would look like a rendering bug.
  const frameScrollRef = useRef<HTMLDivElement>(null)
  const [frameScrolledFromStart, setFrameScrolledFromStart] = useState(false)
  useEffect(() => {
    setFrameScrolledFromStart(false)
    frameScrollRef.current?.scrollTo({ left: 0 })
  }, [frameOptions])

  // Both "top 3" expand states reset whenever the underlying list could
  // change out from under them, so a stale "6 of 9 shown" doesn't survive
  // a filter/range change that only has 2 items left.
  useEffect(() => {
    setHelperVisible(INITIAL_VISIBLE)
    setObstacleVisible(INITIAL_VISIBLE)
    setPracticesHelpedVisible(INITIAL_VISIBLE)
    setPracticesDidntHelpVisible(INITIAL_VISIBLE)
  }, [sphereFilter, range, selectedWeekStart, selectedMonth])

  const techniqueOutcomes = useMemo(() => buildTechniqueOutcomes(dataset.moodCheckIns), [dataset.moodCheckIns])

  const sphereFrequency = useMemo(() => buildSphereFrequency(dataset.intentions), [dataset.intentions])
  const maxSphereFrequency = Math.max(1, ...sphereFrequency.map((s) => s.count))

  const spherePerformance = useMemo(() => buildSpherePerformance(dataset.intentions), [dataset.intentions])
  const hasAnyPerformanceData = spherePerformance.some((s) => s.enoughData)

  const helperObstacle = useMemo(() => buildHelperObstacleLists(dataset.intentions, sphereFilter), [dataset.intentions, sphereFilter])

  // Life-area filter chips, most-used-first within the current range
  // (part 3 of the brief) — reuses `sphereFrequency`'s own counts (the
  // exact same "usage" metric "Where your attention goes" already shows)
  // rather than a second, differently-defined frequency.
  const sphereChipOrder = useMemo(() => {
    const counts = new Map(sphereFrequency.map((s) => [s.sphere, s.count]))
    return [...ALL_SPHERE_IDS].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
  }, [sphereFrequency])

  return (
    <div className="flex min-h-full flex-col pb-8">
      <div className="flex flex-1 flex-col px-5 pt-16">
        <h1 className="font-serif text-xl text-ink">Patterns</h1>

        <div className="sticky top-0 z-20 mt-5 flex flex-col items-start gap-3 bg-white pt-3 pb-2">
          <PillSubtabSwitcher items={SUBTABS} activeId={subtab} onChange={setSubtab} />

          <div className="flex w-full items-center gap-10 border-b border-solid border-black/10">
            <TimeRangePicker value={range} onChange={setRange} className="shrink-0" />
            <div className="relative min-w-0 flex-1 overflow-hidden">
              {/*
                Plain flex-start (no `justify-end`) — a flex container with
                `justify-content: flex-end`/`center` and overflowing content
                is a known cross-browser quirk: "safe alignment" can make the
                overflow on the start side unreachable/unscrollable. Since
                the active tab is always frameOptions[0] (today's own week/
                month), flex-start already shows it by default with no need
                for end-alignment; the single 'all time' tab instead gets its
                own `ml-auto` below to sit at the right edge (329:5398)
                without the same overflow risk (margin-based push, not
                justify-content).
              */}
              <div
                ref={frameScrollRef}
                onScroll={(e) => setFrameScrolledFromStart(e.currentTarget.scrollLeft > 0)}
                className="no-scrollbar flex items-center gap-4 overflow-x-auto"
              >
                {frameOptions.map((opt, i) => (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={!opt.onClick}
                    onClick={opt.onClick}
                    className={cn(
                      // Border is always reserved at 2px (transparent when inactive) — explicit direct
                      // correction: toggling `border-b-2` on/off between states shifted each tab's own
                      // box height, making active vs inactive tabs render at different sizes. Only the
                      // border's visibility/color should change now, never the box it sits in.
                      'focus-ring pressable shrink-0 border-b-2 border-solid pt-4 pb-2 font-sans text-[15px] font-medium whitespace-nowrap',
                      opt.active ? 'border-ink text-ink' : 'border-transparent text-ink/60',
                      frameOptions.length === 1 && i === 0 && 'ml-auto',
                    )}
                  >
                    {opt.label.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Right-edge fade — only when there's more than one tab to swipe to (329:5398's single-tab
                  state has no fade at all); same translucent-gradient technique as the sphere-chip row. */}
              {frameOptions.length > 1 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-0 right-0 h-11 w-12"
                  style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.8), rgba(255,255,255,0.1))' }}
                />
              )}
              {/* Left-edge fade (this fix) — the same element, horizontally mirrored (`to right` instead
                  of `to left`, `left-0` instead of `right-0`), shown once the row is actually scrolled
                  past its start so there's always real hidden content behind the fade. */}
              {frameScrolledFromStart && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-0 left-0 h-11 w-12"
                  style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.1))' }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          {subtab === 'intention' ? (
            <>
              {/* 1. Where your attention goes */}
              <Card title="Where your attention goes">
                {sphereFrequency.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {sphereFrequency.map((s) => {
                      const sphere = SPHERES[s.sphere]
                      const Icon = sphere.icon
                      return (
                        <RankedBarRow
                          key={s.sphere}
                          icon={<Icon size={16} weight="fill" className="text-ink" />}
                          label={sphere.label}
                          value={s.count}
                          max={maxSphereFrequency}
                          trailing={`${s.count}`}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </Card>

              {/* 2. How it went — a manual Card equivalent (not the shared `Card`) since this
                  section needs its own 8px title/legend gaps instead of Card's shared 16px. */}
              <div className="flex w-full flex-col rounded-hero border border-solid border-completion-border bg-white p-4">
                <p className="font-sans text-base font-medium text-ink">How it went</p>
                <div className="flex flex-col gap-0 pt-2">
                  {spherePerformance.map((s) => {
                    const sphere = SPHERES[s.sphere]
                    const Icon = sphere.icon
                    if (!s.enoughData) {
                      return (
                        <div
                          key={s.sphere}
                          className="flex w-full items-center justify-between gap-2 border-b border-solid py-2"
                          style={{ borderColor: '#EDDDE6' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon size={16} weight="fill" className="text-ink/40" />
                            <span className="font-sans text-base whitespace-nowrap tracking-[-0.16px] text-ink/40">{sphere.label}</span>
                          </div>
                          <span className="font-sans text-sm text-ink/40">
                            Not enough data yet ({s.total}/{MIN_SAMPLE_SIZE})
                          </span>
                        </div>
                      )
                    }
                    const notReally = s.total - s.completed
                    return (
                      <div
                        key={s.sphere}
                        className="flex w-full flex-col gap-2 border-b border-solid py-2"
                        style={{ borderColor: '#EDDDE6' }}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Icon size={16} weight="fill" className="text-ink" />
                            <span className="font-sans text-base whitespace-nowrap tracking-[-0.16px] text-ink">{sphere.label}</span>
                          </div>
                          <span className="font-sans text-xs font-medium tracking-[-0.14px] text-ink/60">
                            {s.completed} Went well • {notReally} Not really
                          </span>
                        </div>
                        <div className="flex w-full items-center gap-4">
                          <div className="flex flex-1 items-center gap-1">
                            {s.outcomes.slice(0, MAX_OUTCOME_DOTS).map((glad, i) => (
                              <span key={i} className="flex size-4 shrink-0 items-center justify-center">
                                {glad ? (
                                  <Circle size={13} weight="fill" color={OUTCOME_CIRCLE_COLOR} />
                                ) : (
                                  <CircleHalf size={13} weight="fill" color={OUTCOME_CIRCLE_COLOR} />
                                )}
                              </span>
                            ))}
                          </div>
                          {s.outcomes.length > MAX_OUTCOME_DOTS && (
                            <span className="font-sans text-sm font-medium tracking-[-0.14px] text-completion-mood-text">+{s.outcomes.length - MAX_OUTCOME_DOTS}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {hasAnyPerformanceData && (
                  <div className="flex w-full items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-sm font-medium tracking-[-0.14px] text-ink/60">Went well</span>
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <Circle size={13} weight="fill" color={OUTCOME_CIRCLE_COLOR} />
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-sm font-medium tracking-[-0.14px] text-ink/60">Not really</span>
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <CircleHalf size={13} weight="fill" color={OUTCOME_CIRCLE_COLOR} />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Helpers and obstacles */}
              <Card title="Helpers and obstacles">
                <div className="relative -mx-1 px-1">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <SheenSurface
                      as="button"
                      type="button"
                      hue={sphereFilter === null ? 'sphere-fixed' : 'sphere-pale'}
                      scale="filter"
                      aria-pressed={sphereFilter === null}
                      onClick={() => setSphereFilter(null)}
                      className="focus-ring pressable flex h-10 shrink-0 items-center justify-center rounded-pill px-[13px]"
                    >
                      <span className="font-sans text-base font-medium whitespace-nowrap">All areas</span>
                    </SheenSurface>
                    {sphereChipOrder.map((id) => {
                      const sphere = SPHERES[id]
                      const Icon = sphere.icon
                      const selected = sphereFilter === id
                      return (
                        <SheenSurface
                          key={id}
                          as="button"
                          type="button"
                          hue={selected ? 'sphere-fixed' : 'sphere-pale'}
                          scale="filter"
                          aria-pressed={selected}
                          onClick={() => setSphereFilter(id)}
                          className="focus-ring pressable flex h-10 shrink-0 items-center justify-center gap-2 rounded-pill pr-3.5 pl-3"
                        >
                          <Icon size={20} weight="fill" />
                          <span className="font-sans text-base font-medium whitespace-nowrap">{sphere.label}</span>
                        </SheenSurface>
                      )
                    })}
                  </div>
                  {/* Right-edge fade (Review fix) — a translucent-white gradient overlay, not a real
                      CSS blur/backdrop-filter: 323:3948's own layer is a plain gradient, confirmed via
                      get_design_context (no backdrop-blur present in the fetched node). */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 right-0 h-10 w-12"
                    style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.8), rgba(255,255,255,0.1))' }}
                  />
                </div>

                {helperObstacle.helpers.length > 0 || helperObstacle.obstacles.length > 0 ? (
                  <div
                    className={cn(
                      'flex flex-col',
                      // Explicit direct request: the "Show 3 more" button's own
                      // height already reads as a gap, so the two blocks sit flush
                      // (0px) whenever it's showing; otherwise a real 16px gap.
                      helperObstacle.helpers.length > helperVisible ? 'gap-0' : 'gap-4',
                    )}
                  >
                    {helperObstacle.helpers.length > 0 && (
                      <div className="flex flex-col items-start">
                        <div className="flex w-full flex-col gap-3 border-b border-solid border-completion-border pb-4">
                          <p className="font-sans text-sm font-semibold tracking-[-0.16px] text-ink">What helped</p>
                          {helperObstacle.helpers.slice(0, helperVisible).map((h) => (
                            <RankedBarRow
                              key={h.tagId}
                              label={h.label}
                              value={h.count}
                              max={helperObstacle.helpers[0].count}
                              trailing={`${h.count}`}
                              barColor={HELPER_GREEN}
                            />
                          ))}
                        </div>
                        {helperObstacle.helpers.length > helperVisible && (
                          <button
                            type="button"
                            onClick={() => setHelperVisible((v) => v + 3)}
                            className="focus-ring pressable flex h-10 w-full items-center justify-end font-sans text-[15px] font-medium tracking-[-0.14px] text-ink"
                          >
                            Show 3 more
                          </button>
                        )}
                      </div>
                    )}
                    {helperObstacle.obstacles.length > 0 && (
                      <div className="flex flex-col items-start">
                        <div className="flex w-full flex-col gap-3">
                          <p className="font-sans text-sm font-semibold tracking-[-0.16px] text-ink">What got in the way</p>
                          {helperObstacle.obstacles.slice(0, obstacleVisible).map((o) => (
                            <RankedBarRow
                              key={o.tagId}
                              label={o.label}
                              value={o.count}
                              max={helperObstacle.obstacles[0].count}
                              trailing={`${o.count}`}
                              barColor={OBSTACLE_MAUVE}
                            />
                          ))}
                        </div>
                        {helperObstacle.obstacles.length > obstacleVisible && (
                          <button
                            type="button"
                            onClick={() => setObstacleVisible((v) => v + 3)}
                            className="focus-ring pressable flex h-10 w-full items-center justify-end font-sans text-[15px] font-medium tracking-[-0.14px] text-ink"
                          >
                            Show 3 more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </Card>
            </>
          ) : (
            <>
              {/* 1. Mood tracker — driven directly by the SAME sticky time-range picker above, no
                  second control of its own (see MoodTrackerCard's own doc comment). */}
              <MoodTrackerCard
                range={range}
                moodCheckIns={dataset.moodCheckIns}
                selectedWeekStart={selectedWeekStart}
                selectedMonth={selectedMonth}
              />

              {/* 2. Practices — technique `better` outcomes (323:4558), structurally identical to
                  "Helpers and obstacles" above (top-3 + "Show 3 more", green/mauve bars) but with its
                  own independent expand state so it never carries over the Intention subtab's progress. */}
              <Card title="Practices">
                {techniqueOutcomes.helped.length > 0 || techniqueOutcomes.didntHelp.length > 0 ? (
                  <div
                    className={cn(
                      'flex flex-col',
                      techniqueOutcomes.helped.length > practicesHelpedVisible ? 'gap-0' : 'gap-4',
                    )}
                  >
                    {techniqueOutcomes.helped.length > 0 && (
                      <div className="flex flex-col items-start">
                        <div className="flex w-full flex-col gap-3 border-b border-solid border-completion-border pb-4">
                          <p className="font-sans text-sm font-semibold tracking-[-0.16px] text-ink">Helped</p>
                          {techniqueOutcomes.helped.slice(0, practicesHelpedVisible).map((t) => (
                            <RankedBarRow
                              key={t.techniqueId}
                              label={t.label}
                              value={t.count}
                              max={techniqueOutcomes.helped[0].count}
                              trailing={`${t.count}`}
                              barColor={HELPER_GREEN}
                            />
                          ))}
                        </div>
                        {techniqueOutcomes.helped.length > practicesHelpedVisible && (
                          <button
                            type="button"
                            onClick={() => setPracticesHelpedVisible((v) => v + 3)}
                            className="focus-ring pressable flex h-10 w-full items-center justify-end font-sans text-[15px] font-medium tracking-[-0.14px] text-ink"
                          >
                            Show 3 more
                          </button>
                        )}
                      </div>
                    )}
                    {techniqueOutcomes.didntHelp.length > 0 && (
                      <div className="flex flex-col items-start">
                        <div className="flex w-full flex-col gap-3">
                          <p className="font-sans text-sm font-semibold tracking-[-0.16px] text-ink">Didn’t help</p>
                          {techniqueOutcomes.didntHelp.slice(0, practicesDidntHelpVisible).map((t) => (
                            <RankedBarRow
                              key={t.techniqueId}
                              label={t.label}
                              value={t.count}
                              max={techniqueOutcomes.didntHelp[0].count}
                              trailing={`${t.count}`}
                              barColor={OBSTACLE_MAUVE}
                            />
                          ))}
                        </div>
                        {techniqueOutcomes.didntHelp.length > practicesDidntHelpVisible && (
                          <button
                            type="button"
                            onClick={() => setPracticesDidntHelpVisible((v) => v + 3)}
                            className="focus-ring pressable flex h-10 w-full items-center justify-end font-sans text-[15px] font-medium tracking-[-0.14px] text-ink"
                          >
                            Show 3 more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
