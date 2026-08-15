import { MOOD_QUADRANTS } from '../lib/moodCategories'
import type { MoodQuadrantId } from '../lib/moodCategories'
import { cn } from '../lib/cn'

/** Unselected-chip fill/border/shadow — explicit direct request, not from any audited node. */
const UNSELECTED_STYLE = {
  backgroundColor: '#f5f0f2',
  borderColor: '#eddde6',
  boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 2px 2px rgba(255,255,255,0.44)',
}

export interface EmotionGridItem {
  emotion: string
  quadrant: MoodQuadrantId
}

export interface EmotionGridProps {
  /**
   * Each item carries its OWN quadrant, not one shared quadrant for the
   * whole grid — needed so the same component can render both a single
   * quadrant's 8 emotions (all sharing one quadrant) and the "See all" flat
   * list of all 32 (mixed quadrants), coloring each selected chip by its
   * own quadrant rather than one grid-wide color.
   */
  items: EmotionGridItem[]
  value: string | null
  onChange: (item: EmotionGridItem) => void
  className?: string
}

/**
 * Tap-to-select grid of emotion words — either one quadrant's ~8 (all
 * sharing that quadrant's color) or the "See all" flat list of all 32
 * (each chip colored by its own quadrant, since they're mixed). No Figma
 * node exists for this screen (see MoodFlowScreen's own doc comment), so
 * this is a new lightweight component rather than a guess dressed up as a
 * verified one — it extends ChoiceChip's own "flat pill, colored only when selected"
 * pattern to all 4 quadrant colors, reusing MOOD_QUADRANTS' already-
 * confirmed fill/border/boxShadow/textColor (from MoodCategorySelector)
 * rather than inventing new ones. Not built directly on ChoiceChip: that
 * component's `family` prop is hardwired to exactly 2 values (warm/cool)
 * used by other existing screens, and branching it out to 4 quadrant
 * families risked regressing those call sites — the same reasoning that
 * led to building SpherePicker fresh instead of stretching ChoiceChip for
 * the intention flow's pills.
 *
 * The unselected look is its own explicit spec (`UNSELECTED_STYLE` above),
 * not shared with SegmentedFilterPill/MoodCategorySelector's idle look:
 * `#f5f0f2` fill, `#eddde6` border, and a 2-layer inset shadow
 * (`0 -2px 3px rgba(0,0,0,.05)` + `0 2px 2px rgba(255,255,255,.44)`). Both
 * selected and unselected share the same 400px radius (`rounded-pill`,
 * fully rounded) — explicit direct request, superseding an earlier pass
 * that gave the selected chip `rounded-card` (12px) instead.
 *
 * Plain functional tap-to-select only — the brief's "glow/flame" tap-to-
 * bloom interaction is explicitly NOT implemented here, per its own
 * instruction not to invent that animation without real Figma nodes.
 *
 * Pills are `h-12` (48px) — explicit direct correction: previously sized
 * by `py-3` padding alone, now a fixed height with `items-center`/
 * `justify-center` doing the centering instead.
 */
export function EmotionGrid({ items, value, onChange, className }: EmotionGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {items.map((item) => {
        const selected = value === item.emotion
        const quadrantDef = MOOD_QUADRANTS.find((q) => q.id === item.quadrant)!
        return (
          <button
            key={item.emotion}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item)}
            className={cn('focus-ring flex h-12 items-center justify-center rounded-pill border border-solid px-4 text-center font-sans text-base font-medium', !selected && 'text-ink')}
            style={
              selected
                ? { backgroundColor: quadrantDef.fill, borderColor: quadrantDef.border, boxShadow: quadrantDef.boxShadow, color: quadrantDef.textColor }
                : UNSELECTED_STYLE
            }
          >
            {item.emotion}
          </button>
        )
      })}
    </div>
  )
}
