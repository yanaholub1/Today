import type { Icon, IconWeight } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export type IconTapTargetTone = 'ink' | 'white'

export interface IconTapTargetProps {
  icon: Icon
  /**
   * Required, not optional: this button has no visible text, so without an
   * explicit accessible name it's silent to assistive tech. The Figma
   * source is visual-only and never specifies one — there's no sensible
   * default to fall back to, so this is a real requirement.
   */
  'aria-label': string
  onClick?: () => void
  /** Matches the surrounding text color: 'ink' on light screens, 'white' on the saturated hero card. */
  tone?: IconTapTargetTone
  /**
   * Defaults to "regular" (the closest real icon set to the Figma file's
   * usual line-icon style). Override per-instance for confirmed exceptions —
   * e.g. HomeHeader's settings/profile icons (117:5752/117:5755) are
   * Phosphor's own "fill" weight assets, verified by diffing the Figma
   * export's raw path against @phosphor-icons/react's source.
   */
  weight?: IconWeight
  disabled?: boolean
  className?: string
}

/**
 * 40x40px hit area regardless of the icon's own size, centered 24px icon,
 * no visible fill or border.
 */
export function IconTapTarget({ icon: IconComponent, tone = 'ink', weight = 'regular', disabled, className, ...rest }: IconTapTargetProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'focus-ring pressable flex size-10 items-center justify-center rounded-full disabled:opacity-40',
        tone === 'white' ? 'text-white' : 'text-ink',
        className,
      )}
      {...rest}
    >
      <IconComponent size={24} weight={weight} />
    </button>
  )
}
