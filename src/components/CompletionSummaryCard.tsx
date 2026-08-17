import type { ElementType } from 'react'
import { SPHERES, ENERGY_LEVEL_ICON, ENERGY_LEVEL_COLOR } from '../lib/spheres'
import type { SphereId, EnergyLevel } from '../lib/spheres'
import { MOOD_CATEGORIES } from '../lib/moodCategories'
import type { MoodCategoryId } from '../lib/moodCategories'
import { cn } from '../lib/cn'

export interface MoodCheckInLogEntry {
  id: string
  /** Specific emotion word the user picked (e.g. "Upset") — not built yet, so this is free text for now, not drawn from a real emotion list. */
  emotion: string
  /** Which of the app's 4 energy/mood categories this specific emotion belongs to — drives the log row's icon. */
  categoryId: MoodCategoryId
}

export interface IntentionLog {
  spheres: SphereId[]
  energyLevel: EnergyLevel
}

export interface DayLog {
  date: Date
  /** Undefined = no morning intention set yet that day — renders the "Not set yet" placeholder (109:4815) instead of the spheres/energy row. */
  intention?: IntentionLog
  /**
   * From the evening reflection's "Glad about how this went?" Yes/Not
   * really answer. Kept on the data shape for other consumers (e.g.
   * Patterns aggregation) — this card itself no longer renders anything
   * from it (see the component doc comment's "review fix" section for
   * why the thumbs icon was removed).
   */
  gladAboutDay?: boolean
  moodCheckIns: MoodCheckInLogEntry[]
}

export interface CompletionSummaryCardProps extends DayLog {
  /**
   * 'today' (default) or 'history' — also drives the calendar date
   * badge's own today/past color variant (see `DateBadge` below).
   * Controls: the badge's colors, the section label's tense ("What
   * matters" vs "What mattered"), and — the one real STRUCTURAL
   * difference, not just restyling — what renders when there's no
   * intention: 'today' keeps Fix 21's "Not set yet" placeholder
   * (109:4815); 'history' drops that placeholder entirely and instead
   * labels the mood section itself "Mood check-ins" (128:715) with no
   * divider above it, since nothing else occupies that slot to divide
   * from.
   */
  context?: 'today' | 'history'
  /**
   * Makes the whole card a real tap target into the new day detail view
   * (335:2613) — same optional-prop/real-`<button>`-when-present pattern
   * as `DaySummaryCard`'s own `onClick`, not a new convention.
   */
  onClick?: () => void
}

/**
 * Only 2 mood log entries are shown before overflowing to "+N more" —
 * confirmed against 109:4278/109:4827, both of which show exactly 2
 * ("Upset", "Exhausted") + "+3 more" for 5 total check-ins, inside a
 * 319px-wide row. That width is text-length-dependent (2 short words fit;
 * a 3rd may or may not, depending on what it says), which a fixed
 * component prop can't reproduce exactly without live text measurement —
 * not implemented at this stage. 2 is used as a fixed, source-confirmed
 * cap rather than guessing a fits-dynamically-by-width algorithm; the
 * OVERFLOW COUNT itself is still computed live from the real entry count,
 * not hardcoded.
 */
const MAX_VISIBLE_MOODS = 2

/**
 * Same fixed-cap overflow pattern as `MAX_VISIBLE_MOODS` above, applied to
 * the intention chips row (review fix, now that up to 3 intentions/day
 * exist per Stage 4a). Confirmed by BOTH 294:2939 and 302:1723, which
 * show the exact same layout: 2 visible sphere+label chips ("Health",
 * "Finances") plus a plain "+1" for a 3-intention day — not "+1 more"
 * like the mood row's own text, so this one is rendered without the
 * " more" suffix, matching what's actually on the node.
 */
const MAX_VISIBLE_INTENTIONS = 2

/**
 * The calendar-shaped date badge (review fix) — replaces the old date
 * "pill" that peeked above the card (Fix 20/22/23). 'today' verified via
 * get_design_context + get_screenshot on 294:2939 (saturated `#f83f80`
 * header strip, white text, no border of its own). 'history'/past
 * re-verified against the dedicated standalone badge node 305:2035 (the
 * earlier 302:1723 card-embedded reading had 2 mismatches this corrects):
 * the header strip's border is `border-b` ONLY, not a border on all 4
 * sides — the strip's other 3 edges are unbordered, only the outer badge
 * box itself has a full `#eddde6` border (same hex, already tokenized as
 * `--color-completion-border`). The day number is the SAME dark `#212126`
 * for both 'today' and 'history' — 305:2035 shows this unambiguously
 * (not the softer `#46454a` gray an earlier pass used for past). Only the
 * header strip's own fill/text/shadow actually differ between the two
 * variants; the day number and weekday label (`#6a697b`) are shared. The
 * 58px size/8px outer radius/4px header-top radius/drop-shadow are also
 * shared by both. Month/weekday are formatted uppercase 3-letter
 * abbreviations (`Intl.DateTimeFormat`, `short`); the day number has no
 * leading zero, matching every fetched example ("10", "12").
 */
function DateBadge({ date, variant }: { date: Date; variant: 'today' | 'history' }) {
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date).toUpperCase()
  const day = date.getDate()
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase()
  const isToday = variant === 'today'

  return (
    <div
      className={cn('flex h-[73px] w-[58px] shrink-0 flex-col items-center gap-0.5 overflow-hidden rounded-[8px] bg-white pb-1.5', !isToday && 'border border-solid border-completion-border')}
      style={{ boxShadow: '0 0 8px 1px rgba(0,0,0,0.12)' }}
    >
      <div
        className={cn('flex w-full items-center justify-center rounded-t-[4px] px-2 py-1', !isToday && 'border-b border-solid border-completion-border')}
        style={{
          backgroundColor: isToday ? 'var(--color-calendar-today-header-bg)' : 'var(--color-calendar-past-header-bg)',
          boxShadow: isToday ? 'inset 0 -1px 2px #ec0e5c, inset 0 2px 2px rgba(255,255,255,0.3)' : 'inset -3px 0 9px rgba(255,255,255,0.5), inset 3px 6px 5px rgba(255,255,255,0.5)',
        }}
      >
        <p className={cn('font-sans text-[14px] font-semibold tracking-[-0.14px] uppercase', isToday ? 'text-white' : 'text-[#6c717f]')}>{month}</p>
      </div>
      {/* text-[18px] — review fix, was text-[20px] (that value's own Figma verification note is above); explicit direct request, applies to both variants since they share this one element. */}
      <p className="font-sans text-[18px] leading-none font-semibold tracking-[-0.2px] text-[var(--color-calendar-day-number)] uppercase">{day}</p>
      <p className="font-sans text-[12px] leading-none font-medium tracking-[-0.12px] uppercase text-[var(--color-calendar-weekday)]">{weekday}</p>
    </div>
  )
}

/**
 * The home screen's "something has happened today" card — replaces Fix
 * 17's empty-state DaySummaryCard once EITHER an intention or a mood
 * check-in exists for the day (CheckInScreen still renders DaySummaryCard
 * itself when NEITHER exists — that full empty state isn't a degenerate
 * case of this card, it's a structurally different component, verified
 * back in Fix 17).
 *
 * Also reused as-is for the Journal tab's history list (Fix 22, see
 * `context` on CompletionSummaryCardProps) — the three past-day nodes
 * fetched for that fix (128:679/128:697/128:715) are the SAME card
 * structure with only the differences the `context` prop's own doc
 * comment describes, not a separate card system.
 *
 * Review fix: that "EITHER an intention or a mood check-in exists"
 * contract used to be enforced only by convention (each caller was
 * supposed to check before rendering this component at all) — EntriesScreen
 * didn't, so a truly-empty today rendered this card anyway, which put
 * `rendersTopSlot`'s own "'today' always shows something" rule into play
 * and surfaced "Not set yet" alone as a stand-in for true emptiness, a
 * second, disagreeing empty-state treatment from CheckInScreen's correct
 * one. Now enforced here directly (see the early `return null` below) so
 * it can't happen regardless of which screen renders this card.
 *
 * (below: `intention`/`moodCheckIns` doc for the 'today' context —
 * 'history' behaves identically except where `context`'s own doc comment
 * says otherwise.)
 *
 * Renders 3 of the 4 non-empty data states, derived from the shape of
 * `DayLog` rather than a display-mode prop (Fix 21):
 *  - `intention` set + `moodCheckIns` non-empty → the full row (109:4252,
 *    Fix 20).
 *  - `intention` set, `moodCheckIns` empty → verified against 109:4603:
 *    same spheres/energy row, no mood section at all (no divider, no
 *    log row) — and no `pb-3` under "What matters" either, since nothing
 *    follows it (109:4610 has no bottom padding, unlike 109:4259/109:4822
 *    which both do, immediately before their own mood sections).
 *  - `intention` undefined, `moodCheckIns` non-empty → verified against
 *    109:4815: "What matters" is followed by a dashed `rgba(119,121,136,.8)`
 *    "Not set yet" placeholder (`--color-completion-mood-text` at 80%
 *    opacity — close enough to the export's raw rgba to be the same
 *    color, not a new one; Figma's own rgba/opacity export rounding does
 *    this elsewhere in the file too), 12px radius (`--radius-card`,
 *    already an existing token) — this is NOT Fix 17's full-card empty
 *    state reused, it's its own smaller slot just for the intention spot.
 *    The mood log row below it is identical to the complete state's.
 *
 * REVIEW FIX (4 corrections, verified against 294:2939 'today' and
 * 302:1723 'history'/past):
 *  1. Date display is now the calendar-shaped `DateBadge` above, on the
 *     card's left side, not the old peeking pill — see that component's
 *     own doc comment. The outer card itself also picks up this fix's
 *     new shared chrome (`rounded-[16px]`, `p-3`, the translucent
 *     `--color-daycard-border` pink) straight from both fetched nodes,
 *     which — unlike the old pill design — use the SAME border for both
 *     today and history, no longer two separate tokens.
 *  2. The thumbs-up/down icon is REMOVED from this card entirely: with
 *     up to 3 intentions/day now possible (Stage 4a), one thumbs icon per
 *     intention would overcrowd this compact preview. Neither fetched
 *     node shows any replacement for it at this scale (no alternate
 *     reflection-outcome glyph anywhere in either export) — flagged per
 *     the brief's own instruction not to invent one. `gladAboutDay`
 *     stays on the `DayLog` data shape for other consumers; this
 *     component just no longer reads or renders it.
 *  3. The intention chips row now overflows to a plain "+N" past 2
 *     visible chips, mirroring the mood row's own `MAX_VISIBLE_MOODS`
 *     pattern (see `MAX_VISIBLE_INTENTIONS` above) — both fetched nodes
 *     show exactly this: 2 chips + "+1" for a 3-intention day.
 *  4. The battery icon already read `intention.energyLevel` correctly
 *     here (`ENERGY_LEVEL_ICON[intention.energyLevel]`, unchanged by this
 *     fix) — the "fixed fill" symptom traced to EntriesScreen's mock
 *     history data reusing one hardcoded `energyLevel: 'low'` object for
 *     every past day, now fixed there instead (see that file). Both
 *     fetched nodes' own battery example is `low` energy, confirmed
 *     byte-exact (via `get_design_context`'s raw SVG path, rescaled) as
 *     Phosphor's own `BatteryVerticalLow` "fill"-weight glyph — this
 *     family is a single continuous fill-height battery, not discrete
 *     bar segments, so `ENERGY_LEVEL_ICON`'s existing low/medium/high →
 *     distinct-icon mapping (lib/spheres.ts) is the correct
 *     implementation of it. Medium/high remain unconfirmed by any
 *     fetched node (same caveat lib/spheres.ts already carries) — flagged
 *     here again rather than silently treated as verified.
 *
 * Icon weights: every icon on this card (PersonArmsSpread, TrendUp,
 * BatteryVerticalLow/Medium/High, LightningSlash) is Phosphor's stock
 * "fill" weight, confirmed by diffing each Figma export's raw SVG path
 * against @phosphor-icons/react's own source — consistent with the
 * filled-icon precedent already established for mood-related icons
 * elsewhere (SegmentedFilterPill, MoodCategorySelector).
 *
 * NOT confirmed by any fetched node (flagged per the brief's own request):
 *  - 6 of the 8 life-sphere icons (only Health/Work are real) — see
 *    lib/spheres.ts.
 *  - A single confirmed battery color: 109:4252's low-energy example uses
 *    `#E067A9`, but 109:4603's ALSO-low-energy example uses a different
 *    `#E58704` — the two source nodes disagree with each other, so
 *    there's no one reliable "energy level → color" mapping to extract.
 *    `ENERGY_LEVEL_COLOR` (lib/spheres.ts) keeps the original `#E067A9`
 *    for all 3 levels as the simplest defensible choice given that
 *    conflict, not a confirmed system.
 */
export function CompletionSummaryCard({ date, intention, moodCheckIns, context = 'today', onClick }: CompletionSummaryCardProps) {
  const hasMoodCheckIns = moodCheckIns.length > 0

  // True-empty guard (review fix) — this card exists to summarize REAL
  // content for a day; a day with neither an intention nor a mood
  // check-in has nothing to summarize. Callers own the true-empty state
  // themselves (CheckInScreen renders DaySummaryCard's dashed "What's on
  // your mind today?" card instead — see this component's own doc
  // comment), but this guard makes that the only possible outcome
  // regardless of caller: without it, `rendersTopSlot` below still puts
  // SOMETHING in the top slot for `context === 'today'` even with no real
  // data, which used to render "Not set yet" alone as a stand-in for true
  // emptiness — exactly the inconsistency a second caller (EntriesScreen)
  // that skipped the DaySummaryCard branch entirely used to expose.
  if (!intention && !hasMoodCheckIns) return null

  const Root = (onClick ? 'button' : 'div') as ElementType
  const EnergyIcon = intention ? ENERGY_LEVEL_ICON[intention.energyLevel] : null
  const visibleMoods = moodCheckIns.slice(0, MAX_VISIBLE_MOODS)
  const overflowCount = Math.max(0, moodCheckIns.length - MAX_VISIBLE_MOODS)
  const visibleSpheres = intention ? intention.spheres.slice(0, MAX_VISIBLE_INTENTIONS) : []
  const intentionOverflowCount = intention ? Math.max(0, intention.spheres.length - MAX_VISIBLE_INTENTIONS) : 0

  // Whether anything renders in the "top slot" at all — 'today' always
  // puts SOMETHING there (real intention, or the "Not set yet"
  // placeholder); 'history' only does when there's a real intention.
  // Everything below (the divider + label logic) branches on this, not
  // on `intention` directly.
  const rendersTopSlot = !!intention || context === 'today'

  return (
    <Root
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('flex w-full items-center gap-4 rounded-[16px] border border-solid bg-white p-3', onClick && 'focus-ring pressable text-left')}
      style={{ borderColor: 'var(--color-daycard-border)' }}
    >
      <DateBadge date={date} variant={context} />

      <div className="flex min-w-0 flex-1 flex-col items-start">
        {rendersTopSlot && (
          <div className={cn('flex w-full flex-col items-start gap-2', hasMoodCheckIns && 'pb-2')}>
            <p className="font-sans text-sm leading-[1.2] font-medium tracking-[-0.14px] text-ink/65">{context === 'history' ? 'What mattered' : 'What matters'}</p>
            {intention ? (
              <div className="flex items-center">
                <div className="flex items-center gap-3 border-r-[0.5px] border-solid border-completion-divider pr-2">
                  <div className="flex items-center gap-3">
                    {visibleSpheres.map((sphereId) => {
                      const sphere = SPHERES[sphereId]
                      const SphereIcon = sphere.icon
                      return (
                        <div key={sphereId} className="flex items-center gap-1.5">
                          <SphereIcon size={16} weight="fill" className="text-ink" />
                          <p className="font-sans text-base leading-[1.2] tracking-[-0.16px] text-ink">{sphere.label}</p>
                        </div>
                      )
                    })}
                  </div>
                  {intentionOverflowCount > 0 && <p className="font-sans text-sm leading-[1.2] font-medium tracking-[-0.14px] text-completion-mood-text">+{intentionOverflowCount}</p>}
                </div>
                <div className="flex items-center gap-1 pl-2">{EnergyIcon && <EnergyIcon size={20} weight="fill" color={ENERGY_LEVEL_COLOR} />}</div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-center rounded-card border border-dashed border-completion-mood-text/80 px-2 py-3.5">
                <p className="font-sans text-base tracking-[-0.16px] whitespace-nowrap text-ink">Not set yet</p>
              </div>
            )}
          </div>
        )}

        {hasMoodCheckIns && (
          <div className={cn('flex w-full flex-col items-start', rendersTopSlot ? 'border-t border-solid border-completion-border pt-3' : 'gap-3')}>
            {/*
              "Mood check-ins" only appears when this section is the
              card's ONLY content (128:715) — when an intention (or its
              placeholder) already occupies the top slot, this section
              stays unlabeled, same as the 'today' complete state (Fix 20).
            */}
            {!rendersTopSlot && <p className="font-sans text-sm font-medium tracking-[-0.14px] text-ink/65">Mood check-ins</p>}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {visibleMoods.map((entry) => {
                  const MoodIcon = MOOD_CATEGORIES.find((c) => c.id === entry.categoryId)?.icon ?? MOOD_CATEGORIES[0].icon
                  return (
                    <div key={entry.id} className="flex items-center gap-1">
                      <MoodIcon size={14} weight="fill" className={rendersTopSlot ? 'text-completion-mood-text' : 'text-ink'} />
                      <p className={cn('font-sans text-sm leading-[1.2] tracking-[-0.14px]', rendersTopSlot ? 'text-completion-mood-text' : 'text-ink')}>{entry.emotion}</p>
                    </div>
                  )
                })}
              </div>
              {overflowCount > 0 && <p className="font-sans text-sm leading-[1.2] font-medium tracking-[-0.14px] text-completion-mood-text">+{overflowCount} more</p>}
            </div>
          </div>
        )}
      </div>
    </Root>
  )
}
