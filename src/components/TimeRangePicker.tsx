import { useState } from 'react'
import { CalendarDots } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import type { PatternsTimeRange } from '../lib/patternsAggregation'

const OPTIONS: { id: PatternsTimeRange; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All time' },
]

export interface TimeRangePickerProps {
  value: PatternsTimeRange
  onChange: (range: PatternsTimeRange) => void
  className?: string
}

/**
 * The compact time-range trigger from node 323:3948 ("7 days" + a
 * `CalendarDots` icon, no visible fill/border of its own) — exactly 3
 * options per the brief (7 days / Month / All time). No "open" state was
 * captured in any fetched node, so the popover menu below is this
 * component's own interpretation, not a verified pixel source: a small
 * rounded-card dropdown anchored under the trigger, reusing the app's
 * existing card border/radius tokens and the `sphere-pale` selected-row
 * tint already established elsewhere (ReasonPickerSheet et al.) rather
 * than inventing a new selected-state color — flagged here as an
 * assumption, not a confirmed design.
 */
export function TimeRangePicker({ value, onChange, className }: TimeRangePickerProps) {
  const [open, setOpen] = useState(false)
  const activeLabel = OPTIONS.find((o) => o.id === value)?.label ?? ''

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="focus-ring flex items-center justify-center gap-1 rounded-pill px-2 pt-4 pb-2"
      >
        <CalendarDots size={20} className="text-ink" />
        <span className="font-sans text-base font-medium tracking-[-0.16px] whitespace-nowrap text-ink">{activeLabel}</span>
      </button>

      {open && (
        <>
          <div aria-hidden className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute top-[calc(100%+4px)] left-0 z-40 flex w-[140px] flex-col overflow-hidden rounded-card border border-solid border-completion-border bg-white"
            style={{ boxShadow: '0px 4px 16px rgba(0,0,0,0.12)' }}
          >
            {OPTIONS.map((opt) => {
              const selected = opt.id === value
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'px-4 py-3 text-left font-sans text-base whitespace-nowrap',
                    selected ? 'bg-sphere-pale-bg font-medium text-[#6d0e2d]' : 'text-ink',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
