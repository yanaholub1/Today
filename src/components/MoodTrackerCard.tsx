import { MoodQuadrantBadge } from './MoodQuadrantBadge'
import { RankedBarRow } from './RankedBarRow'
import { MOOD_QUADRANTS } from '../lib/moodCategories'
import type { MoodQuadrantId } from '../lib/moodCategories'
import type { MoodCheckInRecord } from '../lib/dayLogStore'
import { buildMoodWeekRows, buildMoodMonthGrid, buildTopEmotions } from '../lib/patternsAggregation'
import type { PatternsTimeRange } from '../lib/patternsAggregation'
import { cn } from '../lib/cn'

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Week view (this fix — corrected against a further-updated 323:4461,
// explicit direct request): EVERY day with at least one real entry now
// shows the icon+word chip treatment (capped at this many + a "+N" for
// the rest) — not just days above some threshold. Only a day with zero
// entries falls back to the flat gray "nothing logged" dot. This replaces
// the previous data-driven verbose-vs-compact-icons split (which itself
// had replaced an even earlier, wrong "today"-based split) — there is no
// longer a separate compact icon-only cluster at all.
const MAX_ROW_CHIPS = 2
// Month-grid cells: densest fetched example shows 4 icons (2x2) in one
// cell — own UX cap, not explicitly specified beyond that example.
const MAX_MONTH_CELL_ICONS = 4

/** Shared 2x2 mood-quadrant legend — confirmed present at the bottom of all 3 fetched view-states (323:4461/312:2980/323:2233), byte-identical each time. */
function QuadrantLegend() {
  const [highUnpleasant, highPleasant, lowUnpleasant, lowPleasant] = [
    MOOD_QUADRANTS.find((q) => q.id === 'high-unpleasant')!,
    MOOD_QUADRANTS.find((q) => q.id === 'high-pleasant')!,
    MOOD_QUADRANTS.find((q) => q.id === 'low-unpleasant')!,
    MOOD_QUADRANTS.find((q) => q.id === 'low-pleasant')!,
  ]
  // Corrected against the refreshed 323:4461: the label pair ("High
  // energy"/"Unpleasant") sits at its own 2px gap, nested inside the
  // outer 4px gap to the icon — not one flat 4px gap across all three,
  // which is what this row rendered before this fix.
  const row = (def: (typeof MOOD_QUADRANTS)[number]) => (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        <span className="font-sans text-xs font-medium whitespace-nowrap text-ink/50">{def.lines[0]}</span>
        <span className="font-sans text-xs font-medium whitespace-nowrap text-ink/50">{def.lines[1]}</span>
      </div>
      <MoodQuadrantBadge quadrant={def.id} size={18} className="shrink-0" />
    </div>
  )
  return (
    <div className="flex w-full items-start justify-between">
      <div className="flex flex-col gap-2">
        {row(highUnpleasant)}
        {row(lowUnpleasant)}
      </div>
      <div className="flex flex-col gap-2">
        {row(highPleasant)}
        {row(lowPleasant)}
      </div>
    </div>
  )
}

function WeekView({ moodCheckIns, weekStart }: { moodCheckIns: MoodCheckInRecord[]; weekStart: Date }) {
  const rows = buildMoodWeekRows(moodCheckIns, weekStart)
  return (
    <div className="flex w-full flex-col items-start">
      {rows.map((row, i) => {
        const hasEntries = row.entries.length > 0
        return (
          <div
            key={row.key}
            className={cn(
              'flex w-full items-center justify-between gap-2 border-b-[0.5px] border-solid',
              i === 0 ? 'pb-[10px]' : 'py-[9px]',
              hasEntries && 'pr-2',
            )}
            style={{ borderColor: '#EDDDE6' }}
          >
            <div className="flex w-12 shrink-0 flex-col gap-0.5">
              <p className="font-sans text-sm leading-[normal] text-ink/80">{row.dayLabel}</p>
              <p className="font-sans text-[10px] leading-[normal] text-ink/80">{row.dateLabel}</p>
            </div>
            {hasEntries && (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {row.entries.slice(0, MAX_ROW_CHIPS).map((e) => (
                    <div key={e.id} className="flex items-center gap-1">
                      <MoodQuadrantBadge quadrant={e.quadrant} size={20} />
                      <span className="font-sans text-sm leading-[normal] whitespace-nowrap text-[#595f6e]">{e.emotion}</span>
                    </div>
                  ))}
                </div>
                {row.entries.length > MAX_ROW_CHIPS && (
                  <span className="font-sans text-xs leading-[normal] whitespace-nowrap text-[#787d89]">+{row.entries.length - MAX_ROW_CHIPS}</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ moodCheckIns, monthRef }: { moodCheckIns: MoodCheckInRecord[]; monthRef: Date }) {
  const { leadingBlanks, cells } = buildMoodMonthGrid(moodCheckIns, monthRef)
  const totalCells = leadingBlanks + cells.length
  const rowCount = Math.ceil(totalCells / 7)
  const gridCells: ({ day: number; quadrants: MoodQuadrantId[] } | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...cells.map((c) => ({ day: c.day, quadrants: c.quadrants })),
    ...Array(rowCount * 7 - totalCells).fill(null),
  ]

  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex w-full">
        {WEEKDAY_HEADERS.map((d) => (
          <p key={d} className="flex-1 text-center font-sans text-sm text-ink/80">
            {d}
          </p>
        ))}
      </div>
      {Array.from({ length: rowCount }, (_, r) => (
        <div key={r} className="flex w-full border-b-[0.5px] border-solid border-black/10 last:border-b-0">
          {gridCells.slice(r * 7, r * 7 + 7).map((cell, c) => (
            <div key={c} className={cn('flex flex-1 flex-col items-center gap-2 border-r-[0.5px] border-solid border-black/10 py-1 last:border-r-0')}>
              <div className="flex h-[30px] w-full flex-wrap items-center justify-center gap-0.5 px-1">
                {cell?.quadrants.slice(0, MAX_MONTH_CELL_ICONS).map((q, i) => <MoodQuadrantBadge key={i} quadrant={q} size={14} />)}
              </div>
              {cell && <p className="font-sans text-xs font-medium text-[#595f6e]">{cell.day}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 'all' view — rebuilt against 323:2382 (explicit direct reference,
 * replacing this view's earlier pill-chip layout): each ranked emotion is
 * a `MoodQuadrantBadge` + plain label + count, with a bar underneath
 * colored by the quadrant's own `textColor` (confirmed against the node's
 * 4 example rows — Energetic/#134110, Upset/#5f334c≈high-unpleasant's
 * #5d2d48, Calm/#5f4305≈low-pleasant's #614405, Excited/#184581, an exact
 * match for low-unpleasant) — structurally identical to `RankedBarRow`
 * (same icon/label/trailing-count top line, same 6px pill bar track with
 * the same inset-shadow recipe), so reused directly rather than
 * hand-rebuilt.
 */
function AllTimeView({ moodCheckIns }: { moodCheckIns: MoodCheckInRecord[] }) {
  const emotions = buildTopEmotions(moodCheckIns, 6)
  const def = Object.fromEntries(MOOD_QUADRANTS.map((q) => [q.id, q]))
  if (emotions.length === 0) return <p className="font-sans text-sm text-ink/50">Not enough data yet.</p>
  const max = emotions[0].count
  return (
    <div className="flex w-full flex-col gap-3">
      {emotions.map((e) => {
        const q = def[e.quadrant]
        return (
          <RankedBarRow
            key={e.emotion}
            icon={<MoodQuadrantBadge quadrant={e.quadrant} size={22} />}
            label={e.emotion}
            value={e.count}
            max={max}
            trailing={`${e.count}`}
            barColor={q.textColor}
          />
        )
      })}
    </div>
  )
}

export interface MoodTrackerCardProps {
  range: PatternsTimeRange
  moodCheckIns: MoodCheckInRecord[]
  selectedWeekStart: Date
  selectedMonth: Date
}

/**
 * Mood subtab's "Mood tracker" card — driven directly by the SHARED
 * time-range picker at the top of the Patterns tab (not a second control
 * of its own), swapping between 3 confirmed view-states: 323:4461 ('7d'
 * — a 7-row day list, icon+word chip treatment for every day with at
 * least one real entry, capped at `MAX_ROW_CHIPS` + a "+N" for the rest;
 * a flat gray dot only for a day with zero entries — no longer needs
 * `now`/"today" at all), 312:2980 ('month' — a full Mon-Sun calendar grid
 * for `selectedMonth`), 323:2382/323:2233 ('all' — the most-logged
 * individual emotions ranked by frequency). All 3 share the same card
 * chrome (heading "Mood tracker", no subtitle) and the same bottom
 * `QuadrantLegend`, confirmed byte-identical across all 3 nodes.
 *
 * Fixed 524px card height (explicit direct request, so switching views
 * never jumps the card) — not a guess: measured against 312:2980's own
 * per-row math (a 6-row month, the tallest a month view can ever be,
 * measures 523.5px live; every shorter view/month leaves empty space
 * below). The legend is pinned to the card's own bottom edge
 * (`justify-between` on the content column, not `gap`) so that empty
 * space collects ABOVE the legend rather than the legend floating up
 * directly under a shorter view's content.
 */
export function MoodTrackerCard({ range, moodCheckIns, selectedWeekStart, selectedMonth }: MoodTrackerCardProps) {
  return (
    <div
      className="flex w-full flex-col gap-4 rounded-hero border border-solid border-completion-border bg-white p-4"
      style={{ height: 524 }}
    >
      <p className="shrink-0 font-sans text-base leading-[normal] font-medium text-ink">Mood tracker</p>
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="min-h-0">
          {range === '7d' && <WeekView moodCheckIns={moodCheckIns} weekStart={selectedWeekStart} />}
          {range === 'month' && <MonthView moodCheckIns={moodCheckIns} monthRef={selectedMonth} />}
          {range === 'all' && <AllTimeView moodCheckIns={moodCheckIns} />}
        </div>
        <QuadrantLegend />
      </div>
    </div>
  )
}
