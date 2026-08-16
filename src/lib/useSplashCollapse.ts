import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

// Node 342:5736's own giant circle (OnboardingScreen's source frame),
// verified via get_metadata: 1004×1004px. Used as the default diameter
// floor; `Math.hypot(...)` below is the fallback for a viewport whose
// diagonal would otherwise exceed that coverage, so corners are never left
// unpainted on an unusually large screen.
const SPLASH_GIANT_DIAMETER = 1004

// The fill circle's own native (untransformed) size — chosen so both the
// giant scale (~2.5x at this app's own 393px frame width) and the resting
// scale (~0.04x for the 15px wordmark dot) stay comfortably inside
// "ordinary image scaling," nowhere near either extreme where a browser's
// bitmap resampling would visibly blur. See `OnboardingScreen.tsx`'s own
// (pre-extraction) doc comment for the two failed approaches this avoids —
// still the right context if this hook's own math ever needs revisiting.
const SPLASH_CIRCLE_BASE_PX = 400

// Bounce timing is NOT a caller-configurable option, deliberately — see
// this hook's own doc comment below for why.
const BOUNCE_DOWN_MS = 200
const BOUNCE_UP_MS = 350
const BOUNCE_MS = BOUNCE_DOWN_MS + BOUNCE_UP_MS

export interface UseSplashCollapseOptions {
  /** False skips the whole sequence — no overlay ever mounts, the target is never hidden. Callers should pass their own `prefers-reduced-motion` check (and/or a one-shot "already played" flag) in here rather than the hook owning either concern. */
  active: boolean
  /** Element to hide (opacity 0, pointer-events none) for the sequence's duration, measure for its landing rect, and reveal again once done. */
  targetRef: RefObject<HTMLElement | null>
  /** CSS `background-image` value for the circle's fill — e.g. a `linear-gradient(...)`. */
  gradient: string
  /** Vertical offset (px) from the viewport's own center for the GIANT state's center point. Default 0. OnboardingScreen's source frame centers its giant circle 27px above true center — pass `-27` to match. */
  centerYOffset?: number
  /** How long the giant circle sits at full size before collapsing. Default 200. */
  holdMs?: number
  /** Collapse duration (giant → resting size/position). Default 950. */
  collapseMs?: number
  /** Drop distance (px) for the post-collapse bounce, via the `--splash-bounce-drop` custom property consumed by `.splash-circle-bounce` (index.css). Default 12. */
  bounceDropPx?: number
  /** How long the caller's OWN reveal transition (letters sliding in, an icon fading in, etc.) takes — the hook waits this long after `onReveal` fires before restoring the target's opacity and unmounting the overlay, so the swap lands exactly when the caller's reveal has finished. No default: every caller's reveal is different, this shouldn't silently drift from it. */
  revealMs: number
  /** Fires once, synchronously within the same pre-paint layout effect that sizes the giant circle — before the giant state is actually applied. Lets a caller reuse the same measured rect for its own math (e.g. OnboardingScreen positions its "t"/"day" letters off the dot's measured center) without re-measuring. */
  onMeasured?: (targetRect: DOMRect) => void
  /** Fires when the bounce settles — the moment the caller should start its own reveal transition (matching `revealMs` above). */
  onReveal?: () => void
  /** Fires `revealMs` after `onReveal`, in the same tick the hook restores the target's opacity and unmounts the overlay — the moment the caller's own reveal transition should have just finished, e.g. to reveal the REST of a screen's content right as the reveal animation completes rather than while it's still running. */
  onDone?: () => void
}

export interface UseSplashCollapseResult {
  /** Outer shell — native size/position is always the target's own rect; only ever `transform: translate()`s. Render as a `fixed` (or otherwise viewport-positioned) `aria-hidden` div, sized via inline style once mounted (do not set width/height yourself). */
  circleRef: RefObject<HTMLDivElement | null>
  /** Inner fill — native size is always `SPLASH_CIRCLE_BASE_PX`; only ever `transform: scale()`s. Render as its child, `position: absolute; top/left: 50%` — the hook sets its `backgroundImage` itself (from `gradient` above), no need to set it again in the caller's own JSX. */
  circleFillRef: RefObject<HTMLDivElement | null>
  /** Whether the overlay should be mounted at all right now. */
  showSplashCircle: boolean
}

/**
 * Giant-circle-collapses-onto-a-target FLIP animation, shared by
 * `OnboardingScreen` (lands on the wordmark dot) and `BottomNav` (lands on
 * the check-in FAB) — extracted from what was originally one-off logic
 * inside `OnboardingScreen.tsx`. Two nested overlay elements (`circleRef`
 * shell, `circleFillRef` fill), decoupling POSITION from SCALE so neither
 * transform direction ever stretches a bitmap far enough to blur: the
 * shell's native box is always exactly `targetRef`'s own rect and only
 * ever translates; the fill's native box is always `SPLASH_CIRCLE_BASE_PX`
 * and only ever scales (between a giant multiple and a tiny fraction of
 * that base, both "ordinary" scaling ranges). Both are pure
 * compositor-only `transform` transitions — no layout reflow per frame.
 *
 * Sequence: mount already giant + centered on the viewport (computed from
 * `window.innerWidth/innerHeight`, not a passed-in container — this app's
 * screens are all `mx-auto`-centered full-height columns, so the viewport
 * center already coincides with any of their own centers) → hold →
 * collapse onto the target's rect (cubic-bezier ease-out) → one CSS
 * `@keyframes` ball-drop bounce (`.splash-circle-bounce`, index.css) →
 * `onReveal()` → after `revealMs`, restore the target's opacity and
 * unmount the overlay in the same tick (imperceptible swap — the overlay
 * is by then sitting exactly where the target already is) → `onDone()`.
 *
 * Bounce timing (`BOUNCE_DOWN_MS`/`BOUNCE_UP_MS` above) is intentionally
 * NOT part of `UseSplashCollapseOptions` — `.splash-circle-bounce`'s own
 * `@keyframes` (index.css) hardcodes its peak keyframe at 36%, which is
 * only correct for this exact 200/350 split. Exposing independent
 * down/up durations as options would let a future caller silently pass
 * values that no longer match that CSS constant. `bounceDropPx` is safe
 * to expose since it only feeds the `--splash-bounce-drop` custom
 * property, not the timing split.
 */
export function useSplashCollapse({
  active,
  targetRef,
  gradient,
  centerYOffset = 0,
  holdMs = 200,
  collapseMs = 950,
  bounceDropPx = 12,
  revealMs,
  onMeasured,
  onReveal,
  onDone,
}: UseSplashCollapseOptions): UseSplashCollapseResult {
  const [showSplashCircle, setShowSplashCircle] = useState(active)
  const circleRef = useRef<HTMLDivElement>(null)
  const circleFillRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!active) return
    const target = targetRef.current
    const circle = circleRef.current
    const circleFill = circleFillRef.current
    if (!target || !circle || !circleFill) return

    // Set here (not left for the caller's own JSX `style`) so this hook is
    // the single source of truth for the fill's gradient — still lands
    // before the browser's first paint of the mounted overlay, since
    // `useLayoutEffect` runs pre-paint.
    circleFill.style.backgroundImage = gradient

    // `pointerEvents: 'none'` alongside opacity — opacity alone doesn't
    // remove an element from hit-testing, so without this an interactive
    // target (e.g. BottomNav's real check-in button, sitting invisibly
    // under the giant overlay) would still be tappable for the sequence's
    // ~2s duration.
    target.style.opacity = '0'
    target.style.pointerEvents = 'none'

    const targetRect = target.getBoundingClientRect()
    onMeasured?.(targetRect)
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2

    const diameter = Math.max(SPLASH_GIANT_DIAMETER, Math.hypot(window.innerWidth, window.innerHeight) * 1.15)
    const giantCenterX = window.innerWidth / 2
    const giantCenterY = window.innerHeight / 2 + centerYOffset

    // Outer shell: native size/position is always the target's own rect
    // (set once, never animated) — only `transform: translate()` moves it,
    // from the giant state's screen-centered position back to (0,0), i.e.
    // its own native spot.
    const tx = giantCenterX - targetCenterX
    const ty = giantCenterY - targetCenterY
    circle.style.left = `${targetRect.left}px`
    circle.style.top = `${targetRect.top}px`
    circle.style.width = `${targetRect.width}px`
    circle.style.height = `${targetRect.height}px`
    circle.style.transform = `translate(${tx}px, ${ty}px)`

    // Inner fill: native size is always SPLASH_CIRCLE_BASE_PX (also set
    // once) — only `transform: scale()` resizes it, between the giant
    // scale (fills the viewport) and the resting scale (matches the
    // target). `translate(-50%, -50%)` re-centers it on the shell's own
    // center regardless of its own larger native box.
    const giantScale = diameter / SPLASH_CIRCLE_BASE_PX
    const restScale = targetRect.width / SPLASH_CIRCLE_BASE_PX
    circleFill.style.width = `${SPLASH_CIRCLE_BASE_PX}px`
    circleFill.style.height = `${SPLASH_CIRCLE_BASE_PX}px`
    circleFill.style.transform = `translate(-50%, -50%) scale(${giantScale})`

    // Flushes the styles above as a real paint before the timers below
    // change them again — without this the browser can coalesce both
    // states into one frame and skip the transition entirely.
    void circle.offsetHeight

    const collapseTimer = window.setTimeout(() => {
      const transition = `transform ${collapseMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
      circle.style.transition = transition
      circle.style.transform = 'translate(0, 0)'
      circleFill.style.transition = transition
      circleFill.style.transform = `translate(-50%, -50%) scale(${restScale})`
    }, holdMs)

    const bounceTimer = window.setTimeout(() => {
      circle.style.setProperty('--splash-bounce-drop', `${bounceDropPx}px`)
      circle.style.animationDuration = `${BOUNCE_MS}ms`
      circle.classList.add('splash-circle-bounce')
    }, holdMs + collapseMs)

    const revealTimer = window.setTimeout(() => {
      onReveal?.()
    }, holdMs + collapseMs + BOUNCE_MS)

    const doneTimer = window.setTimeout(
      () => {
        target.style.opacity = ''
        target.style.pointerEvents = ''
        setShowSplashCircle(false)
        onDone?.()
      },
      holdMs + collapseMs + BOUNCE_MS + revealMs,
    )

    return () => {
      window.clearTimeout(collapseTimer)
      window.clearTimeout(bounceTimer)
      window.clearTimeout(revealTimer)
      window.clearTimeout(doneTimer)
      target.style.opacity = ''
      target.style.pointerEvents = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return { circleRef, circleFillRef, showSplashCircle }
}
