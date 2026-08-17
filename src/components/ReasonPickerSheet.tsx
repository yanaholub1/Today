import { SheenSurface } from './SheenSurface'
import type { ReflectionTagPair } from '../lib/reflectionTags'
import { reflectionTagLabel } from '../lib/reflectionTags'
import { cn } from '../lib/cn'

export interface ReasonPickerSheetProps {
  open: boolean
  title: string
  tags: ReflectionTagPair[]
  glad: boolean
  value: string | null
  onSelect: (tagId: string) => void
  onDismiss: () => void
}

/**
 * Bottom sheet for picking a reflection reason ("What helped?"/"What got
 * in the way?") — explicit direct request: "the same component and pills"
 * as the intention flow's life-area picker, minus the icon (these tags
 * have no icon, unlike spheres). Reuses `SpherePicker`'s exact pill
 * recipe — `SheenSurface` at `hue="sphere-pale"`/`"sphere-selected"`,
 * `scale="filter"`, `flex-wrap` layout — rather than a new color system,
 * since no reflection-tag-specific palette exists anywhere in this app.
 *
 * `flex-wrap` (each pill hugging its own label width), not a 2-column
 * grid: an earlier pass tried a fixed grid ("organised on a two-column
 * sheet") but it didn't work in practice — reverted back to this, the
 * original working layout, per explicit direct request.
 *
 * The sheet chrome itself (scrim, rounded-top-24 white panel, drag handle)
 * mirrors `FeelBetterSheet`'s already-established pattern. Picking a pill
 * both selects it and closes the sheet in one tap — the parent's
 * `onSelect` is expected to do both, matching `FeelBetterSheet`'s own
 * "answer = action" interaction rather than needing a separate confirm
 * step.
 *
 * Review fix: reverted back to single-select (Stage 4a's original
 * behavior) — an intervening multi-select pass (up to 3, capped, with a
 * "Done" button and per-pill disable-at-cap) has been undone entirely,
 * not just visually; this component no longer owns any selection-count
 * state or cap logic at all.
 *
 * Pills are `h-12` (48px) — explicit direct correction: previously sized
 * by `py-3` padding alone (no fixed height), now a fixed height with
 * `items-center`/`justify-center` doing the centering instead, matching
 * `LifeAreaPickerSheet`'s own pills (48px, "the same component and
 * pills" this sheet was always meant to match).
 */
export function ReasonPickerSheet({ open, title, tags, glad, value, onSelect, onDismiss }: ReasonPickerSheetProps) {
  return (
    <div className={open ? 'pointer-events-auto fixed inset-0 z-40' : 'pointer-events-none fixed inset-0 z-40'}>
      <div
        aria-hidden="true"
        onClick={onDismiss}
        className={cn('absolute inset-0 bg-[rgba(0,0,0,0.45)] transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex w-full sm:max-w-[393px] flex-col items-center gap-5 rounded-t-[24px] bg-white px-5 pt-3 pb-10 transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="h-1 w-10 shrink-0 rounded-full bg-[rgba(23,23,28,0.25)]" />
        <div className="flex w-full flex-col items-start gap-5">
          <p className="w-full font-sans text-lg font-semibold text-ink">{title}</p>
          <div className="flex w-full flex-wrap gap-2">
            {tags.map((pair) => {
              const selected = value === pair.id
              return (
                <SheenSurface
                  key={pair.id}
                  as="button"
                  type="button"
                  hue={selected ? 'sphere-selected' : 'sphere-pale'}
                  scale="filter"
                  aria-pressed={selected}
                  className="focus-ring pressable flex h-12 items-center justify-center rounded-pill px-3.5"
                  onClick={() => onSelect(pair.id)}
                >
                  <span className="font-sans text-base font-medium whitespace-nowrap">{reflectionTagLabel(pair, glad)}</span>
                </SheenSurface>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
