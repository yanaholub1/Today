import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface RankedBarRowProps {
  icon?: ReactNode
  label: string
  value: number
  max: number
  trailing: string
  barColor?: string
  className?: string
}

/**
 * A single ranked-list row: icon + label on top, a proportional bar below,
 * a trailing stat (count or percentage) at the end of the label line. No
 * Figma reference exists for this screen (see `TrendBarChart`'s own doc
 * comment) — built from the app's existing card/list visual language
 * (same `rounded-pill` bar treatment as `TrendBarChart`, same label type
 * scale as `CompletionSummaryCard`'s mood-log rows) rather than reusing
 * `ChoiceChip`: that component's whole shape is a selectable button (a
 * `SheenSurface` with `aria-pressed`), which doesn't fit a static,
 * non-interactive ranked stat — forcing it into that shape would mean
 * fighting its built-in press/selection semantics for no benefit.
 */
export function RankedBarRow({ icon, label, value, max, trailing, barColor = 'var(--color-warm)', className }: RankedBarRowProps) {
  const ratio = max > 0 ? Math.max(0.03, Math.min(1, value / max)) : 0
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {icon}
          <span className="truncate font-sans text-base tracking-[-0.16px] text-ink">{label}</span>
        </div>
        <span className="shrink-0 font-sans text-sm font-medium tracking-[-0.14px] whitespace-nowrap text-ink/60">{trailing}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-ink/[0.06]">
        <div
          className="h-full rounded-pill"
          style={{
            width: `${ratio * 100}%`,
            backgroundColor: barColor,
            boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.16), inset 0 1px 2px rgba(255,255,255,0.4)',
          }}
        />
      </div>
    </div>
  )
}
