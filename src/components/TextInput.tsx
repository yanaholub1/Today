import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

/**
 * Plain text input — re-verified against node 213:14225's "Type your focus
 * for today" field (Fix 24): pill radius (`rounded-pill`, not the earlier
 * 8px — explicit direct correction, the flow's whole "Life area" field
 * moved to a matching pill-shaped dropdown at the same time), a distinct
 * `#6d6b7c` border (not the pale `--color-neutral-border` used for the
 * inactive filter segment elsewhere), and a placeholder at ink/70%
 * opacity. Only consumer is `MorningIntentionFlow`'s own text field.
 *
 * `h-12` (48px), no top/bottom padding — explicit direct correction: the
 * earlier `pt-[14px]`/`pb-[13px]` pair were what gave this field its
 * height, which left the text's own vertical position tied to those two
 * numbers rather than genuinely centered. A fixed height with zero
 * vertical padding lets the input element's own native text centering do
 * the job instead.
 */
export function TextInput({ className, ...rest }: TextInputProps) {
  return (
    <input
      type="text"
      className={cn('focus-ring-field h-12 w-full rounded-pill border border-solid border-[#6d6b7c] bg-white px-4 font-sans text-base text-ink placeholder:text-ink/70', className)}
      {...rest}
    />
  )
}
