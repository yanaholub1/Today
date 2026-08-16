import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GradientActionButton } from '../components/GradientActionButton'
import { cn } from '../lib/cn'
import { useThemeColor } from '../lib/useThemeColor'
import { useSplashCollapse } from '../lib/useSplashCollapse'
import { ONBOARDING_SPLASH_GRADIENT } from '../lib/splashGradients'
import wordmarkDot from '../assets/OnboardingWordmarkDot.png'
import noticeIcon from '../assets/OnboardingNotice.png'
import connectIcon from '../assets/OnboardingConnect.png'
import patternsIcon from '../assets/OnboardingPatterns.png'

const FEATURES = [
  { icon: noticeIcon, title: 'Notice what matters', description: 'Set up to 3 intentions for the things that matter most to you today.' },
  { icon: connectIcon, title: 'Connect with your emotions', description: 'Check in with your mood and find practices that help.' },
  { icon: patternsIcon, title: 'Find your patterns', description: 'See what becomes a priority, and what helps or gets in the way.' },
] as const

// The circle's own giant/hold/collapse/bounce timing now lives in
// `useSplashCollapse` (src/lib/useSplashCollapse.ts), shared with
// BottomNav's own check-in-FAB splash — see that hook's own doc comment
// for the full sequence and timing rationale (slowed down from an earlier,
// snappier ~1.4s pass per explicit feedback that it should read as
// smoother, not abrupt). This is only this screen's OWN remaining timing
// value: how long the "t"/"day" letters take to slide back + fade in once
// the circle's bounce settles — handed to the hook as `revealMs` so its
// final swap (restoring the real dot, unmounting the overlay) lands
// exactly when this finishes, not before or after.
const SPLASH_LETTERS_MS = 400

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
 * this screen's content appears, via `useSplashCollapse` (see that hook's
 * own doc comment for the shared giant-circle-collapses-onto-a-target
 * mechanics). This screen's own remaining job is just the "t"/"day"
 * letters: `onMeasured` (fired by the hook, mid-layout-effect, with the
 * dot's just-measured rect) pulls both letters in to overlap the dot's own
 * center (opacity 0) — visually swallowed by the still-giant circle —
 * `onReveal` (fired once the hook's bounce settles) slides them back to
 * their natural flex-laid-out position while fading in, and `onDone`
 * (fired once that reveal has had `SPLASH_LETTERS_MS` to finish) reveals
 * the rest of the screen's content (`contentVisible`, its own separate
 * `duration-300` fade below) — "letters slide out from within the circle
 * to reveal the full wordmark," per the brief.
 *
 * `prefers-reduced-motion: reduce` skips the whole sequence (`active:
 * !reducedMotion` below) — the overlay never mounts, `onMeasured`/
 * `onReveal`/`onDone` never fire, and the screen's real content
 * (including the letters, which are never touched) is visible
 * immediately.
 */
export function OnboardingScreen() {
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()

  const [contentVisible, setContentVisible] = useState(reducedMotion)

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

  const { circleRef, circleFillRef, showSplashCircle } = useSplashCollapse({
    active: !reducedMotion,
    targetRef: dotRef,
    gradient: ONBOARDING_SPLASH_GRADIENT,
    centerYOffset: -27, // node 342:5736's giant circle sits 27px above true center — see useSplashCollapse's own doc comment
    revealMs: SPLASH_LETTERS_MS,
    onMeasured: (dotRect) => {
      const tEl = tRef.current
      const dayEl = dayRef.current
      if (!tEl || !dayEl) return
      const dotCenterX = dotRect.left + dotRect.width / 2
      const tRect = tEl.getBoundingClientRect()
      const dayRect = dayEl.getBoundingClientRect()
      tEl.style.transform = `translateX(${dotCenterX - (tRect.left + tRect.width / 2)}px)`
      tEl.style.opacity = '0'
      dayEl.style.transform = `translateX(${dotCenterX - (dayRect.left + dayRect.width / 2)}px)`
      dayEl.style.opacity = '0'
    },
    onReveal: () => {
      const tEl = tRef.current
      const dayEl = dayRef.current
      if (!tEl || !dayEl) return
      const lettersTransition = `transform ${SPLASH_LETTERS_MS}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${SPLASH_LETTERS_MS}ms ease-out`
      tEl.style.transition = lettersTransition
      dayEl.style.transition = lettersTransition
      tEl.style.transform = 'translateX(0)'
      tEl.style.opacity = '1'
      dayEl.style.transform = 'translateX(0)'
      dayEl.style.opacity = '1'
    },
    onDone: () => setContentVisible(true),
  })

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
          position. `useSplashCollapse` reads this element's OWN measured
          (post-transform) rect via `onMeasured`, so the splash animation's
          landing spot picks up this same offset automatically — one
          source of truth, nothing to keep in sync by hand.
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
          <div ref={circleFillRef} className="absolute top-1/2 left-1/2 rounded-full" />
        </div>
      )}
    </div>
  )
}
