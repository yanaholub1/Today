import { MOOD_QUADRANTS } from '../lib/moodCategories'
import type { MoodQuadrantId } from '../lib/moodCategories'

const QUADRANT_LOOKUP = Object.fromEntries(MOOD_QUADRANTS.map((q) => [q.id, q]))

export interface MoodQuadrantBadgeProps {
  /** `null` renders the flat gray "nothing logged" placeholder dot instead of a real quadrant. */
  quadrant: MoodQuadrantId | null
  size: number
  className?: string
}

/**
 * Small circular "duotone" mood badge — verified via get_design_context +
 * raw SVG diff on 323:4461/312:2980/323:2233: every mood icon on the Mood
 * Tracker card (14/18/20/22px, across all 3 view-states) is a pale-fill/
 * thin-border circle with the quadrant's own icon centered inside at a
 * saturated color, and both colors involved are BYTE-IDENTICAL to
 * `MOOD_QUADRANTS`' own `fill`/`textColor` (Fix 8/9/11) — reused directly
 * here, not re-derived or copied from the node's own (matching) hex
 * values. `quadrant: null` renders the flat gray "nothing logged that
 * day" placeholder (`#ebebea`/`#dad9d6`), also confirmed from 323:4461's
 * own Tuesday example. The inset shadow is a new, smaller 2-layer "mini
 * sheen" recipe (confirmed in the same raw SVGs) — distinct from the
 * app's existing `.sheen-filter-active` values, so kept as a local inline
 * style rather than force-fit into that token.
 */
export function MoodQuadrantBadge({ quadrant, size, className }: MoodQuadrantBadgeProps) {
  const shadow = 'inset 0 -1px 1px rgba(0,0,0,0.08), inset 0 2px 1px rgba(255,255,255,0.25)'

  if (!quadrant) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{ width: size, height: size, borderRadius: '9999px', backgroundColor: '#ebebea', border: '0.5px solid #dad9d6', display: 'inline-block', boxShadow: shadow }}
      />
    )
  }

  const def = QUADRANT_LOOKUP[quadrant]
  const Icon = def.icon
  const iconSize = Math.round(size * 0.6)

  return (
    <span
      title={def.lines.join(' ')}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        backgroundColor: def.fill,
        border: `0.5px solid ${def.border}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: shadow,
      }}
    >
      <Icon size={iconSize} weight="fill" color={def.textColor} />
    </span>
  )
}
