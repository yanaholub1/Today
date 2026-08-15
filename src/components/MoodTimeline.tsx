import type { MoodTimelineBucket } from '../lib/patternsAggregation'
import { MOOD_QUADRANTS } from '../lib/moodCategories'
import { cn } from '../lib/cn'

export interface MoodTimelineProps {
  buckets: MoodTimelineBucket[]
  className?: string
}

const QUADRANT_COLOR = Object.fromEntries(MOOD_QUADRANTS.map((q) => [q.id, q.textColor]))

const DOT_SIZE = 10
const DOT_GAP = 3
const MAX_VISIBLE_DOTS = 6
const COLUMN_MIN_HEIGHT = (DOT_SIZE + DOT_GAP) * MAX_VISIBLE_DOTS

/**
 * Mood-over-time timeline (Fix 25, section 1) — a horizontal row of
 * day/week/fortnight columns (bucketing decided by `buildMoodTimeline`,
 * see that function's own doc comment for why), each column stacking one
 * small dot per mood check-in rather than averaging same-day check-ins
 * into a single mark, per explicit direct request. Dot color is the
 * mood-quadrant's own `textColor` (Fix 8/9/11's rose/green/blue/gold
 * family, `lib/moodCategories.ts`'s `MOOD_QUADRANTS`) — the saturated
 * variant, not the pale card-fill color those same records also carry,
 * since a 10px dot needs the more legible, higher-contrast value.
 *
 * No Figma reference exists for this screen (see other Patterns
 * components' own doc comments) — built as plain stacked circles on a
 * baseline, the most literal reading of "small colored marks... stacked."
 * A column with more than `MAX_VISIBLE_DOTS` entries (unlikely at this
 * app's realistic check-in volume, but not impossible for a wide
 * all-time bucket) caps its visible stack and shows a "+N" count instead
 * of growing the row's height unboundedly.
 */
export function MoodTimeline({ buckets, className }: MoodTimelineProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="flex items-end gap-2" style={{ minHeight: COLUMN_MIN_HEIGHT + 24 }}>
        {buckets.map((bucket) => {
          const visible = bucket.entries.slice(0, MAX_VISIBLE_DOTS)
          const overflow = bucket.entries.length - visible.length
          return (
            <div key={bucket.key} className="flex w-6 shrink-0 flex-col items-center gap-1.5">
              <div className="flex flex-col-reverse items-center gap-[3px]" style={{ minHeight: COLUMN_MIN_HEIGHT }}>
                {overflow > 0 && <span className="font-sans text-[9px] font-medium text-ink/50">+{overflow}</span>}
                {visible.map((entry, i) => (
                  <span
                    key={`${entry.createdAt}-${i}`}
                    className="shrink-0 rounded-full"
                    style={{ width: DOT_SIZE, height: DOT_SIZE, backgroundColor: QUADRANT_COLOR[entry.quadrant] }}
                    title={entry.quadrant}
                  />
                ))}
              </div>
              <span className="font-sans text-[10px] font-medium whitespace-nowrap text-ink/50">{bucket.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
