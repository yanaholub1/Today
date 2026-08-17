import { useEffect } from 'react'

// The app's one true resting `theme-color` — every screen except
// Onboarding (and the pre-mount splash phase, handled separately by
// index.html's own static default) is plain white. Hardcoded rather
// than read from index.html's own static default or captured from
// whatever the meta tag happened to hold at mount time — see this
// file's own doc comment below for why that used to be safe and no
// longer is.
const DEFAULT_THEME_COLOR = '#ffffff'

/**
 * Sets `<meta name="theme-color">`'s content to `color` for as long as
 * the calling component is mounted, resetting it to the app's true
 * default (white) whenever `color` is falsy and on unmount.
 *
 * Review fix: this used to CAPTURE whatever content was already on the
 * meta tag when the effect first ran, and restore exactly that captured
 * value on cleanup — safe only as long as index.html's own static
 * default was itself always white, since that's what every caller's
 * "previous" would resolve to by construction. Once that static default
 * became a pink splash color (a separate, deliberate fix for the pre-JS
 * flicker), the assumption broke: `AuthLoadingScreen` would capture the
 * pink static default as "previous" (and, worse, its `pink && '#ffdcf5'`
 * call skipped this hook ENTIRELY whenever `pink` was falsy, since a
 * falsy `color` used to bail out before touching the meta tag at all —
 * leaving theme-color stuck on the pink static default for that whole
 * signed-in fast path, indefinitely), then `OnboardingScreen` would
 * capture whatever `AuthLoadingScreen`'s cleanup had just restored
 * (often that same pink value) as ITS OWN "previous" — so every screen
 * reached after onboarding ended up restoring pink instead of the app's
 * actual white (reported on the Sign In screen, but the same mechanism
 * affects every post-onboarding screen). Explicitly resetting to a
 * hardcoded white — both when `color` is falsy and on unmount — removes
 * this whole class of bug: the meta tag's value can never drift away
 * from a value some earlier caller happened to see, because nothing is
 * ever "restored" from a snapshot anymore, only ever set to `color` or
 * reset to the one true default.
 */
export function useThemeColor(color: string | undefined | false): void {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    meta.setAttribute('content', color || DEFAULT_THEME_COLOR)
    return () => {
      meta.setAttribute('content', DEFAULT_THEME_COLOR)
    }
  }, [color])
}
