import { ThumbsUp } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export interface FeelBetterSheetProps {
  open: boolean
  onAnswer: (better: boolean) => void
  onDismiss: () => void
}

const PILL_STYLE = { backgroundColor: '#fef6fa', borderColor: '#fbdfef', boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 4px 4px rgba(255,255,255,0.35)' }

/**
 * "Do you feel better?" bottom sheet, shown after tapping "Practice
 * completed" — verified against node 217:15546: `rgba(0,0,0,0.45)` scrim,
 * white sheet with 24px top corners, a `rgba(23,23,28,0.25)` drag handle
 * (40x4px), title, then a Yes/"Not really" pill pair (`#fef6fa` fill,
 * `#fbdfef` border, 2-layer inset shadow, fully rounded). Both pills use
 * the SAME ThumbsUp icon — the source itself renders "Not really"'s icon
 * as ThumbsUp flipped vertically (`scaleY(-1)`) rather than a distinct
 * ThumbsDown asset, reproduced here exactly rather than substituting
 * Phosphor's ThumbsDown (which IS used elsewhere in the app, e.g.
 * CompletionSummaryCard — a real, confirmed difference between the two
 * sources, not an inconsistency introduced here).
 *
 * Optional, per the brief: tapping the scrim dismisses without answering
 * (`onDismiss`), reusing CheckInMenuSheet's own backdrop-dismiss + slide-
 * transition pattern (also not itself in any node, flagged there already).
 *
 * Pills are `h-12` (48px) — explicit direct correction, was 54px.
 */
export function FeelBetterSheet({ open, onAnswer, onDismiss }: FeelBetterSheetProps) {
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
        aria-label="Do you feel better?"
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[393px] flex-col items-center gap-5 rounded-t-[24px] bg-white px-5 pt-3 pb-10 transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="h-1 w-10 shrink-0 rounded-full bg-[rgba(23,23,28,0.25)]" />
        <div className="flex w-full flex-col items-start gap-5">
          <p className="w-full font-sans text-lg font-semibold text-ink">Do you feel better?</p>
          <div className="flex w-full items-start gap-2">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="focus-ring flex h-12 flex-1 items-center justify-center gap-2 rounded-pill border border-solid pr-3.5 pl-3"
              style={PILL_STYLE}
            >
              <ThumbsUp size={20} weight="fill" className="text-ink" />
              <span className="font-sans text-base font-medium text-ink">Yes</span>
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="focus-ring flex h-12 flex-1 items-center justify-center gap-2 rounded-pill border border-solid pr-3.5 pl-3"
              style={PILL_STYLE}
            >
              <ThumbsUp size={20} weight="fill" className="-scale-y-100 text-ink" />
              <span className="font-sans text-base font-medium text-ink">Not really</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
