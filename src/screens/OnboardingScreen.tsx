import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GradientActionButton } from '../components/GradientActionButton'
import { cn } from '../lib/cn'
import wordmarkDot from '../assets/OnboardingWordmarkDot.svg'
import noticeIcon from '../assets/OnboardingNotice.svg'
import connectIcon from '../assets/OnboardingConnect.svg'
import patternsIcon from '../assets/OnboardingPatterns.svg'

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
 * preserve the gradient fill), downloaded and committed as local SVGs
 * (`src/assets/Onboarding*.svg`) per this project's own established
 * pattern for exported illustrations (see `TargetIllustration.tsx` etc.)
 * rather than referencing the Figma dev-server's own expiring asset URLs.
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
 * Motion pass — logo splash (node 342:5736, "iPhone 16 - 340", the same
 * frame's giant-circle state): plays once on mount, before the rest of
 * this screen's content appears. A single overlay `<div>` (`circleRef`)
 * is sized/positioned via a `useLayoutEffect` FLIP: it starts EXACTLY
 * matching the real wordmark dot's own measured rect (so its "resting"
 * transform is just `translate(0,0) scale(1)`, i.e. indistinguishable
 * from the real dot underneath it), then gets an initial inline
 * `transform: translate(tx,ty) scale(s)` that blows it up to
 * `SPLASH_GIANT_DIAMETER` and re-centers it on the screen — both
 * endpoints are known up front (no separate measurement of a "giant"
 * state needed), so this is a plain two-keyframe CSS transition, not a
 * spring/library-driven animation. The `t`/`day` letters get the same
 * treatment in miniature: pulled in to overlap the dot's center (opacity
 * 0) at start, then slid back to their natural flex-laid-out position once
 * the circle has finished collapsing AND bounced — "letters slide out from
 * within the circle to reveal the full wordmark," per the brief. Explicit
 * request: between the collapse settling and the letters appearing, the
 * circle does one ball-drop bounce against the wordmark row (`translateY`
 * down then back up with a slight overshoot-settle, see the timing
 * constants' own doc comment) — never touches `scale`, so this can't
 * reintroduce the earlier oval-shape bug. Measuring
 * real DOM rects (rather than hardcoding Figma's own absolute pixel
 * offsets) keeps this correct regardless of any layout differences from
 * the adapted-flexible-column structure above.
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
  const dotRef = useRef<HTMLImageElement>(null)
  const tRef = useRef<HTMLSpanElement>(null)
  const dayRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    const circle = circleRef.current
    const dot = dotRef.current
    const tEl = tRef.current
    const dayEl = dayRef.current
    if (!container || !circle || !dot || !tEl || !dayEl) return

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

    // The dot <img>'s own bounding box is 15×20 (OnboardingWordmarkDot.svg's
    // viewBox), NOT square — the circle it draws is a 15×15 circle sitting
    // in the BOTTOM of that box (svg: viewBox 0 0 15 20, circle cx=7.5
    // cy=12.5 r=7.5, i.e. it spans y:[5,20], leaving 5px of transparent
    // padding above it). Sizing the overlay to the full 15×20 box and
    // rounding it made a stadium/oval shape, not a circle — imperceptible
    // at 15×20px but very visible once scaled ~67x for the giant state
    // (review fix). `circleRect` below is the actual circle's own square
    // footprint, derived from the dot rect rather than hardcoded, so this
    // stays correct if the dot's rendered size ever changes.
    const circleDiameter = dotRect.width
    const circleRect = { left: dotRect.left, top: dotRect.top + (dotRect.height - circleDiameter), width: circleDiameter, height: circleDiameter }
    const dotCenterX = circleRect.left + circleRect.width / 2
    const dotCenterY = circleRect.top + circleRect.height / 2

    // Resting geometry: the overlay circle occupies exactly the real
    // circle's own square rect, so its identity transform already overlays
    // the real dot exactly (not the img's own taller bounding box).
    circle.style.left = `${circleRect.left}px`
    circle.style.top = `${circleRect.top}px`
    circle.style.width = `${circleRect.width}px`
    circle.style.height = `${circleRect.height}px`

    const diameter = Math.max(SPLASH_GIANT_DIAMETER, Math.hypot(containerRect.width, containerRect.height) * 1.15)
    const scale = diameter / circleRect.width
    const targetCenterX = containerRect.left + containerRect.width / 2
    const targetCenterY = containerRect.top + containerRect.height / 2 + SPLASH_CENTER_Y_OFFSET
    const tx = targetCenterX - dotCenterX
    const ty = targetCenterY - dotCenterY
    circle.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`

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
      circle.style.transition = `transform ${SPLASH_COLLAPSE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
      circle.style.transform = 'translate(0, 0) scale(1)'
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

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-screen w-full max-w-[393px] flex-col overflow-hidden px-5 pt-16 pb-6"
      style={{ background: 'linear-gradient(225deg, #ffdcf5 0%, #fff5fb 100%)' }}
    >
      <div className="flex items-center justify-center">
        <span ref={tRef} className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">
          t
        </span>
        <img ref={dotRef} src={wordmarkDot} alt="" className="h-5 w-[15px]" />
        <span ref={dayRef} className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">
          day
        </span>
      </div>

      <div className={cn('flex flex-1 flex-col items-center justify-center gap-10 transition-opacity duration-300', contentVisible ? 'opacity-100' : 'opacity-0')}>
        <h1 className="w-full text-center font-serif text-[28px] leading-normal tracking-[-0.56px] text-ink">Step out of autopilot. Gently.</h1>

        <div className="flex w-full flex-col gap-8">
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
        <div
          ref={circleRef}
          aria-hidden="true"
          className="pointer-events-none fixed z-50 rounded-full"
          style={{ backgroundImage: 'linear-gradient(180deg, #F684C3, #F00A5B)', transformOrigin: 'center' }}
        />
      )}
    </div>
  )
}
