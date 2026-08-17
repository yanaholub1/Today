import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GradientActionButton } from '../components/GradientActionButton'
import { AppWordmark } from '../components/AppWordmark'
import { cn } from '../lib/cn'
import { useSplashCollapse } from '../lib/useSplashCollapse'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { ONBOARDING_SPLASH_GRADIENT } from '../lib/splashGradients'
import { useAuth } from '../lib/authStore'
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
// value: how long the "t"/"day" letters take to fade in once the circle's
// bounce settles — handed to the hook as `revealMs` so the dot's own
// fade-in (which the hook now drives on the same clock, see its own doc
// comment) lands in lockstep with these letters, and so the hook's final
// overlay-unmount lands exactly when this finishes, not before or after.
const SPLASH_LETTERS_MS = 400

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
 * Review fix — "Get started" no longer drops the user straight into the
 * app anonymously: a logged-out visitor here could be genuinely new, OR a
 * previously-registered user who just logged out — there's no way to tell
 * those apart, so silently letting either one browse anonymously meant a
 * returning user could easily end up on a SECOND, unrelated anonymous
 * account instead of signing back into their real one. "Get started" now
 * routes to `/sign-up` (`SignUpScreen.tsx`) — the one general "create an
 * account or continue into an existing one" form (name + email +
 * password; upgrades the current anonymous session in place for a
 * genuinely new user, or transparently signs into the existing account if
 * that email's already registered — see that screen's own doc comment).
 * That fallback is exactly what makes routing BOTH cases through the same
 * button safe, without needing to ask up front which one this is.
 * `markOnboardingComplete()` is no longer called here either (review
 * fix, was called immediately on tap, before any real account existed) —
 * `authStore.tsx`'s `syncSession` already calls it the moment a REAL
 * (non-anonymous) session actually exists, which is the correct trigger
 * now that this button no longer means "start browsing anonymously": a
 * visitor who backs out of the form without finishing still sees
 * Onboarding again next time, rather than being silently treated as
 * done.
 *
 * "Sign in" now genuinely routes to `/sign-in` (`SignInScreen.tsx`, plain
 * email + password login) — review fix, was routed to `/sign-up`
 * (mislabeled, a leftover from when "Get started" itself was the
 * anonymous-only path and this button was the app's only real-auth entry
 * point). With "Get started" now owning `/sign-up`, "Sign in" is free to
 * mean what its label says.
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
 * mechanics).
 *
 * Review fix: "t"/"day" used to be pulled in to overlap the dot's own
 * measured center (opacity 0) at the start, then slid back out to their
 * natural position while fading in once the circle landed — a deliberate
 * "letters slide out from within the circle" effect, but one that made
 * the WHOLE wordmark's final position depend on measuring the dot
 * accurately at the exact moment the sequence started. In practice that
 * measurement could land a few px off (this app's own webfonts use
 * `font-display: swap`, which can reflow "t"/"day"'s true width shortly
 * after this effect's own first run), and because the letters were
 * ACTIVELY animated toward a point derived from that same measurement,
 * any error was doubly visible — both the dot's landing spot AND the
 * letters' own slide-back target would be off together.
 *
 * Now: "t"/"day" simply render in their real, natural flex-laid-out
 * position from the start (never measured, never transformed) —
 * `wordmarkVisible` below just fades them in, plain opacity, no motion of
 * their own. The dot's own landing math still depends on measuring ITS
 * rect (unavoidable — that's what the circle collapses onto), but a small
 * error there now only ever means the dot lands a hair off mathematically
 * perfect center in the letters' gap, never a visible mismatch between
 * where letters slid FROM and where the dot actually ends up. `onReveal`
 * (fired once the hook's bounce settles) flips `wordmarkVisible` true —
 * `useSplashCollapse` cross-fades the real dot in on that SAME clock (see
 * that hook's own doc comment), so dot and letters fade in together as
 * one wordmark, not as two separately-timed pieces. `onDone` (fired once
 * that fade has had `SPLASH_LETTERS_MS` to finish) reveals the rest of
 * the screen's content (`contentVisible`, its own separate `duration-300`
 * fade below).
 *
 * `prefers-reduced-motion: reduce` skips the whole sequence (`active:
 * !reducedMotion` below) — the overlay never mounts, `onReveal`/`onDone`
 * never fire, and the screen's real content (including the wordmark,
 * already `wordmarkVisible` from the start in this case) is visible
 * immediately.
 */
export function OnboardingScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, isAnonymous } = useAuth()
  const reducedMotion = usePrefersReducedMotion()

  // Settings' "Replay onboarding" reaches this same route with `{ state:
  // { replay: true } }` (see RedirectIfOnboarded, App.tsx) — the only way
  // to land here with a REAL account already active, since every other
  // path here requires `hasCompletedOnboarding()` to be false, which
  // (now that `handleGetStarted` below no longer sets it) only happens
  // before a real account exists. Neither CTA makes sense for someone
  // already logged in — "Get started"/"Sign in" would just re-run
  // registration/login on an account that's already signed in — so both
  // are hidden for this one specific combination, not for a replay alone
  // (a stale localStorage edge case could theoretically still reach here
  // anonymous) and not for a real account alone (no other path exists).
  const alreadyLoggedIn = status === 'signedIn' && !isAnonymous
  const isReplay = (location.state as { replay?: boolean } | null)?.replay === true
  const hideCtas = isReplay && alreadyLoggedIn

  const [contentVisible, setContentVisible] = useState(reducedMotion)
  const [wordmarkVisible, setWordmarkVisible] = useState(reducedMotion)

  const dotRef = useRef<HTMLImageElement>(null)

  // `theme-color` (status-bar/toolbar chrome color) is no longer this
  // screen's own concern — review fix, see `App.tsx`'s own
  // `ThemeColorByRoute` doc comment for why that moved to a single
  // route-driven controller instead of each pink-needing screen managing
  // it (and resetting it) itself.

  const { circleRef, circleFillRef, showSplashCircle } = useSplashCollapse({
    active: !reducedMotion,
    targetRef: dotRef,
    gradient: ONBOARDING_SPLASH_GRADIENT,
    centerYOffset: -27, // node 342:5736's giant circle sits 27px above true center — see useSplashCollapse's own doc comment
    revealMs: SPLASH_LETTERS_MS,
    onReveal: () => setWordmarkVisible(true),
    onDone: () => setContentVisible(true),
  })

  const handleGetStarted = () => navigate('/sign-up')
  const handleSignIn = () => navigate('/sign-in')

  // Container's `pb-[max(24px,env(safe-area-inset-bottom))]` below (review
  // fix): the old flat `pb-6` (24px) predates `viewport-fit=cover` going
  // global — this screen's own "Get started" CTA is the true
  // bottom-of-screen content, now exposed to the same home-indicator gap
  // that flag opened up everywhere else. `max()` keeps the original 24px
  // as the floor on non-notched devices, same pattern as the top padding
  // just above it.
  //
  // Review fix — `h-dvh`, not `h-screen` (`100vh`): on iOS Safari `100vh`
  // is fixed to the LARGEST possible viewport (toolbar fully collapsed),
  // even while the toolbar is currently showing and less is genuinely
  // visible — so this container used to render taller than what was
  // actually on screen, pushing the bottom CTA behind the toolbar until the
  // page itself was scrolled (which is what collapses the toolbar).
  // `100dvh` tracks the CURRENTLY visible viewport instead, so the
  // container is never taller than what's really on screen and this
  // single static view never needs a scroll to reach it. See the two
  // `gap-[clamp(...)]` values below for the OTHER, independent half of
  // this fix — confirmed via direct measurement that content can also
  // genuinely overflow a short-enough real viewport even with the
  // correct height unit, not just APPEAR to via the `vh` mismatch above.
  //
  // Review fix — top padding (`pt-[clamp(...)]` below) now compresses
  // FIRST on a short viewport, not a flat, never-shrinking
  // `max(4rem, safe-area+1rem)` floor: with the two content `gap-[clamp(...)]`
  // values below as the only compressible space, a real in-browser
  // (toolbar-visible) viewport was found to still crowd content into the
  // CTA even though this top margin was sitting at its full, uncompressed
  // 64px the whole time — dead space the compression logic couldn't reach.
  // Review fix #2 — the compression band below was originally 900px→800px
  // (entirely above the content gaps' own 800px→560px band, so the two
  // would never overlap at all) — reverted after direct measurement showed
  // that band swallows ordinary, currently-uncompressed STANDALONE heights
  // too (e.g. 812px, the iPhone mini's real home-screen height), visibly
  // shrinking this margin there even though standalone was already correct
  // and must stay untouched. Now 800px→700px instead — the SAME 800px
  // onset the content gaps already used before this fix (so nothing above
  // 800px changes, standalone included), but a steeper slope (reaches its
  // own 32px floor by 700px, 3x faster than the content gaps' own decline
  // over their wider 800–560px range) — so in the immediate sub-800 zone
  // this margin absorbs most of the initial squeeze, and only once it
  // bottoms out at 700px do the content gaps take over the rest of the
  // compression alone, unchanged from before this fix. (A touch more/less
  // on a notched device — the safe-area floor drops from +1rem to +0.5rem
  // in step, never below what the notch actually needs.)
  return (
    <div
      className="relative mx-auto flex h-dvh w-full sm:max-w-[393px] flex-col overflow-hidden px-5 pt-[clamp(max(2rem,calc(env(safe-area-inset-top)+0.5rem)),32dvh_-_192px,max(4rem,calc(env(safe-area-inset-top)+1rem)))] pb-[max(24px,env(safe-area-inset-bottom))]"
      style={{ background: 'linear-gradient(225deg, #ffdcf5 0%, #fff5fb 100%)' }}
    >
      {/*
        `wordmarkVisible` fades "t"/"day" in, plain opacity, no transform
        — see this file's own doc comment above for why they're never
        measured or moved anymore. `duration-400 ease-out` (AppWordmark's
        own) must match `SPLASH_LETTERS_MS`/the curve `useSplashCollapse`
        uses for the dot's own fade (that hook's own doc comment) — that's
        what makes dot and letters read as one wordmark fading in together
        rather than two separately-timed pieces. `useSplashCollapse`
        measures the dot `<img>` directly (it's the `targetRef`, forwarded
        via `dotRef`), so the splash animation's landing spot picks up
        AppWordmark's own layout automatically — one source of truth,
        nothing to keep in sync by hand.
      */}
      <AppWordmark dotRef={dotRef} visible={wordmarkVisible} />

      {/*
        Both gaps below are `clamp(MIN, slope·1dvh + offset, MAX)`, not a
        fixed `gap-10`/`gap-8` (review fix, companion to the `h-dvh` fix
        above): this section has no `min-height:0`, so on a short enough
        real viewport its own intrinsic content height simply won't
        shrink to fit `flex-1`'s available space — it overflows instead,
        `h-dvh` alone can't prevent that (confirmed via direct
        measurement, not assumed: at a 600px-tall viewport, the bottom CTA
        ran 30px past the bottom edge even with a correctly-sized container).
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

        Review fix — `dvh`, not `vh`, in both formulas below (was `10vh`/
        `8vh`): the container's own height went from `vh` to `dvh` above,
        but these two gaps still measured "how short is the viewport" off
        the OLD, toolbar-collapsed-assuming unit, so the two halves of this
        same fix had fallen out of sync. In-browser, with Safari's toolbar
        actually showing, `vh` overstates the real available height, so the
        clamp's middle term computed as if there were more room than there
        really was and eased off compressing too early — content sat closer
        to the CTA than the layout intended. Standalone (added-to-home-
        screen) never showed this: no toolbar to hide/show means `vh` and
        `dvh` are numerically identical there, so this bug could only ever
        surface in-browser, matching exactly where it was reported.
      */}
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-[clamp(1rem,10dvh_-_40px,2.5rem)] transition-opacity duration-300', contentVisible ? 'opacity-100' : 'opacity-0')}>
        <h1 className="w-full text-center font-serif text-[28px] leading-normal tracking-[-0.56px] text-ink">Step out of autopilot. Gently.</h1>

        <div className="flex w-full flex-col gap-[clamp(0.75rem,8dvh_-_32px,2rem)]">
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

      {!hideCtas && (
        <div className={cn('flex flex-col gap-4 transition-opacity duration-300', contentVisible ? 'opacity-100' : 'opacity-0')}>
          <GradientActionButton onClick={handleGetStarted}>Get started</GradientActionButton>
          <button type="button" onClick={handleSignIn} className="focus-ring pressable font-sans text-lg font-semibold text-[#e90555]">
            Sign in
          </button>
        </div>
      )}

      {showSplashCircle && (
        <div ref={circleRef} aria-hidden="true" className="pointer-events-none fixed z-50">
          <div ref={circleFillRef} className="absolute top-1/2 left-1/2 rounded-full" />
        </div>
      )}
    </div>
  )
}
