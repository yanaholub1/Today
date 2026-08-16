import { useEffect } from 'react'

/**
 * Swaps `<meta name="theme-color">`'s content for as long as the calling
 * component is mounted, restoring whatever value was there before on
 * unmount. `color` is `undefined`/falsy to skip entirely (e.g. a screen
 * whose background depends on a runtime guess). Shared by every screen
 * with a non-default (non-white) top edge — see each caller for why that
 * screen's own color was chosen.
 */
export function useThemeColor(color: string | undefined | false): void {
  useEffect(() => {
    if (!color) return
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const previous = meta.getAttribute('content')
    meta.setAttribute('content', color)
    return () => {
      if (previous !== null) meta.setAttribute('content', previous)
    }
  }, [color])
}
