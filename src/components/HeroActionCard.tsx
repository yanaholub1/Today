import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { SheenSurface } from './SheenSurface'
import { cn } from '../lib/cn'

export type HeroActionCardVariant = 'primary' | 'secondary'

/**
 * Which corners round. Two hero cards stacked in a screen fuse into one
 * continuous surface split by a hairline gap: the card higher in the stack
 * ('first') only rounds its bottom corners, the one below ('last') only
 * rounds its top corners — the corners facing the shared seam. A single
 * hero card used on its own rounds all four ('standalone', the default).
 */
export type HeroActionCardStackPosition = 'standalone' | 'first' | 'last'

export interface HeroActionCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Centered icon or illustration. Figma uses bespoke illustrations here (a sunburst, a flower), not a simple line icon — pass whatever fits. */
  icon?: ReactNode
  label: string
  /** 'primary' is the saturated warm fill — use at most once per screen. Defaults to 'secondary' (pale) so that has to be a deliberate choice. */
  variant?: HeroActionCardVariant
  stackPosition?: HeroActionCardStackPosition
  /**
   * 'full' (default) is the mandatory app-start screen's huge stacked pair
   * (109:4148) — icon ABOVE a 28px label, in a column. 'compact' is the
   * tab bar's floating-button popup menu (109:3847) — icon BESIDE a 20px
   * label, in a row. Not just a smaller version of the same layout: the
   * icon/label axis itself flips between the two, confirmed by each
   * node's own flex-direction (flex-col vs flex, both gap-[16px]).
   */
  size?: 'full' | 'compact'
  disabled?: boolean
  className?: string
}

const RADIUS: Record<HeroActionCardStackPosition, string> = {
  standalone: 'rounded-hero',
  first: 'rounded-b-hero',
  last: 'rounded-t-hero',
}

const BASE_CLASSES =
  'focus-ring flex w-full items-center justify-center px-6 py-8 text-center transition-transform duration-150 active:scale-[0.98] active:opacity-90 disabled:pointer-events-none'

// 'full' cards get a 160px floor (their real min-height source is
// whatever screen renders them full-height anyway, so this is just a
// sane minimum). 'compact' cards sit inside CheckInMenuSheet's fixed
// 327px-tall container — 2 cards + a 12px gap only leaves 157.5px each,
// so a 160px floor would force the pair 5px taller than that container,
// pushing the bottom card 5px past the sheet's (and screen's) own bottom
// edge. Compact skips the floor entirely and lets `flex-1` size it exactly.
const MIN_HEIGHT: Record<'full' | 'compact', string> = { full: 'min-h-40', compact: '' }

function HeroActionCardContent({ icon, label, size }: { icon: ReactNode; label: string; size: 'full' | 'compact' }) {
  return (
    <div className={cn('flex items-center justify-center gap-4', size === 'compact' ? 'flex-row' : 'flex-col')}>
      {icon}
      <span className={cn('font-serif', size === 'compact' ? 'text-xl tracking-[-0.2px]' : 'text-[28px] tracking-[-0.28px]')}>{label}</span>
    </div>
  )
}

/**
 * Full-width hero action card. The whole card is the tap target (not a
 * button inside it) — the label and icon are purely visual content.
 *
 * Pressed and disabled states are Stage 2 additions: the static Figma file
 * only shows the default appearance. Pressed uses a slight scale/opacity
 * dip on `:active`; disabled swaps to a flat, desaturated fill with a
 * neutral border and drops the sheen shadow entirely (a disabled surface
 * shouldn't shine), rather than trying to force it through SheenSurface's
 * hue presets.
 */
export function HeroActionCard({
  icon,
  label,
  variant = 'secondary',
  stackPosition = 'standalone',
  size = 'full',
  disabled = false,
  className,
  ...rest
}: HeroActionCardProps) {
  const radius = RADIUS[stackPosition]
  const minHeight = MIN_HEIGHT[size]

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={cn(BASE_CLASSES, minHeight, radius, 'border-2 border-disabled-border bg-disabled-fill text-disabled-text', className)}
        {...rest}
      >
        <HeroActionCardContent icon={icon} label={label} size={size} />
      </button>
    )
  }

  return (
    <SheenSurface
      as="button"
      type="button"
      hue={variant === 'primary' ? 'warm-strong' : 'warm-pale'}
      scale="hero"
      className={cn(BASE_CLASSES, minHeight, radius, className)}
      {...rest}
    >
      <HeroActionCardContent icon={icon} label={label} size={size} />
    </SheenSurface>
  )
}
