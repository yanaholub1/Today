import { useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppWordmark } from '../components/AppWordmark'
import { useSplashCollapse } from '../lib/useSplashCollapse'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { ONBOARDING_SPLASH_GRADIENT } from '../lib/splashGradients'
import { claimFirstLoadSplash, peekFirstLoadSplashAvailable } from '../lib/firstLoadSplash'

const REVEAL_MS = 400 // matches OnboardingScreen's own SPLASH_LETTERS_MS, for a consistent feel between the two splashes

/**
 * Loading screen for RETURNING users (device already has `today:onboardingComplete`
 * set — reached only via `RootRoute`, see App.tsx's own doc comment there).
 * Reuses OnboardingScreen's own giant-circle-collapses-onto-the-wordmark
 * sequence wholesale (same `useSplashCollapse` call, same `AppWordmark`,
 * same gradient, same just-tuned collapse easing/duration — inherited
 * automatically since neither caller overrides `holdMs`/`collapseMs`) minus
 * the onboarding-only content (headline, feature list, CTAs) — just the
 * wordmark, centered, matching Figma node 363:10659's own composition.
 *
 * Shares `firstLoadSplash.ts`'s one-shot session flag with BottomNav's own
 * check-in-FAB splash — this screen becomes the first claimant on the
 * returning-user path (peeked here, claimed unconditionally on mount,
 * mirroring BottomNav's own claim timing exactly), so BottomNav doesn't
 * ALSO independently replay its own splash the moment it mounts a beat
 * later — no changes needed to BottomNav.tsx itself.
 *
 * `skip` covers the two cases with nothing to animate: a mid-session
 * revisit to `/` (flag already claimed by an earlier visit this session)
 * and `prefers-reduced-motion: reduce` — both resolve synchronously at
 * first render (same lazy-`useState` pattern `peekFirstLoadSplashAvailable`/
 * `usePrefersReducedMotion` already use elsewhere), so the early
 * `<Navigate>` return below is a same-render redirect, not a post-mount
 * flash — mirroring how every other route guard in App.tsx (`RootRoute`,
 * `RequireOnboarded`, `RedirectIfOnboarded`) already redirects
 * declaratively rather than imperatively. `replace: true` there and on
 * `onDone`'s own navigate (unlike OnboardingScreen's plain `navigate` in
 * `handleGetStarted`) — this is a transient, once-per-session screen, not
 * something a back-button press should be able to land back on and replay.
 *
 * Review fix — `onDone` (optional) lets SignUpScreen.tsx/SignInScreen.tsx
 * reuse this exact screen (same markup, same animation, same timing —
 * nothing below changes for either caller) while a real registration/
 * sign-in submission is in flight, instead of building a second loading
 * screen. Two things change ONLY when a caller passes this:
 * - Navigation is THEIRS, not this screen's own hardcoded `/checkin`:
 *   this component has no way to know whether a submission it didn't
 *   make actually succeeded, so it defers entirely to the caller —
 *   who keeps rendering this screen for exactly as long as the real
 *   result is still pending, and stops (unmounting it) once that
 *   result is known, on success OR failure. A caller passes a no-op
 *   here for that reason: the interesting moment isn't "this screen's
 *   own animation finished," it's "the real network call resolved,"
 *   which the caller already tracks separately.
 * - The once-per-session shortcut (`firstLoadSplash.ts`) is skipped:
 *   that flag exists because THIS route's own "work" (session restore +
 *   an initial data fetch) is either already done or fast enough not to
 *   matter on a mid-session revisit — replaying the animation there
 *   would just be wasted time in front of work that's already finished.
 *   A real pending submission has no such guarantee; skipping the wait
 *   would mean navigating (or rather, telling the caller "done") before
 *   knowing whether the request even succeeded. `skip` can still apply
 *   for `prefers-reduced-motion` even when reused this way — that's an
 *   orthogonal, always-relevant accessibility concern, not the
 *   once-per-session one.
 */
export interface ReturningUserLoadingScreenProps {
  onDone?: () => void
}

export function ReturningUserLoadingScreen({ onDone }: ReturningUserLoadingScreenProps = {}) {
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()
  const isReuse = Boolean(onDone)
  const [shouldPlay] = useState(() => isReuse || peekFirstLoadSplashAvailable())
  const skip = !shouldPlay || reducedMotion

  const [wordmarkVisible, setWordmarkVisible] = useState(skip)
  const dotRef = useRef<HTMLImageElement>(null)

  // `theme-color` is no longer this screen's own concern — review fix,
  // see App.tsx's own `ThemeColorByRoute` doc comment: a single
  // route-driven controller now owns pink-vs-white for the whole app,
  // which is exactly what this screen's own addition originally exposed
  // as broken (a splash-like screen that ISN'T `OnboardingScreen` never
  // ran `OnboardingScreen`'s own reset-on-unmount logic).

  useLayoutEffect(() => {
    if (!isReuse) claimFirstLoadSplash()
  }, [isReuse])

  const { circleRef, circleFillRef, showSplashCircle } = useSplashCollapse({
    active: !skip,
    targetRef: dotRef,
    gradient: ONBOARDING_SPLASH_GRADIENT,
    centerYOffset: -27, // same offset OnboardingScreen's own giant circle uses — keeps the two splashes' opening beat visually consistent
    revealMs: REVEAL_MS,
    onReveal: () => setWordmarkVisible(true),
    onDone: onDone ?? (() => navigate('/checkin', { replace: true })),
  })

  if (skip && !isReuse) return <Navigate to="/checkin" replace />

  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-[393px] items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(225deg, #ffdcf5 0%, #fff5fb 100%)' }}
    >
      <AppWordmark dotRef={dotRef} visible={wordmarkVisible} pulsing />

      {showSplashCircle && (
        <div ref={circleRef} aria-hidden="true" className="pointer-events-none fixed z-50">
          <div ref={circleFillRef} className="absolute top-1/2 left-1/2 rounded-full" />
        </div>
      )}
    </div>
  )
}
