import { SheenSurface } from './SheenSurface'
import { cn } from '../lib/cn'

export interface PillSubtabSwitcherItem<T extends string> {
  id: T
  label: string
}

export interface PillSubtabSwitcherProps<T extends string> {
  items: PillSubtabSwitcherItem<T>[]
  activeId: T
  onChange: (id: T) => void
  className?: string
}

/**
 * Patterns' "Intention"/"Mood" pill subtab switcher (Review fix, replacing
 * the old underline `TabSwitcher` grouping for this screen only —
 * `TabSwitcher` itself is untouched and still used by `SecondaryNav`).
 * Verified against node 323:4609: a `--color-pill-switch-bg` capsule
 * container with no padding/gap of its own, holding 2 pill buttons that
 * sit directly adjacent (no visible gap between them in the source).
 *
 * Reuses `SheenSurface`'s existing `filter`-scale sheen system for the
 * selected pill (new `pill-switch-active` hue — see that component's own
 * doc comment) rather than a new styling system; the unselected pill is
 * plain text on the shared gray background, same "flat unselected, styled
 * selected" pattern already used throughout the app's other pill/chip
 * components. Each pill hugs its label but never shrinks below 100px,
 * regardless of label length (explicit direct spec, confirmed by
 * 323:4609's own "Mood" segment carrying a fixed `w-[100px]` despite its
 * short label).
 */
export function PillSubtabSwitcher<T extends string>({ items, activeId, onChange, className }: PillSubtabSwitcherProps<T>) {
  return (
    <div className={cn('flex items-center rounded-pill bg-pill-switch-bg', className)}>
      {items.map(({ id, label }) => {
        const isActive = id === activeId
        if (isActive) {
          return (
            <SheenSurface
              key={id}
              as="button"
              type="button"
              hue="pill-switch-active"
              scale="filter"
              aria-pressed
              onClick={() => onChange(id)}
              className="focus-ring pressable z-[2] flex min-w-[100px] items-center justify-center rounded-pill px-4 py-3"
            >
              <span className="font-sans text-base font-semibold whitespace-nowrap">{label}</span>
            </SheenSurface>
          )
        }
        return (
          <button
            key={id}
            type="button"
            aria-pressed={false}
            onClick={() => onChange(id)}
            className="focus-ring pressable z-[1] flex min-w-[100px] items-center justify-center rounded-pill px-4 py-3"
          >
            <span className="font-sans text-base font-medium whitespace-nowrap text-ink/76">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
