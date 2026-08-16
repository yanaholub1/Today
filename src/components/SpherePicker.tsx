import { SheenSurface } from './SheenSurface'
import { SPHERES } from '../lib/spheres'
import type { SphereId } from '../lib/spheres'
import { cn } from '../lib/cn'

export interface SpherePickerProps {
  value: SphereId | null
  onChange: (sphere: SphereId) => void
  className?: string
}

/**
 * Single-select grid of the 8 life-sphere pills — verified against node
 * 109:2863 (unselected: `#fef6fa` fill, `#fbdfef` border, ink icon/text)
 * and 134:3413 (selected: `#930845` fill, `#cd92ac` border, white
 * icon/text). Icon is 20x20px with 11px top/bottom padding on the pill
 * (explicit direct request, superseding the original 24px icon/12px
 * padding pulled from those nodes) — applies identically to both
 * selected and unselected, since this is one shared button markup for
 * both states, not two separate ones. NOT ChoiceChip: that component is
 * hardwired to the 'chip'
 * SheenSurface scale (12px-radius card, 4-layer sheen shadow), while these
 * pills are true pills (400px radius) with a flat 2-layer shadow — a
 * different enough shape/shadow pairing that overriding ChoiceChip's own
 * baked-in classes isn't reliable (Tailwind resolves same-specificity
 * conflicts by generation order in the compiled stylesheet, not by
 * className string order — the exact issue that bit BottomNav's FAB
 * positioning once already). Built directly on SheenSurface instead, at
 * `scale="filter"` (the existing 2-layer shadow geometry already matches).
 *
 * `flex-wrap`, not a fixed 2-column grid: 109:2863's own pills hug their
 * label's width rather than stretching to fill equal grid cells (e.g.
 * "Health" and "Finances" share a row despite different lengths, while
 * "Home & environment" effectively takes its own row) — a real CSS
 * flex-wrap reproduces that natural wrapping robustly regardless of exact
 * rendered text width, rather than hardcoding the specific row groupings
 * Figma's export happened to produce at its one tested frame width.
 */
export function SpherePicker({ value, onChange, className }: SpherePickerProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Object.values(SPHERES).map((sphere) => {
        const Icon = sphere.icon
        const selected = value === sphere.id
        return (
          <SheenSurface
            key={sphere.id}
            as="button"
            type="button"
            hue={selected ? 'sphere-selected' : 'sphere-pale'}
            scale="filter"
            aria-pressed={selected}
            className="focus-ring pressable flex shrink-0 items-center gap-2 rounded-pill pt-[11px] pb-[11px] pr-3.5 pl-3"
            onClick={() => onChange(sphere.id)}
          >
            <Icon size={20} weight="fill" />
            <span className="font-sans text-base font-medium whitespace-nowrap">{sphere.label}</span>
          </SheenSurface>
        )
      })}
    </div>
  )
}
