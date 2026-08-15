import { useNavigate } from 'react-router-dom'
import { GradientActionButton } from '../components/GradientActionButton'
import wordmarkDot from '../assets/OnboardingWordmarkDot.svg'
import noticeIcon from '../assets/OnboardingNotice.svg'
import connectIcon from '../assets/OnboardingConnect.svg'
import patternsIcon from '../assets/OnboardingPatterns.svg'

const FEATURES = [
  { icon: noticeIcon, title: 'Notice what matters', description: 'Set up to 3 intentions for the things that matter most to you today.' },
  { icon: connectIcon, title: 'Connect with your emotions', description: 'Check in with your mood and find practices that help.' },
  { icon: patternsIcon, title: 'Find your patterns', description: 'See what becomes a priority, and what helps or gets in the way.' },
] as const

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
 */
export function OnboardingScreen() {
  const navigate = useNavigate()

  // Review fix — routes into registration now, not straight into Check-in
  // home (registration is required before the app is usable). No store
  // write here anymore: the old `hasSeenOnboarding` flag this used to set
  // is gone, superseded by `isRegistered` (set by RegistrationScreen's own
  // submit), which is now the router's only gate — see App.tsx's
  // `RequireRegistration`.
  const finishOnboarding = () => navigate('/register')

  return (
    <div
      className="mx-auto flex h-screen w-full max-w-[393px] flex-col px-5 pt-16 pb-6"
      style={{ background: 'linear-gradient(225deg, #ffdcf5 0%, #fff5fb 100%)' }}
    >
      <div className="flex items-center justify-center">
        <span className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">t</span>
        <img src={wordmarkDot} alt="" className="h-5 w-[15px]" />
        <span className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">day</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10">
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

      <div className="flex flex-col gap-4">
        <GradientActionButton onClick={finishOnboarding}>Get started</GradientActionButton>
        <button type="button" onClick={finishOnboarding} className="focus-ring font-sans text-lg font-semibold text-[#e90555]">
          Sign in
        </button>
      </div>
    </div>
  )
}
