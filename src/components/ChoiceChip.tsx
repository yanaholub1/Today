import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { SheenSurface } from './SheenSurface'
import { cn } from '../lib/cn'

export type ChoiceChipFamily = 'warm' | 'cool'

export interface ChoiceChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  label: string
  /**
   * Fixed per-instance, not computed at runtime: warm and cool chips use
   * different border and shadow tints, not just different fills, so a chip
   * can't silently become "the other family" based on some other prop.
   */
  family: ChoiceChipFamily
  selected?: boolean
  /** Leading icon for list-style rows. When present, the label sits at a fixed 45px offset instead of being centered. */
  icon?: ReactNode
  className?: string
}

/**
 * A single choice chip. Selection is controlled by the parent (single- or
 * multi-select group) — this component just renders the current state and
 * reports taps via onClick; it doesn't own group exclusivity logic.
 *
 * Warm has a confirmed selected state (#a7668b fill, white text) from
 * node 109:3408. Cool's selected state does not exist in the source — it
 * was designed here for symmetry: `cool-mid` (#7286be) is the same blue-grey
 * literally used as the cool chip's own shadow tint, and it reuses the cool
 * family's existing border/shadow rather than inventing new ones, mirroring
 * how warm's selected/default states already share border + shadow tint.
 */
export function ChoiceChip({ label, family, selected = false, icon, className, ...rest }: ChoiceChipProps) {
  const hue = family === 'warm' ? (selected ? 'warm-mid' : 'warm-pale') : selected ? 'cool-mid' : 'cool-pale'

  return (
    <SheenSurface
      as="button"
      type="button"
      hue={hue}
      scale="chip"
      aria-pressed={selected}
      className={cn(
        'focus-ring pressable w-full rounded-card py-3',
        icon ? 'grid grid-cols-[45px_1fr] items-center pr-4' : 'flex items-center justify-center px-4',
        className,
      )}
      {...rest}
    >
      {icon && (
        <span className="flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="font-sans text-base font-medium tracking-[-0.16px]">{label}</span>
    </SheenSurface>
  )
}
