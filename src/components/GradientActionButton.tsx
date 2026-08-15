import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface GradientActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  /** 'primary' (default) — verified against 109:3231. 'secondary' — verified against 217:15068/217:15546 ("Complete check-in"/"Skip practice"), same shape, pale gradient and ink text instead of the saturated pink/white pair. */
  variant?: 'primary' | 'secondary'
  /** 'lg' (default, 16px) — every existing flow-CTA usage (109:3231 etc). 'md' (12px) — CheckInMenuSheet's popup buttons (242:1751), the one other confirmed radius for this exact gradient/border/shadow recipe. Kept as a prop rather than a className override since Tailwind's generated stylesheet order can make a conflicting radius utility passed via className lose to this component's own base class. */
  radius?: 'md' | 'lg'
}

// Same gradient/border/shadow recipe as MorningIntentionFlow's own bespoke
// Save button (SAVE_GRADIENT there) — this is that exact same style,
// independently confirmed here against node 109:3231 ("Continue"): 16px
// radius (not the app's usual pill), `#f56093` border, white semibold
// 18px text, 2-layer inset shadow. Extracted as a shared component since
// the mood flow reuses it at every step (Continue/Done/Save check-in),
// unlike the intention flow which only needs it once.
const PRIMARY_GRADIENT = 'linear-gradient(173.22deg, #F00A5B 5.3298%, #F63176 51.345%, #FD5F97 105.03%)'
const PRIMARY_SHADOW = 'inset 0 -4px 4px #f62870, inset 0 4px 4px rgba(255,255,255,0.24)'

// Verified against 217:15068's "Complete check-in" and 217:15546's "Skip
// practice" — same border/shadow/radius shape as primary, but a much paler
// gradient (near-white to translucent pink) and dark ink text instead of
// white, no saturated fill.
const SECONDARY_GRADIENT = 'linear-gradient(173.22deg, #f9eff4 5.3298%, rgba(255,203,221,0.37) 105.03%)'
const SECONDARY_SHADOW = 'inset 0 -1px 4px rgba(156,131,140,0.2), inset 0 2px 3px rgba(255,255,255,0.24)'

/** Primary/secondary flow CTA — see each variant's own verification note above. `icon` is optional: neither confirmed node has one, but the shape matches MorningIntentionFlow's icon+label Save button exactly. */
export function GradientActionButton({ icon, children, className, variant = 'primary', radius = 'lg', ...rest }: GradientActionButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type="button"
      className={cn(
        'focus-ring flex w-full items-center justify-center gap-2 border border-solid px-4 py-3.5 disabled:opacity-40',
        radius === 'lg' ? 'rounded-[16px]' : 'rounded-[12px]',
        isPrimary ? 'border-[#f56093]' : 'border-[#fcbbd2]',
        className,
      )}
      style={{ backgroundImage: isPrimary ? PRIMARY_GRADIENT : SECONDARY_GRADIENT, boxShadow: isPrimary ? PRIMARY_SHADOW : SECONDARY_SHADOW }}
      {...rest}
    >
      {icon}
      <span className={cn('font-sans text-lg font-medium', isPrimary ? 'text-white' : 'text-ink')}>{children}</span>
    </button>
  )
}
