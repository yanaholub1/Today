import { Gear, User } from '@phosphor-icons/react'
import { IconTapTarget } from './IconTapTarget'

export interface HomeHeaderProps {
  greeting: string
  onSettingsClick?: () => void
  onProfileClick?: () => void
}

/**
 * Check-in home screen header — verified against node 117:5748 ("Title and
 * subtitle"). Full-bleed (no side inset of its own outer margin — see
 * CheckInScreen, which lets it break out of the page's usual px-5), with
 * its own internal 20px side padding matching that same rhythm.
 *
 * Flat white, no fill — the earlier pink gradient card treatment
 * (rounded bottom corners, tinted drop shadow) was removed per explicit
 * direct request, confirmed against node 242:1553, which shows this
 * header sitting directly on the plain white page background with no
 * background, radius, or shadow of its own at all.
 *
 * Settings/profile buttons reuse IconTapTarget (with `weight="fill"`):
 * neither has a background/border/shadow class in the Figma export,
 * confirming the flat icon-button style here, not GradientCircleButton's
 * gradient/sheen treatment from Fix 13 — filled just refers to the icon
 * glyph itself, not the button surface.
 *
 * The settings icon is Phosphor's `Gear` — an earlier pass here swapped it
 * for `GearSix` on the assumption that the Figma layer's OUTER wrapper
 * name ("GearSix") named the actual icon; zooming into the icon's own
 * node (117:5752) instead shows its real inner layer is named "Gear", and
 * diffing that node's raw SVG path against @phosphor-icons/react's source
 * confirms an exact match to Phosphor's `Gear` "fill" weight (not
 * `GearSix`). Same diffing approach confirmed `User`'s path also matches
 * Phosphor's stock "fill" weight exactly.
 *
 * `greeting` is the full string (time-based text + name, e.g. "Good
 * morning, Yana") built by the caller — this component just renders it,
 * it doesn't own the "Good morning"/name-lookup logic itself. Stage 3's
 * streak subtitle ("N days in a row") was removed on request — 117:5748
 * never had it in the first place, so this now matches the node exactly.
 *
 * No bottom padding at all — re-verified against 242:1553's own wrapper
 * (a single top inset, then a uniform `gap-[20px]` between the
 * header/nav/Today rows, not padding baked into the header itself).
 * Explicit direct correction: the earlier `pt-[58px]`/`pb-[24px]` pair
 * were 117:5748's numbers from when this header still had its own pink
 * card fill — pb-24 in particular was that fill's internal bottom
 * padding, which no longer means anything now that the fill is gone, and
 * was silently stacking with `SecondaryNav`'s own `mt-5` to produce a
 * 44px gap instead of the intended 20px. Removing it here lets the
 * callers' own `mt-5` (20px) be the ONLY thing spacing `SecondaryNav`
 * below this header, matching the Today title's own `mt-5` below
 * `SecondaryNav` — a consistent 20/20 rhythm end to end.
 *
 * Review fix — top inset is now `pt-[max(16px,env(safe-area-inset-top))]`
 * (was a flat `pt-[64px]`): that fixed value left a large empty gap above
 * the greeting compared to `TaskFlowHeader`'s own top inset (used by the
 * intention-setting/mood check-in flows), which is safe-area-aware and
 * much smaller on any non-notched viewport — a real layout inconsistency
 * between this screen and those flows, not a deliberate difference.
 * Reuses `TaskFlowHeader`'s exact value rather than inventing a new one,
 * so Home/Journal (this header's only two callers) now open at the same
 * top position the flows already use.
 */
export function HomeHeader({ greeting, onSettingsClick, onProfileClick }: HomeHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
      {/* text-[20px] — explicit direct correction, was 18px (117:5748's own size). */}
      <p className="font-serif text-[20px] tracking-[-0.18px] text-ink">{greeting}</p>
      <div className="flex items-center gap-2">
        <IconTapTarget icon={Gear} weight="fill" aria-label="Settings" onClick={onSettingsClick} />
        <IconTapTarget icon={User} weight="fill" aria-label="Profile" onClick={onProfileClick} />
      </div>
    </div>
  )
}
