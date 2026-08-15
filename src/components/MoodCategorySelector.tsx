import type { MoodQuadrantId } from '../lib/moodCategories'
import { MOOD_QUADRANTS } from '../lib/moodCategories'
import { cn } from '../lib/cn'

export interface MoodCategorySelectorProps {
  onSelect: (id: MoodQuadrantId) => void
  className?: string
}

/**
 * 2x2 grid of the 4 mood/energy quadrants — verified against node
 * 109:3033, which shows all 4 already at their permanent resting look
 * (fill, border, shadow, filled icon, full 2-line copy). There is no
 * "unselected/dimmed" state in the source: each card's color is its own
 * fixed identity, visible unconditionally, not something a tap reveals.
 * Tapping a card is a one-way action (navigate to that quadrant's emotion
 * list), not a togglable selection, so this component holds no selected-
 * state of its own — it only reports which card was tapped.
 *
 * Icons use Phosphor's "fill" weight specifically for this component —
 * confirmed via the 109:3033 screenshot (solid icon silhouettes, not thin
 * outlines) — unlike the "regular" (outline) weight used everywhere else
 * in this library (e.g. IconTapTarget, SegmentedFilterPill).
 *
 * Uses `MOOD_QUADRANTS` (src/lib/moodCategories.ts), which is deliberately
 * separate from `MOOD_CATEGORIES` (the linear intensity switcher's data,
 * used by SegmentedFilterPill) — the two components turned out to
 * represent different Figma structures with different colors and copy,
 * not one shared category system as an earlier pass assumed before this
 * node had been fetched.
 */
export function MoodCategorySelector({ onSelect, className }: MoodCategorySelectorProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {MOOD_QUADRANTS.map((quadrant) => {
        const Icon = quadrant.icon
        return (
          <button
            key={quadrant.id}
            type="button"
            onClick={() => onSelect(quadrant.id)}
            className="focus-ring flex aspect-square flex-col items-center justify-center gap-3 rounded-hero border border-solid px-4 py-5 text-center"
            style={{
              backgroundColor: quadrant.fill,
              borderColor: quadrant.border,
              boxShadow: quadrant.boxShadow,
              color: quadrant.textColor,
            }}
          >
            <Icon size={32} weight="fill" />
            <span className="font-sans text-lg font-medium tracking-[-0.18px]">
              <span className="block">{quadrant.lines[0]}</span>
              <span className="block">{quadrant.lines[1]}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
