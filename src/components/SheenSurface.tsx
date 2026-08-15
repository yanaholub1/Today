import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * The five hues named in the design brief, plus `cool-mid` — a Stage 2
 * addition for the cool-selected ChoiceChip state, which has no equivalent
 * in the static Figma source. See ChoiceChip.tsx for how it was derived.
 *
 * `sphere-pale`/`sphere-selected` (Stage 4 correction) are a genuinely
 * separate hue pair for the intention flow's life-area pills — verified
 * against 109:2863 (unselected) and 134:3413 (selected), neither of which
 * matches any existing warm/cool value. See SpherePicker.tsx.
 *
 * `sphere-fixed` (Fix 24) is a THIRD, distinct sphere-pill treatment — a
 * fixed light pink (`#fae1e9`/`#eac3d0`/`#6d0e2d`), not `sphere-selected`'s
 * dark `#930845`/white. Verified against 178:8937/178:9032/178:9207 (the
 * new "Life areas" sheet's own selected pill, the area dropdown's selected
 * trigger, and a saved intention's recap chip) — the same recipe already
 * used inline for the evening reflection flow's dropdown pill/recap chip
 * (EveningReflectionFlow.tsx), tokenized here since it now has this many
 * call sites across two different flows.
 *
 * `pill-switch-active` (Review fix) is the Patterns "Intention"/"Mood"
 * pill subtab switcher's selected state — verified against 323:4609. Its
 * border and shadow are byte-identical to `warm-pale`'s own filter-scale
 * values (both use `--color-filter-active-border`/`sheen-filter-active`),
 * but its fill (`--color-pill-switch-active-bg`) and text (reusing
 * `--color-slider-label-active`, the same pink already used elsewhere) are
 * a genuinely different combination — see index.css's own doc comment on
 * `--color-pill-switch-active-bg` for the fill/warm-pale-alt distinction.
 */
export type SheenHue = 'warm-strong' | 'warm-mid' | 'warm-pale' | 'cool-pale' | 'cool-mid' | 'neutral' | 'sphere-pale' | 'sphere-selected' | 'sphere-fixed' | 'pill-switch-active'

/**
 * Each scale corresponds to a distinct shadow geometry actually observed in
 * Figma: hero cards and chips use the full 4-layer sheen (edge glow + top/
 * bottom insets); filter pills and the slider track use a flatter 2-layer
 * version (top/bottom insets only) because those layers were zeroed out.
 */
export type SheenScale = 'hero' | 'chip' | 'filter' | 'track'

interface Preset {
  bg: string
  border: string
  borderWidth: string
  shadow: string
  text: string
}

// Fill + border + shadow combinations pulled from get_design_context on
// nodes 109:4148 (hero cards) and 109:3408 (chips, filter row, slider).
// Same "hue" can map to a different literal fill at a different scale —
// e.g. warm-pale is #fcdaec at hero scale but #f8edf3 at chip scale — so
// the lookup is keyed by (scale, hue), not hue alone.
const PRESETS: Record<SheenScale, Partial<Record<SheenHue, Preset>>> = {
  hero: {
    'warm-strong': { bg: 'bg-warm', border: 'border-warm-border', borderWidth: 'border-2', shadow: 'sheen-warm', text: 'text-white' },
    'warm-pale': { bg: 'bg-warm-pale', border: 'border-warm-pale-border', borderWidth: 'border-2', shadow: 'sheen-pale', text: 'text-ink' },
  },
  chip: {
    'warm-mid': { bg: 'bg-warm-mid', border: 'border-warm-chip-border', borderWidth: 'border', shadow: 'sheen-chip-warm', text: 'text-white' },
    'warm-pale': { bg: 'bg-warm-pale-alt', border: 'border-warm-chip-border', borderWidth: 'border', shadow: 'sheen-chip-warm', text: 'text-ink' },
    'cool-mid': { bg: 'bg-cool-mid', border: 'border-cool-pale-border', borderWidth: 'border', shadow: 'sheen-chip-cool', text: 'text-white' },
    'cool-pale': { bg: 'bg-cool-pale', border: 'border-cool-pale-border', borderWidth: 'border', shadow: 'sheen-chip-cool', text: 'text-ink' },
  },
  filter: {
    'warm-pale': { bg: 'bg-warm-pale-alt', border: 'border-filter-active-border', borderWidth: 'border', shadow: 'sheen-filter-active', text: 'text-ink' },
    neutral: { bg: 'bg-offwhite', border: 'border-neutral-border', borderWidth: 'border', shadow: '', text: 'text-ink' },
    // Sphere pills reuse this scale's exact 2-layer shadow geometry
    // (109:2863's own shadow values are byte-identical to sheen-filter-active's)
    // — only the fill/border/text differ, which is exactly what this scale's
    // per-hue preset system already exists to express.
    'sphere-pale': { bg: 'bg-sphere-pale-bg', border: 'border-sphere-pale-border', borderWidth: 'border', shadow: 'sheen-filter-active', text: 'text-ink' },
    'sphere-selected': { bg: 'bg-sphere-selected-bg', border: 'border-sphere-selected-border', borderWidth: 'border', shadow: 'sheen-filter-active', text: 'text-white' },
    'sphere-fixed': { bg: 'bg-[#fae1e9]', border: 'border-[#eac3d0]', borderWidth: 'border', shadow: 'sheen-filter-active', text: 'text-[#6d0e2d]' },
    'pill-switch-active': { bg: 'bg-pill-switch-active-bg', border: 'border-filter-active-border', borderWidth: 'border', shadow: 'sheen-filter-active', text: 'text-slider-label-active' },
  },
  track: {
    'warm-pale': {
      bg: 'bg-[linear-gradient(180deg,var(--color-slider-from),var(--color-slider-to))]',
      border: 'border-slider-border',
      borderWidth: 'border',
      shadow: 'sheen-track',
      text: '',
    },
  },
}

type SheenSurfaceOwnProps<T extends ElementType> = {
  as?: T
  hue: SheenHue
  scale?: SheenScale
  children?: ReactNode
  className?: string
}

export type SheenSurfaceProps<T extends ElementType = 'div'> = SheenSurfaceOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SheenSurfaceOwnProps<T>>

/**
 * Shared wrapper — not a visible component in its own right. Applies the
 * fill, tinted border, and 4-layer inset sheen shadow for a given hue/scale
 * combination. Every other component in this library composes this instead
 * of writing its own box-shadow.
 */
export function SheenSurface<T extends ElementType = 'div'>({
  as,
  hue,
  scale = 'chip',
  className,
  children,
  ...rest
}: SheenSurfaceProps<T>) {
  const Component = (as ?? 'div') as ElementType
  const preset = PRESETS[scale][hue] ?? PRESETS.chip['warm-pale']!

  return (
    <Component
      className={cn(
        'relative',
        preset.shadow && 'sheen',
        preset.shadow,
        preset.bg,
        preset.borderWidth,
        preset.border,
        'border-solid',
        preset.text,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}
