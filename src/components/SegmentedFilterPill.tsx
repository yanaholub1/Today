import type { Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export interface SegmentedFilterPillItem {
  id: string
  icon: Icon
  /** Accessible name for this icon-only segment — the source is visual-only, so this is required, not optional. */
  label: string
  /**
   * Selected-state fill/border/box-shadow/icon color for this specific
   * segment — e.g. from `MOOD_CATEGORIES`/`MOOD_QUADRANTS`
   * (src/lib/moodCategories.ts), the shared source also used by
   * MoodCategorySelector, so the two stay in sync. `iconColor` is optional
   * (falls back to the default dark icon) since it was added after
   * `fill`/`border`/`boxShadow` — omit the whole object to fall back to the
   * plain neutral "selected" look entirely.
   */
  selected?: { fill: string; border: string; boxShadow: string; iconColor?: string }
}

export interface SegmentedFilterPillProps {
  items: SegmentedFilterPillItem[]
  activeId: string
  onActiveChange?: (id: string) => void
  onSeeAll?: () => void
  /** When true, none of `items` renders as selected and "See all" itself renders highlighted instead — explicit direct request, so picking "See all" reads as its own selected state rather than leaving a stale category pill highlighted underneath it. */
  seeAllActive?: boolean
  className?: string
}

/**
 * Row of icon-only pill segments inside a single clipping frame — explicit
 * direct request, superseding the earlier per-segment-overlap/asymmetric-
 * rounding approach (which had no frame at all, each idle segment carrying
 * its own rounded corners and a -28px overlap to fake one fused capsule).
 *
 * The frame itself is now the only thing that shapes the capsule: fixed
 * 293x54px, `rounded-pill` (400px), 1px inside stroke `#ddd4da`, fill
 * `#fbf8fa` (both values match the already-defined `MOOD_CATEGORY_DEFAULT`
 * in lib/moodCategories.ts), and `overflow-hidden` so idle segments don't
 * need any rounding of their own — the frame crops them into the capsule
 * shape. Every segment — selected included — is
 * `basis-1/4 grow-0 shrink-0 min-w-0`, so all 4 split the 293px frame
 * evenly (explicit correction: an earlier pass gave the selected segment a
 * fixed 94px width with the 3 idle segments splitting only the remainder).
 *
 * `basis-1/4` (a fixed percentage) + `grow-0 shrink-0`, not `flex-1`: idle
 * segments carry `px-6` padding but the selected segment has none, so an
 * equal-`flex-grow` split (`flex-1`, i.e. `flex: 1 1 0%`) came out visibly
 * unequal even with `min-width: 0` forced via `!important` — verified in an
 * isolated sandbox outside React/Tailwind entirely, so this isn't
 * app-specific: identical numbers reproduced with plain `<button>`s (a
 * known class of flex-sizing quirk on form-control elements). Giving every
 * segment the SAME fixed `flex-basis` instead of asking `flex-grow` to
 * compute equal shares fixed it — but `min-w-0` is still required
 * alongside the fixed basis too, for the same reason as before: without
 * it, a padded segment's browser-default content-based floor (`min-width:
 * auto`) can still exceed its 25% basis and force it wider than the
 * unpadded segment. Both together were confirmed to produce exactly equal
 * widths in the same sandbox. This assumes exactly 4 segments (both real
 * call sites have 4); a different count would need a different fraction.
 *
 * Idle segments are plain and flat: no fill, no border, no radius, `px-6`
 * (24px) padding each side, zero gap between any segment (true DOM
 * adjacency, not a negative-margin overlap), and a muted gray icon color
 * (`#787d89`, no confirmed hex from source — same gray already used for
 * TechniqueCard's muted label, kept consistent rather than inventing a new
 * one).
 *
 * The selected segment keeps its own category fill/border/shadow (still
 * verified against 109:3408/109:3424, 109:3522, 111:5363, 111:5442), full
 * rounding, a stroke drawn as an outside box-shadow ring rather than a real
 * `border` (see inline comment below for why), `z-10` so that ring stays
 * visible over the adjacent idle segments at the seam, and — explicit
 * direct request — its icon recolors to `selected.iconColor` (e.g.
 * `MOOD_QUADRANTS[n].textColor`, already Figma-confirmed per quadrant),
 * falling back to the default dark icon color when omitted.
 *
 * `seeAllActive` (explicit direct request) forces `selectedIndex` to -1 so
 * every segment renders idle regardless of `activeId`, and swaps "See
 * all"'s own text color to the brand pink (`text-warm`) instead of ink —
 * the two are mutually exclusive selected states, not "See all" layered on
 * top of a still-highlighted category pill.
 */
export function SegmentedFilterPill({ items, activeId, onActiveChange, onSeeAll, seeAllActive, className }: SegmentedFilterPillProps) {
  const selectedIndex = seeAllActive ? -1 : items.findIndex((i) => i.id === activeId)

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex h-[54px] w-[293px] items-center overflow-hidden rounded-pill border border-solid border-[#ddd4da] bg-[#fbf8fa]">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex
          const Icon = item.icon

          if (isSelected) {
            const style = item.selected ?? { fill: '#f8edf3', border: '#e9cedd', boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 4px 4px rgba(255,255,255,0.35)' }
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-pressed
                onClick={() => onActiveChange?.(item.id)}
                className="focus-ring z-10 flex h-[54px] min-w-0 basis-1/4 grow-0 shrink-0 items-center justify-center rounded-pill"
                style={{
                  backgroundColor: style.fill,
                  // Figma's stroke on this shape is "outside" alignment —
                  // it extends past the shape's own bounds rather than
                  // eating into it. A plain `border` doesn't have that
                  // concept once box-sizing:border-box is in play (this
                  // project's Tailwind base resets every element to it),
                  // so it'd draw the stroke inward instead. `outline`
                  // would be the natural fix, but this element already
                  // uses `outline` for its `focus-ring` focus-visible
                  // state — an inline `outline` here would permanently
                  // win over that (inline styles beat classes) and break
                  // keyboard focus. A zero-blur, 1px-spread box-shadow
                  // achieves the same "solid ring sitting outside the
                  // box, following border-radius" effect without
                  // touching `outline`, stacked as an extra layer after
                  // the category's own sheen shadow.
                  boxShadow: `${style.boxShadow}, 0 0 0 1px ${style.border}`,
                }}
              >
                <Icon size={28} weight="fill" color={style.iconColor} />
              </button>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={false}
              onClick={() => onActiveChange?.(item.id)}
              className="focus-ring flex min-w-0 basis-1/4 grow-0 shrink-0 items-center justify-center px-6 py-3 text-[#787d89]"
            >
              <Icon size={28} weight="fill" />
            </button>
          )
        })}
      </div>

      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          aria-pressed={seeAllActive}
          className={cn('focus-ring ml-3 shrink-0 whitespace-nowrap font-sans text-base font-medium', seeAllActive ? 'text-warm' : 'text-ink')}
        >
          See all
        </button>
      )}
    </div>
  )
}
