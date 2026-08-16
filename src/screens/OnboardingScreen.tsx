import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GradientActionButton } from '../components/GradientActionButton'
import { cn } from '../lib/cn'
import { useThemeColor } from '../lib/useThemeColor'
import wordmarkDot from '../assets/OnboardingWordmarkDot.png'
import noticeIcon from '../assets/OnboardingNotice.png'
import connectIcon from '../assets/OnboardingConnect.png'
import patternsIcon from '../assets/OnboardingPatterns.png'

const FEATURES = [
  { icon: noticeIcon, title: 'Notice what matters', description: 'Set up to 3 intentions for the things that matter most to you today.' },
  { icon: connectIcon, title: 'Connect with your emotions', description: 'Check in with your mood and find practices that help.' },
  { icon: patternsIcon, title: 'Find your patterns', description: 'See what becomes a priority, and what helps or gets in the way.' },
] as const

// Splash sequence timing (motion pass — get_design_context + get_screenshot
// on node 342:5736). That node is a single static frame, not a Figma
// prototype/smart-animate transition, so it has no timing/easing data of
// its own to extract — only geometry. These ms values are this
// implementation's own choice — slowed down from an earlier, snappier pass
// (~1.4s total) per explicit feedback that it should read as smoother, not
// abrupt; ~2.15s total now, still short enough to not feel like a loading
// screen.
const SPLASH_HOLD_MS = 200 // giant circle sits at full size before collapsing — "fills the screen, THEN collapses"
const SPLASH_COLLAPSE_MS = 950
// Explicit request: a single ball-drop bounce against the wordmark row,
// after the collapse settles and before the letters appear — not part of
// the collapse's own motion (that stays a clean, non-overshooting ease-out
// so the "landing" reads as one distinct beat, not a blurred-together
// wobble). Implemented as the `.splash-circle-bounce` CSS `@keyframes`
// (index.css) — review fix: an earlier version chained two separately
// JS-reassigned `transition`s (drop, then spring back), which visibly
// distorted the circle's shape for a frame during the handoff between
// them. A single declarative keyframe animation, touching only
// `translateY`, removes that risk by construction — see index.css's own
// doc comment for the full explanation. `SPLASH_BOUNCE_DOWN_MS` +
// `SPLASH_BOUNCE_UP_MS` must sum to what's set as the animation's
// duration below, and their ratio must match the keyframe's own 36% peak
// point in index.css — both noted at each end so they don't drift apart.
const SPLASH_BOUNCE_DOWN_MS = 200
const SPLASH_BOUNCE_UP_MS = 350
const SPLASH_BOUNCE_MS = SPLASH_BOUNCE_DOWN_MS + SPLASH_BOUNCE_UP_MS
const SPLASH_BOUNCE_DROP_PX = 12
const SPLASH_LETTERS_MS = 400

// Node 342:5736's own giant circle, verified via get_metadata: an ellipse
// named "Ellipse 20" — the SAME name as the small circle inside the
// wordmark's dot (also "Ellipse 20", confirming it's literally the same
// shape at two scales) — sized 1004×1004px, centered horizontally, and
// vertically 27px above the frame's own center (`top: calc(50% - 27px)`
// in the fetched code). Used as the default diameter (the common case,
// since this app's own frame is fixed at the same 393px width Figma's
// frame used); `Math.hypot(...)` is a fallback only for a container whose
// diagonal would otherwise exceed 1004px's coverage, so corners are never
// left unpainted on an unusually tall viewport.
const SPLASH_GIANT_DIAMETER = 1004
const SPLASH_CENTER_Y_OFFSET = -27

// The fill circle's own native (untransformed) size — see this file's own
// doc comment above `OnboardingScreen` for why 400, not the real dot's
// ~15px or the full giant diameter. Chosen so both `giantScale` (~2.5x at
// this app's own frame width) and `restScale` (~0.04x) stay comfortably
// inside "ordinary image scaling," nowhere near either extreme.
const SPLASH_CIRCLE_BASE_PX = 400

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * First-run onboarding — verified against node 342:5555 via get_design_context
 * + get_screenshot. `get_metadata` on this node (and on the page's root
 * canvas, tried as both `0:1` and `0:2`, the only two pages that tool
 * would resolve) never turned up a sibling onboarding frame, and the node
 * itself is fully self-contained — wordmark, headline, all 3 value props,
 * AND both CTAs on one frame, with no pagination dots/arrows anywhere in
 * its own tree. Treated as a single static screen, not a multi-step
 * sequence, on that basis.
 *
 * Icons: the 3 feature-row glyphs and the wordmark's dot are custom
 * gradient illustrations with their own 2-layer inner-shadow filter (not
 * swappable for a Phosphor icon — diffing confirmed no name match would
 * preserve the gradient fill), committed as local PNG exports
 * (`src/assets/Onboarding*.png`) rather than referencing the Figma
 * dev-server's own expiring asset URLs. Review fix: these were originally
 * SVGs (this project's usual pattern for exported illustrations, see
 * `TargetIllustration.tsx` etc.), swapped to pre-rasterized PNGs after
 * persistent blur/clipping traced back to how `<img>`-embedded SVGs
 * handle their own internal filter/canvas margins — see
 * `OnboardingWordmarkDot.png`'s own usage below for the full story. Each
 * PNG is a 3x export (144×144 for the 48px feature icons, 45×45 for the
 * 15px wordmark dot) so they stay crisp at the sizes they're actually
 * displayed at without any scaling math needed.
 *
 * "Get started" reuses `GradientActionButton` as-is — its primary-variant
 * gradient/border/shadow (`#F00A5B→#F63176→#FD5F97`, `#f56093` border,
 * the 2-layer inset shadow) is byte-identical to this node's own button,
 * already confirmed for MorningIntentionFlow/MoodFlowScreen, so this is
 * pure reuse, not a new button.
 *
 * "Sign in": registration is now REQUIRED (review fix) — every gated
 * route redirects here first if the user isn't registered, so there's no
 * "skip onboarding and enter the app" path anymore regardless of which
 * button is tapped. With no real sign-in flow built yet (Stage 6), this
 * link still does exactly what "Get started" does (routes to
 * `/register`) rather than guessing at a future auth flow — same open
 * question as before, just one step further down the chain now.
 *
 * Layout is adapted from the mock's absolute positioning (a fixed 842px
 * iPhone frame) into a flexible column: wordmark pinned near the top,
 * headline+features vertically centered in the remaining space, CTAs
 * pinned at the bottom — same structural intent, not a pixel-for-pixel
 * copy of Figma's own device-frame math (which bakes in a 50px fake
 * status bar this app never renders, matching every other screen here).
 * The background is a very subtle diagonal wash in the source (sampled
 * corner pixels ranged only ~255,220,245 to ~255,245,251) — reproduced as
 * a 2-stop CSS gradient rather than shipping a screen-sized exported PNG.
 *
 * Review fix: this is the one screen with a colored (non-white)
 * background, so on a real phone the mobile OS's own status-bar/notch
 * area — sitting outside this `h-screen` container entirely by default —
 * showed up as a visibly separate patch, however closely `theme-color`
 * below is kept color-matched to it (a FLAT fill can't match a diagonal
 * GRADIENT at every point along the top edge, only wherever it was
 * sampled from). Fixed at the root: `index.html`'s viewport meta now
 * carries `viewport-fit=cover`, which is what actually lets this
 * container's own `h-screen` — and therefore its gradient `background` —
 * extend under the status bar/notch instead of stopping short of it (this
 * flag is unavoidably global, being a single document-wide meta tag; see
 * the other screens' own top-padding, already written in the same
 * `env(safe-area-inset-*)` style as below, for why that's fine — they
 * were already meant to use real safe-area insets and simply had no
 * effect until this flag existed). With the background now free to paint
 * that far, the container's own top padding is what keeps the REAL
 * content (wordmark, headline) clear of the notch: `pt-16`'s fixed 64px
 * (this screen's own original clearance, chosen before there was a real
 * status bar to clear) is now a floor, not the only value — `max(4rem,
 * env(safe-area-inset-top) + 1rem)` — so non-notched viewports keep
 * exactly the original spacing, while notched ones get pushed down
 * exactly as far as the real inset requires, no more.
 *
 * Motion pass — logo splash (node 342:5736, "iPhone 16 - 340", the same
 * frame's giant-circle state): plays once on mount, before the rest of
 * this screen's content appears. TWO overlay `<div>`s, not one — an outer
 * positioning shell (`circleRef`) and an inner fill circle
 * (`circleFillRef`) — sized/placed via a `useLayoutEffect` FLIP, both
 * driven purely by `transform` (never `left`/`top`/`width`/`height`).
 * This two-element split, and the fill's `SPLASH_CIRCLE_BASE_PX` native
 * size, is itself a review fix with a two-stage history worth knowing if
 * this ever needs touching again:
 *
 * 1. The FIRST version was one div, native-sized to the real wordmark
 *    dot's ~15px rect, blown up to giant size via `transform: scale(~67x)`.
 *    Browsers rasterize a transformed element at roughly its own
 *    pre-transform size and stretch that bitmap for compositing — a 67x
 *    stretch of a 15px source came out visibly pixelated.
 * 2. The SECOND version "fixed" that by animating real `left`/`top`/
 *    `width`/`height` on a single ~1000px div instead of using `transform`
 *    at all — crisp (every size is repainted fresh, no stretched bitmap),
 *    but animating real box dimensions forces a full layout reflow on
 *    every frame. On a real phone (worse still in Low Power Mode) that
 *    reflow can't keep pace with the `window.setTimeout` schedule below,
 *    so the visual shrink lagged behind the JS timers — `doneTimer` fired
 *    (swapping in the real dot + content) while the overlay, mid-reflow,
 *    was still large and visibly straining. Confirmed on-device, not
 *    hypothetical.
 *
 * The fix used now avoids BOTH failure modes by decoupling POSITION from
 * SCALE onto two elements: the outer shell's native size/position is
 * ALWAYS exactly the real dot's small `circleRect` (never animated) and
 * only ever gets `transform: translate()` — ordinary translation doesn't
 * resample a bitmap, so it can't blur regardless of distance. The inner
 * fill circle's native size is ALWAYS `SPLASH_CIRCLE_BASE_PX` (400px,
 * also never animated as a real dimension) and only ever gets
 * `transform: scale()` — because its native size is already close to
 * both the giant and resting displayed sizes, neither direction is an
 * extreme stretch, so no visible blur. Both are pure compositor-only
 * `transform` transitions (no reflow), so this performs like the FIRST
 * version, not the second, while looking as crisp as neither alone
 * managed. `giantScale`/`restScale` below are the inner circle's two
 * endpoints; `tx`/`ty` are the outer shell's own two endpoints — both
 * computed once, up front, from measured DOM rects (not hardcoded Figma
 * offsets), so this stays correct regardless of layout differences from
 * the adapted-flexible-column structure below. The `t`/`day` letters get
 * a similar treatment in miniature: pulled in to overlap the dot's center
 * (opacity 0) at start, then slid back to their natural flex-laid-out
 * position once the circle has finished collapsing AND bounced —
 * "letters slide out from within the circle to reveal the full wordmark,"
 * per the brief. Explicit request: between the collapse settling and the
 * letters appearing, the circle does one ball-drop bounce against the
 * wordmark row (`translateY` down then back up with a slight
 * overshoot-settle, see the timing constants' own doc comment) — applied
 * to the OUTER shell only, whose resting transform reduces to a no-op
 * translate, so the existing `translateY`-only keyframes still compose
 * correctly on top without needing to know about the inner fill circle
 * at all.
 *
 * `prefers-reduced-motion: reduce` skips the whole sequence — the overlay
 * never mounts and the screen's real content is visible immediately.
 */
export function OnboardingScreen() {
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()

  const [contentVisible, setContentVisible] = useState(reducedMotion)
  const [showSplashCircle, setShowSplashCircle] = useState(!reducedMotion)

  const containerRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)
  const circleFillRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLImageElement>(null)
  const tRef = useRef<HTMLSpanElement>(null)
  const dayRef = useRef<HTMLSpanElement>(null)

  // `index.html`'s `theme-color` (and the manifest's matching `theme_color`)
  // is white, to match the plain white background every OTHER screen uses —
  // this is the one screen with a colored background instead (the diagonal
  // wash below), so it swaps the browser/OS chrome color to match its own
  // top edge for the duration it's mounted, restoring whatever value was
  // there before on unmount. `#ffdcf5` is the same sampled top-corner value
  // already cited above (this screen's own doc comment), not a new color.
  //
  // Review fix: kept even after adding the `viewport-fit=cover` +
  // safe-area-inset extension above — the two aren't solving the same
  // problem twice. This meta tag colors chrome the app's own content can
  // never reach: Safari's address-bar/toolbar in regular (non-standalone)
  // browsing, and (per platform behavior that needs a real device to
  // fully confirm) the reserved status-bar fill some standalone/home-screen
  // contexts still use before layout/paint has run. The safe-area
  // extension above covers the opposite case: this screen's OWN gradient
  // painting under the notch once it's allowed to. Belt and suspenders,
  // not redundant — dropping either one re-opens a seam the other doesn't
  // cover.
  useThemeColor('#ffdcf5')

  useLayoutEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    const circle = circleRef.current
    const circleFill = circleFillRef.current
    const dot = dotRef.current
    const tEl = tRef.current
    const dayEl = dayRef.current
    if (!container || !circle || !circleFill || !dot || !tEl || !dayEl) return

    // The real dot <img> is measured for its rect below, but was never
    // actually hidden — review fix: the overlay circle only ever LOOKED
    // like the one true circle because it happened to sit exactly on top
    // of this real one at rest. The moment the bounce moves the overlay
    // away (`translateY`), the real dot underneath is uncovered — two
    // visible circles, one static (this one) and one bouncing (the
    // overlay). Hiding the real dot for the sequence's duration and
    // restoring it once the overlay has fully faded/unmounted (doneTimer
    // below, and the cleanup on early unmount) makes the handoff seamless.
    dot.style.opacity = '0'

    const containerRect = container.getBoundingClientRect()
    const dotRect = dot.getBoundingClientRect()

    // `OnboardingWordmarkDot.png` (review fix — swapped from a live-rendered
    // SVG to a pre-rasterized PNG to fix persistent blur/clipping: an SVG's
    // internal filter/canvas margins can get clipped when consumed via
    // `<img>` regardless of the SVG's own `overflow` setting, a class of
    // bug a plain raster export sidesteps entirely). This asset is a tight
    // SQUARE crop of just the circle itself — no asymmetric padding baked
    // in on any side (unlike the old SVG, which had 5px of clearance above
    // the circle but none on its other 3 sides) — so the `<img>`'s own
    // measured rect IS the circle's rect, with nothing to derive.
    const circleRect = dotRect
    const dotCenterX = circleRect.left + circleRect.width / 2
    const dotCenterY = circleRect.top + circleRect.height / 2

    const diameter = Math.max(SPLASH_GIANT_DIAMETER, Math.hypot(containerRect.width, containerRect.height) * 1.15)
    const targetCenterX = containerRect.left + containerRect.width / 2
    const targetCenterY = containerRect.top + containerRect.height / 2 + SPLASH_CENTER_Y_OFFSET

    // Outer shell: native size/position is ALWAYS the real dot's small
    // `circleRect` (set once, never animated) — only `transform: translate()`
    // moves it, from the giant state's screen-centered position back to
    // (0,0), i.e. its own native spot. See this component's own doc
    // comment for why position and scale are split across two elements.
    const tx = targetCenterX - dotCenterX
    const ty = targetCenterY - dotCenterY
    circle.style.left = `${circleRect.left}px`
    circle.style.top = `${circleRect.top}px`
    circle.style.width = `${circleRect.width}px`
    circle.style.height = `${circleRect.height}px`
    circle.style.transform = `translate(${tx}px, ${ty}px)`

    // Inner fill circle: native size is ALWAYS `SPLASH_CIRCLE_BASE_PX`
    // (also set once, never animated) — only `transform: scale()` resizes
    // it, between `giantScale` (fills the screen) and `restScale` (matches
    // the real dot). `translate(-50%, -50%)` re-centers it on the outer
    // shell's own center regardless of its own larger native box — the
    // percentages resolve against ITS OWN untransformed size, so this
    // stays correct however `SPLASH_CIRCLE_BASE_PX` is tuned.
    const giantScale = diameter / SPLASH_CIRCLE_BASE_PX
    const restScale = circleRect.width / SPLASH_CIRCLE_BASE_PX
    circleFill.style.width = `${SPLASH_CIRCLE_BASE_PX}px`
    circleFill.style.height = `${SPLASH_CIRCLE_BASE_PX}px`
    circleFill.style.transform = `translate(-50%, -50%) scale(${giantScale})`

    // Letters start pulled onto the dot's own center — visually swallowed
    // by the (still giant, or just-landed) circle.
    const tRect = tEl.getBoundingClientRect()
    const dayRect = dayEl.getBoundingClientRect()
    tEl.style.transform = `translateX(${dotCenterX - (tRect.left + tRect.width / 2)}px)`
    tEl.style.opacity = '0'
    dayEl.style.transform = `translateX(${dotCenterX - (dayRect.left + dayRect.width / 2)}px)`
    dayEl.style.opacity = '0'

    // Flushes the styles above as a real paint before the timers below
    // change them again — without this the browser can coalesce both
    // states into one frame and skip the transition entirely.
    void circle.offsetHeight

    const collapseTimer = window.setTimeout(() => {
      const transition = `transform ${SPLASH_COLLAPSE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
      circle.style.transition = transition
      circle.style.transform = 'translate(0, 0)'
      circleFill.style.transition = transition
      circleFill.style.transform = `translate(-50%, -50%) scale(${restScale})`
    }, SPLASH_HOLD_MS)

    // Bounce — a single CSS `@keyframes` animation (`.splash-circle-bounce`,
    // index.css), not further inline-style transitions: see that class's
    // own doc comment and this file's `SPLASH_BOUNCE_*` constants for why.
    // Setting the custom property + duration here (rather than hardcoding
    // them in the CSS class) keeps the drop distance/timing tunable from
    // one place; adding the class is what actually starts the animation.
    const bounceTimer = window.setTimeout(() => {
      circle.style.setProperty('--splash-bounce-drop', `${SPLASH_BOUNCE_DROP_PX}px`)
      circle.style.animationDuration = `${SPLASH_BOUNCE_MS}ms`
      circle.classList.add('splash-circle-bounce')
    }, SPLASH_HOLD_MS + SPLASH_COLLAPSE_MS)

    const lettersTimer = window.setTimeout(
      () => {
        const lettersTransition = `transform ${SPLASH_LETTERS_MS}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${SPLASH_LETTERS_MS}ms ease-out`
        tEl.style.transition = lettersTransition
        dayEl.style.transition = lettersTransition
        tEl.style.transform = 'translateX(0)'
        tEl.style.opacity = '1'
        dayEl.style.transform = 'translateX(0)'
        dayEl.style.opacity = '1'
      },
      SPLASH_HOLD_MS + SPLASH_COLLAPSE_MS + SPLASH_BOUNCE_MS,
    )

    // Review fix: this used to fade the overlay's own opacity to 0, then
    // separately (after that fade finished) snap the real dot's opacity
    // from 0 to 1 with no transition of its own — a fade-to-nothing
    // followed by an instant pop reads exactly as "disappears, then
    // reappears," even though the two are pixel-aligned and the fade was
    // pointless: the overlay IS already sitting exactly where the real dot
    // needs to be, so there's nothing to visually hand off. Swapping them
    // in the same tick, with neither given an opacity transition, is
    // completely imperceptible — same pixels, before and after. The rest
    // of the screen's own reveal (`contentVisible`, its own separate
    // `duration-300` fade in the JSX below) is unrelated and keeps its own
    // timing.
    const doneTimer = window.setTimeout(
      () => {
        dot.style.opacity = ''
        setShowSplashCircle(false)
        setContentVisible(true)
      },
      SPLASH_HOLD_MS + SPLASH_COLLAPSE_MS + SPLASH_BOUNCE_MS + SPLASH_LETTERS_MS,
    )

    return () => {
      window.clearTimeout(collapseTimer)
      window.clearTimeout(bounceTimer)
      window.clearTimeout(lettersTimer)
      window.clearTimeout(doneTimer)
      dot.style.opacity = ''
    }
  }, [reducedMotion])

  const finishOnboarding = () => navigate('/register')

  // Container's `pb-[max(24px,env(safe-area-inset-bottom))]` below (review
  // fix): the old flat `pb-6` (24px) predates `viewport-fit=cover` going
  // global — this screen's own "Get started"/"Sign in" pair is the true
  // bottom-of-screen content, now exposed to the same home-indicator gap
  // that flag opened up everywhere else. `max()` keeps the original 24px
  // as the floor on non-notched devices, same pattern as the top padding
  // just above it.
  //
  // Review fix — `h-dvh`, not `h-screen` (`100vh`): on iOS Safari `100vh`
  // is fixed to the LARGEST possible viewport (toolbar fully collapsed),
  // even while the toolbar is currently showing and less is genuinely
  // visible — so this container used to render taller than what was
  // actually on screen, pushing "Sign in" behind the toolbar until the
  // page itself was scrolled (which is what collapses the toolbar).
  // `100dvh` tracks the CURRENTLY visible viewport instead, so the
  // container is never taller than what's really on screen and this
  // single static view never needs a scroll to reach it. See the two
  // `gap-[clamp(...)]` values below for the OTHER, independent half of
  // this fix — confirmed via direct measurement that content can also
  // genuinely overflow a short-enough real viewport even with the
  // correct height unit, not just APPEAR to via the `vh` mismatch above.
  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-dvh w-full max-w-[393px] flex-col overflow-hidden px-5 pt-[max(4rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(24px,env(safe-area-inset-bottom))]"
      style={{ background: 'linear-gradient(225deg, #ffdcf5 0%, #fff5fb 100%)' }}
    >
      <div className="flex items-center justify-center">
        <span ref={tRef} className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">
          t
        </span>
        {/*
          45×45 source (3x), displayed at 15×15 — a clean square crop of
          just the circle, see this file's own doc comment above.
          `translate-y-[2px]`: the circle's own visual center sits slightly
          above the "t"/"day" letters' vertical center at this font size
          (review fix, tuned down from an initial +5px per feedback) —
          nudged down to align, without touching the letters' own
          position. `circleRect` below reads this element's OWN measured
          (post-transform) rect, so the splash animation's landing spot
          picks up this same offset automatically — one source of truth,
          nothing to keep in sync by hand.
        */}
        <img ref={dotRef} src={wordmarkDot} alt="" className="h-[15px] w-[15px] translate-y-[2px]" />
        <span ref={dayRef} className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">
          day
        </span>
      </div>

      {/*
        Both gaps below are `clamp(MIN, slope·1vh + offset, MAX)`, not a
        fixed `gap-10`/`gap-8` (review fix, companion to the `h-dvh` fix
        above): this section has no `min-height:0`, so on a short enough
        real viewport its own intrinsic content height simply won't
        shrink to fit `flex-1`'s available space — it overflows instead,
        `h-dvh` alone can't prevent that (confirmed via direct
        measurement, not assumed: at a 600px-tall viewport, "Sign in" ran
        30px past the bottom edge even with a correctly-sized container).
        `MAX` in each is this screen's own original value (2.5rem=40px,
        2rem=32px) — the exact number Figma verified — so on any
        reasonably tall device nothing changes at all; `MIN` (1rem, 0.75rem)
        is a floor that keeps rows from crowding into each other rather
        than letting the gap go to zero. The linear term is tuned so MAX
        is reached around an 800px-tall viewport (a roomy, common phone
        height) and MIN around 560px (near the shortest common iPhone's
        real visible height once Safari's own toolbar is accounted for),
        so most devices see no visible change and only genuinely short
        ones see spacing ease off gracefully instead of overflowing.
      */}
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-[clamp(1rem,10vh_-_40px,2.5rem)] transition-opacity duration-300', contentVisible ? 'opacity-100' : 'opacity-0')}>
        <h1 className="w-full text-center font-serif text-[28px] leading-normal tracking-[-0.56px] text-ink">Step out of autopilot. Gently.</h1>

        <div className="flex w-full flex-col gap-[clamp(0.75rem,8vh_-_32px,2rem)]">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex w-full items-center gap-5">
              <img src={feature.icon} alt="" className="size-12 shrink-0" />
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="font-sans text-lg font-semibold text-[#2d3039]">{feature.title}</p>
                <p className="font-sans text-base leading-[1.5] text-[#3b3e45]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn('flex flex-col gap-4 transition-opacity duration-300', contentVisible ? 'opacity-100' : 'opacity-0')}>
        <GradientActionButton onClick={finishOnboarding}>Get started</GradientActionButton>
        <button type="button" onClick={finishOnboarding} className="focus-ring pressable font-sans text-lg font-semibold text-[#e90555]">
          Sign in
        </button>
      </div>

      {showSplashCircle && (
        <div ref={circleRef} aria-hidden="true" className="pointer-events-none fixed z-50">
          <div
            ref={circleFillRef}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{ backgroundImage: 'linear-gradient(180deg, #F684C3, #F00A5B)' }}
          />
        </div>
      )}
    </div>
  )
}
