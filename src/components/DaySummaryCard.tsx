import { ChatCircleDots } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export interface DaySummaryCardProps {
  /** Makes the whole card a real entry point into the check-in menu (Stage 4), same destination as the tab bar's floating button — explicit request, not from Figma (117:5768 is visual-only, no interaction states). */
  onClick?: () => void
  className?: string
  /** Overrides for reusing this same empty-state recipe outside the home screen's own "what's on your mind" context — e.g. the Practices subtab (review fix, no Figma node yet). Default to the original Fix-17 copy/icon so every existing call site is unaffected. */
  icon?: Icon
  title?: string
  subtitle?: string
}

/**
 * Home screen empty-state card — re-verified against node 242:1553 ("Day
 * Summary Card (Empty)", the "no logs at all" state) / 230:17230 (the
 * "today empty, past cards exist" state) — both show the exact same card.
 *
 * The centered glyph is a plain `ChatCircleDots` icon at 52px, not the
 * earlier pill-badge-with-plus-glyph treatment (that was this card's
 * original Fix-17 design, superseded here per explicit direct request to
 * match the newly-fetched nodes) — no circle/border around it anymore,
 * confirmed by both nodes and their screenshots. Colored with the same
 * saturated pink as `--color-summary-badge-bg`, the closest existing
 * token to the screenshot's hot-pink bubble (no separate token needed
 * since the badge-border/text tokens it used to pair with are gone).
 *
 * Whole card is the tap target (a real `<button>`, not a decorative div —
 * matches HeroActionCard's own "whole card is the button" convention)
 * once `onClick` is provided. Icon-to-title gap is 16px, title-to-subtitle
 * is 8px — explicit direct correction, superseding an earlier 12px/4px
 * pass. Title is 16px medium ink; subtitle is 16px regular `#797579`
 * (also an explicit direct correction — was 13px medium
 * `--color-summary-subtitle` before, a genuinely different size/weight/
 * color, not a token reuse).
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
  icon: IconComponent = ChatCircleDots,
  title = "What's on your mind today?",
  subtitle = 'Take a minute for yourself and check in.',
}: DaySummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('focus-ring flex w-full flex-col items-center justify-center gap-4 rounded-hero border-[1.5px] border-dashed border-summary-border px-5 py-8', className)}
    >
      <IconComponent size={52} weight="fill" className="text-summary-badge-bg" />
      <div className="flex flex-col items-center gap-2">
        <p className="font-sans text-base font-medium text-ink">{title}</p>
        <p className="font-sans text-base font-normal text-[#797579]">{subtitle}</p>
      </div>
    </button>
  )
}
