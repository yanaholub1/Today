import { SheenSurface } from './SheenSurface'
import { SPHERES } from '../lib/spheres'
import type { SphereId } from '../lib/spheres'
import { cn } from '../lib/cn'

export interface LifeAreaPickerSheetProps {
  open: boolean
  value: SphereId | null
  onSelect: (sphere: SphereId) => void
  onDismiss: () => void
}

// SPHERES' own insertion order split down the middle — verified against
// 178:8845: column 1 is Health/Finances/Romance/Fun & hobbies (the first
// 4 entries in lib/spheres.ts), column 2 is Home/Family/Personal growth/
// Work (the last 4) — a column-major split, not a row-major left-to-right
// grid.
const SPHERE_LIST = Object.values(SPHERES)
const COLUMN_1 = SPHERE_LIST.slice(0, 4)
const COLUMN_2 = SPHERE_LIST.slice(4)

/**
 * Bottom sheet for the morning intention flow's "Which area does it
 * support?" dropdown (Fix 24) — verified against 178:8845 (empty) and
 * 178:8937 (a pill selected). Structurally the same chrome recipe as
 * `CheckInMenuSheet`'s popup (`rounded-t-[24px]`, `border-black/10`,
 * `shadow-[0px_-3px_24px_rgba(0,0,0,0.12)]`, `pt-8 pb-10 px-5`), not
 * `ReasonPickerSheet`'s (no drag handle here, confirmed absent in both
 * fetched nodes).
 *
 * The scrim is a genuinely different treatment from every other sheet in
 * the app — a light `bg-white/30` wash, not the usual dark `bg-ink/40` —
 * confirmed by 178:8845's own `rgba(255,255,255,0.3)` overlay layer, not
 * assumed to be an export quirk.
 *
 * Pills use the new `sphere-fixed` hue (fixed light pink) when selected,
 * NOT `SpherePicker`'s own dark `sphere-selected` — a real, confirmed
 * difference between this sheet's selection color and the other sphere
 * picker's, not a mistake to reconcile. Two flex-col columns (not a CSS
 * grid), full-width centered pills — a different geometry from
 * `SpherePicker`'s own auto-width `flex-wrap` pills, so this doesn't reuse
 * that component. `gap-[12px]` both between the two columns AND between
 * pills within a column (explicit direct correction — the columns' own
 * gap was 8px before, not matching the 12px used for the pills), with
 * both the columns and every pill inside them stretching to fill the full
 * available width (`flex-1`/`w-full`), not hugging content.
 *
 * Pills are `h-[48px]` (explicit direct correction, was 54px).
 */
export function LifeAreaPickerSheet({ open, value, onSelect, onDismiss }: LifeAreaPickerSheetProps) {
  const renderColumn = (spheres: typeof SPHERE_LIST) => (
    <div className="flex flex-1 flex-col items-start gap-3">
      {spheres.map((sphere) => {
        const Icon = sphere.icon
        const selected = value === sphere.id
        return (
          <SheenSurface
            key={sphere.id}
            as="button"
            type="button"
            hue={selected ? 'sphere-fixed' : 'sphere-pale'}
            scale="filter"
            aria-pressed={selected}
            className="focus-ring pressable flex h-[48px] w-full items-center justify-center gap-2 rounded-pill pr-3.5 pl-3"
            onClick={() => onSelect(sphere.id)}
          >
            <Icon size={20} weight="fill" />
            <span className="font-sans text-base font-medium whitespace-nowrap">{sphere.label}</span>
          </SheenSurface>
        )
      })}
    </div>
  )

  return (
    <div className={open ? 'pointer-events-auto fixed inset-0 z-40' : 'pointer-events-none fixed inset-0 z-40'}>
      <div
        aria-hidden="true"
        onClick={onDismiss}
        className={cn('absolute inset-0 bg-white/30 transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Life areas"
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex w-full sm:max-w-[393px] flex-col gap-5 rounded-t-[24px] border border-solid border-black/10 bg-white px-5 pt-8 pb-10 shadow-[0px_-3px_24px_0px_rgba(0,0,0,0.12)] transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <p className="font-sans text-lg font-medium text-ink">Life areas</p>
        <div className="flex w-full items-start gap-3">
          {renderColumn(COLUMN_1)}
          {renderColumn(COLUMN_2)}
        </div>
      </div>
    </div>
  )
}
