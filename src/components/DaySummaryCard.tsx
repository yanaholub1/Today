import type { ReactNode } from 'react'
import { NotesEmptyIllustration } from './NotesEmptyIllustration'
import { cn } from '../lib/cn'

export interface DaySummaryCardProps {
  /** Makes the whole card a real entry point into the check-in menu (Stage 4), same destination as the tab bar's floating button — explicit request, not from Figma (117:5768 is visual-only, no interaction states). */
  onClick?: () => void
  className?: string
  /** Overrides for reusing this same empty-state recipe outside the home screen's own "what's on your mind" context — e.g. the Practices subtab (review fix, no Figma node yet). Default to the original Fix-17 copy/icon so every existing call site is unaffected. Review fix: `icon` is now a rendered node (the real `NotesEmptyState.png`/`PracticesEmptyState.png` exports, via their own `*Illustration` wrapper components — see DaySummaryCard's own doc comment), not a Phosphor `Icon` component reference — these two empty states use real exported artwork now, not a swappable glyph. */
  icon?: ReactNode
  title?: string
  subtitle?: string
}

/**
 * Home screen empty-state card — re-verified against node 242:1553 ("Day
 * Summary Card (Empty)", the "no logs at all" state) / 230:17230 (the
 * "today empty, past cards exist" state) — both show the exact same card.
 *
 * Review fix: the centered glyph is now the real exported `NotesEmptyState.png`
 * artwork (via `NotesEmptyIllustration`, default) or `PracticesEmptyState.png`
 * (via `PracticesEmptyIllustration`, passed in as `icon` by CheckInScreen's
 * and EntriesScreen's own Practices branches) — was a plain Phosphor
 * `ChatCircleDots`/`Heart` glyph at 52px before, explicit direct request
 * to use the provided illustrations instead. Rendered by each call site
 * (not hardcoded here, since `icon` is now a caller-rendered node), not
 * necessarily at the same size — Notes stays `size-[52px] object-contain`;
 * Practices is now `size-[44px]` (review fix, was also 52px — explicit
 * direct request to size the heart down independently of Notes' own
 * icon). Both still use `object-contain` (review fix, was `h-[*] w-auto`
 * for Practices specifically): that matched HEIGHT only, but Practices'
 * own export isn't square (137x117, unlike Notes' 156x156), so matching
 * height alone left Practices rendering visibly WIDER than whatever box
 * it was compared against — a fixed square box with `object-contain`
 * scales each asset to fit on its LONGER axis instead (Notes needs no
 * letterboxing, already square; Practices' width becomes the box's own
 * size and its height shrinks proportionally), so sizing either one is a
 * single box-size change, not a two-axis one.
 *
 * Whole card is the tap target (a real `<button>`, not a decorative div —
 * matches HeroActionCard's own "whole card is the button" convention)
 * once `onClick` is provided. Icon-to-title gap is 16px, title-to-subtitle
 * is 8px — explicit direct correction, superseding an earlier 12px/4px
 * pass. Title is 16px ink (review fix: now semibold, was medium — explicit
 * direct request); subtitle is 16px regular `#797579` (also an explicit
 * direct correction — was 13px medium `--color-summary-subtitle` before, a
 * genuinely different size/weight/color, not a token reuse).
 *
 * Review fix: `icon`/`title`/`subtitle` are now overridable (defaulting to
 * the original copy above) so the Practices subtab's own empty state can
 * reuse this exact recipe instead of duplicating the dashed-card markup —
 * no Figma node covers that state yet, so borrowing this component's
 * already-confirmed styling is the safer inferred choice.
 */
export function DaySummaryCard({
  onClick,
  className,
  icon = <NotesEmptyIllustration className="size-[52px] object-contain" />,
  title = "What's on your mind today?",
  subtitle = 'Take a minute for yourself and check in.',
}: DaySummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('focus-ring pressable flex w-full flex-col items-center justify-center gap-4 rounded-hero border-[1.5px] border-dashed border-summary-border px-5 py-8', className)}
    >
      {icon}
      <div className="flex flex-col items-center gap-2">
        <p className="font-sans text-base font-semibold text-ink">{title}</p>
        <p className="font-sans text-base font-normal text-[#797579]">{subtitle}</p>
      </div>
    </button>
  )
}
