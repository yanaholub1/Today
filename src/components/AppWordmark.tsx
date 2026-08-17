import type { RefObject } from 'react'
import { cn } from '../lib/cn'
import wordmarkDot from '../assets/OnboardingWordmarkDot.png'

export interface AppWordmarkProps {
  /** Forwarded to the dot `<img>` — `useSplashCollapse`'s `targetRef` measures/lands on this element directly. */
  dotRef: RefObject<HTMLImageElement | null>
  /** Plain opacity fade, no transform — see OnboardingScreen.tsx's own doc comment history for why the letters are never measured/animated themselves, only the dot (which `useSplashCollapse` moves independently). `duration-400` must stay in sync with whichever caller's own `revealMs` drives this. */
  visible: boolean
  /** Continuous 1-2-3-bounce loop (`.wordmark-dot-pulse`, index.css) signaling ongoing work for as long as this screen stays mounted — ReturningUserLoadingScreen's own "still working" cue for a real, indeterminate-length async wait. Default off: OnboardingScreen reuses this same component for its static wordmark, which never sits waiting on anything. */
  pulsing?: boolean
}

/**
 * "t" + dot + "day" — extracted from OnboardingScreen.tsx (its original,
 * only consumer) once ReturningUserLoadingScreen needed the identical
 * markup. 45×45 source dot image (3x), displayed at 15×15 — a clean square
 * crop of just the circle. `translate-y-[2px]`: the circle's own visual
 * center sits slightly above the "t"/"day" letters' vertical center at
 * this font size — nudged down to align, without touching the letters'
 * own position.
 */
export function AppWordmark({ dotRef, visible, pulsing = false }: AppWordmarkProps) {
  return (
    <div className={cn('flex items-center justify-center transition-opacity duration-400 ease-out', visible ? 'opacity-100' : 'opacity-0')}>
      <span className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">t</span>
      <img ref={dotRef} src={wordmarkDot} alt="" className={cn('h-[15px] w-[15px] translate-y-[2px]', pulsing && 'wordmark-dot-pulse')} />
      <span className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">day</span>
    </div>
  )
}
