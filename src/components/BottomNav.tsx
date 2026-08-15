import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CalendarCheck, Lightbulb, Plus } from '@phosphor-icons/react'
import { GradientCircleButton } from './GradientCircleButton'
import { CheckInMenuSheet } from './CheckInMenuSheet'
import { cn } from '../lib/cn'

// The center button's gradient is a DIFFERENT recipe from GradientCircleButton's
// default (109:4143) — see that component's `gradient` prop doc for the exact
// comparison. Border color, shadow, and Plus icon are identical to that
// default; the white highlight shape is NOT (see TAB_BAR_FAB_GLOW below).
const TAB_BAR_FAB_GRADIENT = 'linear-gradient(141.09deg, #F00A5B 5.3298%, #F63176 51.345%, #FD5F97 105.03%)'

// Circle diameter + white highlight shape, both updated at node
// 128:647/128:649 ("Ellipse 17" + a 72px circle, superseding the previous
// 196×73/88px pass at 120:5916). `top` is the glow's offset from the
// circle's own top edge — this shape's circle sits at y=0 and the glow at
// y=37 in the same 160×80 frame, so `top` is just 37 directly, no
// subtraction needed. Horizontal centering confirmed exactly (both the
// 160px-wide glow and the 72px circle share the same center x within that
// frame), same as the previous pass.
const TAB_BAR_FAB_SIZE = 72
const TAB_BAR_FAB_GLOW = {
  width: 160,
  height: 43,
  path: 'M159.771 0.000240727C159.847 -7.99498e-05 159.924 -8.05344e-05 160 0.000240727H159.771C131.945 0.117454 121.768 43.0002 80 43.0002C38.232 43.0002 28.0554 0.117454 0.228785 0.000240727H0C0.0763944 -8.05344e-05 0.152656 -7.99498e-05 0.228785 0.000240727H159.771Z',
  top: 37,
}

/**
 * Fade sitting directly behind the floating button — its whole purpose is
 * to obscure whatever scrolled content sits behind the button (the bar
 * itself is already opaque `bg-nav-bg`, so this only matters for the
 * sliver of button that pokes up ABOVE the bar's own top edge) so the
 * button visually pops and a tap there can't be mistaken for tapping
 * content underneath it — explicit direct correction: an earlier pass
 * (147px, matching node 242:1888) reached far past the button's own top
 * edge into whatever content sits above it (e.g. the empty-state card),
 * which was never the intent. Height is now exactly `TAB_BAR_FAB_GLOW.top`
 * (37px) — the same offset that lifts the button above the bar — so this
 * fade's own top edge lines up exactly with the button's top edge, no
 * further. `bottom-full` pins its own bottom edge to the shared wrapper's
 * top, which equals the bar's own top (bar is the wrapper's only in-flow
 * content) — same anchoring technique already used for the floating
 * button below.
 *
 * Gradient stops are explicit direct values (0% white/40% opacity → 24%
 * white/100% opacity) — a correction of the earlier pass's odd fractional
 * stops (0.4618%/24.439%, an artifact of Figma's own export rounding for
 * its one tested frame height) which read as too strong/too abrupt a
 * fade in practice.
 */
function ScrollFade() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-full z-10"
      style={{ height: TAB_BAR_FAB_GLOW.top, backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, #ffffff 24%)' }}
    />
  )
}

/**
 * The app's only navigation surface (no hamburger menu, per the brief).
 * Verified against node 117:5847 — a 2-side-tab bar (Entries, Patterns)
 * with a center floating Check-in button, not 3 equal tabs as Stage 3
 * built it. Stage 3's routing/labels are unchanged (still `/checkin`,
 * `/entries`, `/patterns`) — only the VISUAL arrangement now matches the
 * source: Check-in is the prominent center action (reusing
 * GradientCircleButton, the same circle+white-shape structure already
 * established for the slider knob and the standalone "+" button), Entries
 * and Patterns are the two flanking icon+label tabs.
 *
 * Bar fill/border/shadow (117:5848) verified as genuinely different from
 * every other surface in the app — solid `#fdedf6` fill (not a sheen
 * gradient), a faint `1.5px solid rgba(253,216,229,.3)` border, and a
 * single-layer top-inset shadow `inset 0 3px 4.7px rgba(250,230,241,.8)`
 * (not the shared 4-layer `.sheen` formula — this bar never used it).
 *
 * Tab icons are Phosphor's stock `CalendarCheck`/`Lightbulb` "fill"
 * weight, confirmed by diffing node 128:637's raw SVG paths against
 * @phosphor-icons/react's own source (exact match). This replaces the
 * earlier hand-copied "Notebook" path from 117:5847 — 128:637 is a newer
 * pass over this same bar and swaps that icon for CalendarCheck; Lightbulb
 * is unchanged in shape, just resized. Colors still inherit from the
 * wrapping NavLink's text color via Phosphor's default `currentColor`
 * fill, same mechanism the old hand-copied paths used.
 *
 * The floating "+" button no longer navigates straight to `/checkin`
 * (Stage 4) — it opens CheckInMenuSheet, the compact "Set intention" /
 * "Check in mood" popup (109:3847), since that's now the app's real
 * always-available entry point into either flow (the Check-in home
 * screen itself has no tappable entry point of its own since Fix 17
 * replaced its hero cards with the Today/CompletionSummaryCard system).
 */
export function BottomNav() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const tabClass = (active: boolean) =>
    cn('focus-ring flex flex-col items-center justify-center gap-[6px] rounded-[14px] px-[18px] py-1', active ? 'text-nav-active' : 'text-nav-inactive')

  // Journal reads as active on /checkin too, not just /entries — /checkin
  // (the Check-in home screen) IS the app's actual homepage, so it's
  // conceptually part of the Journal section rather than a separate
  // destination. NavLink's own built-in `isActive` can't express that (it
  // only matches its own `to`), so this is computed manually instead.
  const isJournalActive = pathname === '/checkin' || pathname.startsWith('/entries')
  const isPatternsActive = pathname.startsWith('/patterns')

  return (
    // Bar and button share this relative wrapper so the button is measured
    // against the BAR's own edges, not the viewport — anchoring to the bar
    // keeps its position correct even if the bar's height changes later
    // (e.g. a taller safe-area inset).
    <div className="relative w-full">
      <ScrollFade />

      {/*
        `sticky bottom-0` so the bar is guaranteed to stay pinned to the
        screen even if some future screen's content breaks out of
        TabLayout's intended overflow-y-auto region — sticky also reserves
        its own space automatically, so scrollable content is never hidden
        behind it without a manually calculated bottom-padding value.
      */}
      <nav
        className="sticky bottom-0 z-20 flex w-full items-center justify-between border-[1.5px] border-solid border-nav-border bg-nav-bg px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]"
        style={{ boxShadow: 'inset 0 3px 4.7px rgba(250,230,241,0.8)' }}
      >
        <NavLink to="/entries" className={tabClass(isJournalActive)}>
          <CalendarCheck size={22} weight="fill" />
          <span className="font-sans text-base font-medium">Journal</span>
        </NavLink>
        <NavLink to="/patterns" className={tabClass(isPatternsActive)}>
          <Lightbulb size={22} weight="fill" />
          <span className="font-sans text-base font-medium">Patterns</span>
        </NavLink>
      </nav>

      {/*
        Positioned via this WRAPPING div, not by passing position classes
        straight into GradientCircleButton's own className: that
        component's base classes already include `relative` (needed
        internally for its own glow-behind-button layering), and Tailwind
        generates `.relative` later than `.absolute` in its own
        stylesheet — so with both on the same element, `.relative` wins
        regardless of which order they're listed in, and the button
        silently stays in normal document flow. A separate wrapper
        sidesteps that conflict entirely.

        `top: -TAB_BAR_FAB_GLOW.top` shifts the button up from the bar's
        top edge (this wrapper's `top: 0` = the bar's own top, since the
        bar is the only in-flow content in the shared relative container)
        by exactly the glow's own top-inset — so the glow shape's top edge
        (which sits `glow.top` below the circle's own top) lands precisely
        back on the bar's top edge, matching "the white shape's top should
        coincide with the navbar's top edge" independent of the bar's
        rendered height. Supersedes an earlier literal `bottom: 44px`
        offset, which doesn't hold at the same time as this — the two are
        mutually exclusive for a fixed bar height, and this is the more
        recent, more specific request.
      */}
      <div className="absolute left-1/2 z-30 -translate-x-1/2" style={{ top: -TAB_BAR_FAB_GLOW.top }}>
        <GradientCircleButton
          icon={Plus}
          weight="bold"
          gradient={TAB_BAR_FAB_GRADIENT}
          glow={TAB_BAR_FAB_GLOW}
          size={TAB_BAR_FAB_SIZE}
          aria-label="Check in"
          onClick={() => setMenuOpen(true)}
        />
      </div>

      <CheckInMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
