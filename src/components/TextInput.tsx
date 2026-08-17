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
 * `h-14` (56px — review fix, was `h-12`/48px, applied to every input field
 * app-wide), no top/bottom padding — explicit direct correction: the
 * earlier `pt-[14px]`/`pb-[13px]` pair were what gave this field its
 * height, which left the text's own vertical position tied to those two
 * numbers rather than genuinely centered. A fixed height with zero
 * vertical padding lets the input element's own native text centering do
 * the job instead.
 *
 * Review fix — default-state border is now `border-[#6d6b7c]/60` (was
 * fully opaque), explicit direct request applied consistently to every
 * input-styled field's own default stroke (this field, the Life
 * area/reason-picker dropdown triggers, the emotion search field).
 * Review fix: this field's border DOES now flip to brand pink on focus,
 * via `.focus-ring-field-shape` (index.css) — this input owns both its
 * own visible border and the focus itself, so that class's `:focus-
 * visible` branch applies directly here (see its own doc comment for why
 * NotesField/MoodFlowScreen's search fields need the OTHER branch,
 * `:has(:focus-visible)`, instead — their border lives on a separate
 * wrapper `<div>` around the actual input).
 *
 * `shrink-0` — confirmed necessary, not just defensive: switching this
 * field (and the other fixed-height inputs above) from padding-driven to
 * explicit-height sizing dropped its own min-content floor down to
 * roughly one text line, so inside a genuinely cramped `flex-col`
 * (MoodFlowScreen's own emotion-search region, verified live) the plain
 * `flex-shrink: 1` default squeezed it down to ~26px instead of holding
 * 56px — the OLD padding-based version's own higher min-content floor had
 * been masking this same risk everywhere else, not preventing it.
 */
export function TextInput({ className, ...rest }: TextInputProps) {
  return (
    <input
      type="text"
      className={cn(
        'focus-ring-field focus-ring-field-shape h-14 w-full shrink-0 rounded-pill border border-solid border-[#6d6b7c]/60 bg-white px-4 font-sans text-base text-ink placeholder:text-ink/70',
        className,
      )}
      {...rest}
    />
  )
}
