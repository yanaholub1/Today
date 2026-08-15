import type { Icon, IconWeight } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export interface GradientCircleButtonProps {
  icon: Icon
  /** Required, not optional — same rationale as IconTapTarget: no visible text, so this is the only accessible name. */
  'aria-label': string
  onClick?: () => void
  disabled?: boolean
  className?: string
  /**
   * Defaults to "fill" (solid silhouette), matching the source icon and
   * the filled-icon convention this button belongs to. Override per-icon
   * when needed: Phosphor's "fill" weight isn't a plain solid glyph for
   * every icon — e.g. its `Plus` fill is a rounded-square "add" badge
   * with a cutout cross, not the plain thick cross node 109:4143 actually
   * shows (confirmed by reading the raw SVG: a simple 4-armed cross, no
   * bounding square). `Plus` specifically needs `weight="bold"`, which is
   * Phosphor's plain-cross variant, to match.
   */
  weight?: IconWeight
  /**
   * Defaults to node 109:4143's exact gradient. Override for other
   * confirmed instances of this same circle+white-shape structure that
   * turn out to use a DIFFERENT gradient — e.g. the tab bar's center
   * button (node 117:5847) is structurally identical (same white shape,
   * same border color, same shadow) but has its own gradient recipe, not
   * a re-export of 109:4143's: `141.09deg, #F00A5B 5.3298%, #F63176
   * 51.345%, #FD5F97 105.03%` vs 109:4143's `142.47deg, #F50056 15.164%,
   * #F63176 47.707%, #FD4E8C 85.471%` — different angle, different stop
   * positions, and two of the three colors differ (only the middle stop,
   * #F63176, is identical between them). Confirmed as a real difference,
   * not export rounding noise, since Figma's gradient export is
   * deterministic for a given paint.
   */
  gradient?: string
  /**
   * White highlight shape behind the circle. Defaults to node 109:4143's
   * shape ("Ellipse 13") — override for confirmed instances that use a
   * DIFFERENT shape, e.g. the tab bar's center button (117:5847, now
   * updated at 120:5916) got its own reshaped highlight ("Ellipse 15",
   * 196×73 vs the default's 188×53). Verified as a genuine divergence, not
   * shared: fetching both nodes' metadata shows 109:4143 is unchanged
   * (still 188×53, top offset 43) while 120:5916 is the only one with the
   * new geometry (196×73, top offset 23) — so this isn't a global shape
   * update, just this one instance's.
   */
  glow?: { width: number; height: number; path: string; top: number }
  /** Circle diameter in px. Defaults to node 109:4143's 88px — override for confirmed instances at a different size, e.g. the tab bar's center button is 72px (node 128:647). */
  size?: number
}

const DEFAULT_GRADIENT = 'linear-gradient(142.47deg, #F50056 15.164%, #F63176 47.707%, #FD4E8C 85.471%)'

// White highlight shape from node 109:4143 (asset "Ellipse 13") — the same
// "wide flat arc" geometry family as the slider knob's white highlight
// (Fix 3/4), read as raw SVG rather than approximated from a screenshot.
// `top` is the glow's vertical offset from the circle's own top edge,
// derived from the source's absolute positions (circle top=-1, glow
// top=42 → +43px). Horizontal centering is inferred, not read directly:
// the source positions both elements relative to a parent whose width
// isn't given by this node alone, but solving circle-center ≈ glow-center
// assuming a standard 393px screen (used throughout this file) lands
// them within ~3.5px of exactly centered — close enough to treat as
// intentionally centered rather than a deliberate horizontal offset.
const DEFAULT_GLOW = {
  width: 188,
  height: 53,
  path: 'M97.4077 53C150.968 53 166.676 0 188 0H0C36.1351 0 37.5626 53 97.4077 53Z',
  top: 43,
}

const DEFAULT_SIZE = 88 // per 109:4143 — not the 40px IconTapTarget convention; this button is explicitly larger in source
const ICON_SIZE = 28 // unchanged across confirmed sizes — 109:4143 (88px circle) and 128:647/128:649 (72px circle) both use a 28px Plus

/**
 * Circular gradient action button (e.g. the "+" floating action button) —
 * verified against node 109:4143. Structurally unrelated to IconTapTarget
 * (which stays correct/unchanged for genuinely flat, unstyled icon
 * buttons like back/search/close — confirmed against real Figma data in
 * earlier stages): this one composes two layers in one frame, same
 * pattern as the slider knob —
 *  - a white highlight shape sitting behind the circle (see GLOW_PATH)
 *  - an 88px circle (`size`, overridable — the tab bar's center button is
 *    72px, node 128:647/128:649) with a 3-stop diagonal gradient fill
 *    (`142.47deg, #F50056 15.164%, #F63176 47.707%, #FD4E8C 85.471%`), a
 *    flat 1px solid `#F56093` border (the source's stroke here is flat,
 *    not gradient — despite the request assuming otherwise, node
 *    109:4143 has a plain solid border, so that part of the ask doesn't
 *    hold and isn't implemented as a gradient), and a 2-layer inset
 *    shadow: `inset 0 -4px 4px #F62870, inset 3px 4px 5px rgba(255,255,255,.42)`.
 *
 * That shadow doesn't fit SheenSurface's existing `.sheen` formula: it's
 * 2 layers (not 4), and its second layer has a diagonal offset (x=3,
 * y=4), while every `.sheen` variant assumes single-axis offsets only
 * (0 on the top/bottom layers, y=0 on the edge layers). Extending the
 * shared formula for one diagonal-offset use isn't worth the added
 * parameterization, so — matching the precedent set by IntensitySlider's
 * knob/tick gradients — this button's shadow is a standalone inline
 * value, not routed through SheenSurface.
 *
 * The icon itself is also a solid white glyph in source (not a colored
 * line icon), which is naturally satisfied by rendering a Phosphor icon
 * in white on top of the saturated gradient fill.
 *
 * No other confirmed usage of this exact circular "+"-style button was
 * found in the nodes already fetched across this project (the wide
 * pill-shaped gradient "Save" button seen on the energy-level screen is a
 * visually related but structurally different component — full-width
 * with text, not an icon-only circle — and isn't merged into this one).
 */
export function GradientCircleButton({ icon: IconComponent, disabled, className, weight = 'fill', gradient = DEFAULT_GRADIENT, glow = DEFAULT_GLOW, size = DEFAULT_SIZE, ...rest }: GradientCircleButtonProps) {
  return (
    <span className={cn('relative inline-block shrink-0', className)} style={{ width: size, height: size }}>
      {/*
        The glow must be a SIBLING behind the button, not a child inside
        it — a child always paints on top of its parent's own CSS
        background, which would draw this white shape directly over the
        button's gradient fill instead of behind it. (The slider knob
        avoided this because both its shapes live in one SVG with an
        explicit paint order; this button's circle is a real <button>
        with a CSS gradient, not an SVG shape, so it needs this wrapper
        instead.) Only the sliver extending past the button's own
        rounded-pill edge should ever be visible.
      */}
      <svg
        width={glow.width}
        height={glow.height}
        viewBox={`0 0 ${glow.width} ${glow.height}`}
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute z-0 overflow-visible"
        style={{ left: '50%', top: glow.top, transform: 'translateX(-50%)' }}
      >
        <path d={glow.path} fill="white" />
      </svg>
      <button
        type="button"
        disabled={disabled}
        className="focus-ring relative z-10 flex size-full items-center justify-center rounded-pill border border-solid disabled:opacity-40"
        style={{
          borderColor: '#F56093',
          backgroundImage: gradient,
          boxShadow: 'inset 0 -4px 4px #F62870, inset 3px 4px 5px rgba(255,255,255,0.42)',
        }}
        {...rest}
      >
        <IconComponent size={ICON_SIZE} weight={weight} color="white" />
      </button>
    </span>
  )
}
