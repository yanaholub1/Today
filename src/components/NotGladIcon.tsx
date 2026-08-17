import { forwardRef } from 'react'
import type { IconProps } from '@phosphor-icons/react'

/**
 * "Not glad about how this went" outcome glyph — review fix, replacing
 * Phosphor's real `CircleHalfTilt` (a plain diagonally-split half-filled
 * circle), which was never actually the right icon here: verified against
 * Figma node 367:2465, whose OWN layer is confusingly still named
 * "CircleHalfTilt" (a stale name left over from an earlier pass) but whose
 * real path data is a circle containing a diagonal strike plus 3 ascending
 * bars, not a half-fill. Exported as a single 24x24 vector path, copied
 * byte-for-byte from that node's own SVG export — not redrawn by hand.
 *
 * Same props interface as a real Phosphor `Icon` (`IconProps`) and the same
 * size/color resolution `IconBase` (phosphor's own internal renderer) uses —
 * `size` sets width/height, `color` overrides the default `currentColor`
 * fill — so every existing call site (EveningReflectionFlow.tsx,
 * DayDetailScreen.tsx, PatternsScreen.tsx) swaps its import with no other
 * change: same size per call site, same color/style/className prop each
 * already passed. `weight`/`mirrored`/`alt` are accepted for interface
 * compatibility but unused — this glyph has only one visual, and no
 * existing caller passes anything but `weight="fill"`.
 */
export const NotGladIcon = forwardRef<SVGSVGElement, IconProps>(function NotGladIcon({ color, size, weight: _weight, mirrored: _mirrored, alt, ...rest }, ref) {
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill={color ?? 'currentColor'} {...rest}>
      {alt && <title>{alt}</title>}
      <path d="M19.1597 4.8375C17.5025 3.17923 15.3217 2.1469 12.9887 1.91642C10.6557 1.68594 8.31495 2.27156 6.36536 3.57351C4.41577 4.87546 2.97796 6.81315 2.29694 9.05641C1.61593 11.2997 1.73384 13.7097 2.6306 15.8757C3.52736 18.0418 5.14747 19.8298 7.21484 20.9352C9.28222 22.0406 11.6689 22.395 13.9683 21.9378C16.2676 21.4807 18.3373 20.2404 19.8247 18.4283C21.312 16.6161 22.125 14.3443 22.125 12C22.1249 9.31385 21.0584 6.73761 19.1597 4.8375ZM16.5 18.4687C16.0315 18.7962 15.5285 19.0713 15 19.2891V10.5938L16.5 9.09375V18.4687ZM6.43125 6.42938C7.77103 5.09169 9.54751 4.28091 11.4359 4.14526C13.3243 4.00961 15.1984 4.55816 16.7156 5.69062L5.6925 16.7184C4.55876 15.2009 4.00945 13.3257 4.14511 11.4363C4.28077 9.54683 5.09233 7.76942 6.43125 6.42938ZM9 16.5937V19.2834C8.38939 19.0323 7.81296 18.705 7.28437 18.3094L9 16.5937ZM11.25 19.8394V14.3437L12.75 12.8438V19.8412C12.2511 19.888 11.7488 19.8873 11.25 19.8394ZM18.75 16.0641V7.93594C19.4868 9.16352 19.8759 10.5683 19.8759 12C19.8759 13.4317 19.4868 14.8365 18.75 16.0641Z" />
    </svg>
  )
})
