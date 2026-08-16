import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface FlowActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'primary' (default) is the main forward action (Next/Continue/Save). 'secondary' is a lower-emphasis action (Add another intention). */
  variant?: 'primary' | 'secondary'
}

/**
 * Full-width CTA button for the intention flow's own step screens — NOT
 * verified against any Figma node (flagged per the brief, same as
 * TextInput: the flow's step-to-step navigation chrome isn't covered by
 * an audited node). 'primary' reuses the app's existing warm/pink brand
 * color (--color-warm, already used by HeroActionCard) rather than
 * inventing a new one; 'secondary' is a plain text-only ghost treatment
 * for the one lower-emphasis action in this flow.
 */
export function FlowActionButton({ variant = 'primary', className, ...rest }: FlowActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        // Pressed feedback is the shared `.pressable` utility now (index.css)
        // — replaces this button's own former per-variant `active:opacity-*`
        // one-offs, motion pass.
        'focus-ring pressable w-full rounded-pill px-6 py-4 text-center font-sans text-base font-medium disabled:opacity-40',
        variant === 'primary' ? 'bg-warm text-white' : 'text-warm',
        className,
      )}
      {...rest}
    />
  )
}
