import type { RefObject } from 'react'
import { cn } from '../lib/cn'
import wordmarkDot from '../assets/OnboardingWordmarkDot.png'

export interface AppWordmarkProps {
  /** Forwarded to the dot `<img>` — `useSplashCollapse`'s `targetRef` measures/lands on this element directly. */
  dotRef: RefObject<HTMLImageElement | null>
  /** Plain opacity fade, no transform — see OnboardingScreen.tsx's own doc comment history for why the letters are never measured/animated themselves, only the dot (which `useSplashCollapse` moves independently). `duration-400` must stay in sync with whichever caller's own `revealMs` drives this. */
  visible: boolean
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
export function AppWordmark({ dotRef, visible }: AppWordmarkProps) {
  return (
    <div className={cn('flex items-center justify-center transition-opacity duration-400 ease-out', visible ? 'opacity-100' : 'opacity-0')}>
      <span className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">t</span>
      <img ref={dotRef} src={wordmarkDot} alt="" className="h-[15px] w-[15px] translate-y-[2px]" />
      <span className="font-serif text-[28px] tracking-[-0.56px] text-[#1c212c]">day</span>
    </div>
  )
}
