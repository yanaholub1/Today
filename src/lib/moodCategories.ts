import { CloudLightning, LightningSlash, MoonStars, Sparkle } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

export type MoodCategoryId = 'off' | 'low' | 'high' | 'calm'

export interface MoodCategoryDef {
  id: MoodCategoryId
  label: string
  icon: Icon
  /** Selected-state fill, border, and box-shadow (the 4-layer sheen, or the 2-layer variant for `off`). Unselected state is always the same plain neutral, defined by the consumer. */
  fill: string
  border: string
  boxShadow: string
}

/**
 * The 4 mood/energy categories (LightningSlash="off", CloudLightning="low",
 * Sparkle="high", MoonStars="calm"), with their exact selected-state colors
 * — the single source of truth shared by SegmentedFilterPill (the compact
 * switcher) and MoodCategorySelector (the full card grid), so the two
 * surfaces can't visually diverge.
 *
 * Verified via get_design_context on 4 example nodes, one per category
 * shown selected: 109:3408/109:3424 (off — the id 109:3423 given for this
 * fix 404'd; 109:3424 is its immediate sibling in the same composition and
 * is what that URL almost certainly meant), 109:3522 (low), 111:5363
 * (high), 111:5442 (calm). `off` uses a different, simpler 2-layer shadow
 * than the other three (matches the `sheen-filter-active` CSS utility);
 * the other three use the same 4-layer structure with different bottom-
 * tint colors and slightly different blur values from ChoiceChip's own
 * sheen-chip-warm/cool recipes — distinct enough not to reuse those.
 */
export const MOOD_CATEGORIES: MoodCategoryDef[] = [
  {
    id: 'off',
    label: 'No energy',
    icon: LightningSlash,
    fill: '#f8edf3',
    border: '#e9cedd',
    boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 4px 4px rgba(255,255,255,0.35)',
  },
  {
    id: 'low',
    label: 'Low energy',
    icon: CloudLightning,
    fill: '#ecf3fd',
    border: '#e7eef8',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -2px 6px rgba(161,177,222,0.79), inset 0 16px 20px rgba(255,255,255,0.2)',
  },
  {
    id: 'high',
    label: 'High energy',
    icon: Sparkle,
    fill: '#f2fef1',
    border: '#cadec9',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -3px 6.4px rgba(102,146,99,0.45), inset 0 16px 16.4px rgba(255,255,255,0.2)',
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: MoonStars,
    fill: '#fef8ec',
    border: '#f4ebd7',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -3px 6.4px rgba(204,160,65,0.54), inset 0 16px 16.4px rgba(255,255,255,0.2)',
  },
]

/** Shared unselected/default look for both the switcher and the selector — confirmed identical across all 4 fetched nodes. */
export const MOOD_CATEGORY_DEFAULT = {
  fill: '#fbf8fa',
  border: '#ddd4da',
}

export type MoodQuadrantId = 'high-unpleasant' | 'high-pleasant' | 'low-unpleasant' | 'low-pleasant'

export interface MoodQuadrantDef {
  id: MoodQuadrantId
  /** Exact 2-line copy from the source, top line then bottom line. */
  lines: readonly [string, string]
  icon: Icon
  fill: string
  border: string
  textColor: string
  boxShadow: string
}

/**
 * The 2x2 energy/pleasantness mood quadrant grid used by
 * MoodCategorySelector — verified via get_design_context on node 109:3033,
 * which renders all 4 quadrants together, already selected/at rest (no
 * separate "unselected" example exists for this component: every card
 * shows its full color unconditionally, always).
 *
 * This is a DIFFERENT structure from `MOOD_CATEGORIES` above, deliberately
 * kept separate: MOOD_CATEGORIES is the linear intensity switcher's 4
 * items (off/low/high/calm, verified against 109:3408, 109:3522, 111:5363,
 * 111:5442), while this is a real 2x2 valence-arousal quadrant grid with
 * its own colors, its own copy, and even its own mapping of the same 4
 * icons to different meanings (e.g. LightningSlash here means "high
 * energy, unpleasant," not "no energy" as it does in the switcher). An
 * earlier pass wrongly assumed these two components should share one
 * color source before this node had actually been fetched — they don't.
 * SegmentedFilterPill must stay on MOOD_CATEGORIES unchanged.
 */
export const MOOD_QUADRANTS: MoodQuadrantDef[] = [
  {
    id: 'high-unpleasant',
    lines: ['High energy', 'Unpleasant'],
    icon: LightningSlash,
    fill: '#f8edf3',
    border: '#debed0',
    textColor: '#5d2d48',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -2px 6px rgba(162,23,99,0.3), inset 0 16px 20px rgba(255,255,255,0.2)',
  },
  {
    id: 'high-pleasant',
    lines: ['High energy', 'Pleasant'],
    icon: Sparkle,
    fill: '#f6fef6',
    border: '#cadec9',
    textColor: '#134110',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -3px 6.4px rgba(102,146,99,0.54), inset 0 16px 16.4px rgba(255,255,255,0.2)',
  },
  {
    id: 'low-unpleasant',
    lines: ['Low energy', 'Unpleasant'],
    icon: CloudLightning,
    fill: '#ecf3fd',
    border: '#e7eef8',
    textColor: '#184581',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -3px 6px rgba(114,134,190,0.79), inset 0 16px 20px rgba(255,255,255,0.2)',
  },
  {
    id: 'low-pleasant',
    lines: ['Low energy', 'Pleasant'],
    icon: MoonStars,
    fill: '#fef9ef',
    border: '#f8f4ec',
    textColor: '#614405',
    boxShadow:
      'inset -8px 0 20px rgba(255,255,255,0.32), inset 8px 0 20px rgba(255,255,255,0.32), inset 0 -3px 6.4px rgba(204,160,65,0.54), inset 0 16px 16.4px rgba(255,255,255,0.2)',
  },
]

/**
 * Maps each of the 4 mood-check-in quadrants (Stage 4b) to the closest of
 * the 4 summary-card mood categories (off/low/high/calm) — needed only
 * because CompletionSummaryCard's compact mood-log row (Fix 20) was built
 * around MOOD_CATEGORIES before the quadrant-based check-in flow existed.
 * Not Figma-verified — chosen by matching each icon's own visual read
 * rather than by label text: high-pleasant→'high' (Sparkle, energetic/
 * positive), low-pleasant→'calm' (MoonStars, matches "Calm" by name too),
 * high-unpleasant→'low' (CloudLightning's storm-cloud reads as turbulent/
 * negative, despite the "low energy" label), low-unpleasant→'off'
 * (LightningSlash, drained).
 */
export const QUADRANT_TO_MOOD_CATEGORY: Record<MoodQuadrantId, MoodCategoryId> = {
  'high-pleasant': 'high',
  'low-pleasant': 'calm',
  'high-unpleasant': 'low',
  'low-unpleasant': 'off',
}
