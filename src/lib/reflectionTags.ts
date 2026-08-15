/**
 * Obstacle tags (shown when the reflection outcome is "not really") and
 * helper tags (shown when "yes") — a fixed, locked 1:1 mirrored list per
 * the brief. Modeled as pairs sharing one stable `id` per row, since the
 * underlying "what got in the way / what helped" axis is the same
 * regardless of which label is shown — `intentions.tag` on a saved
 * reflection stores one of these `id`s, not a display string, so a later
 * UI change to either wording doesn't invalidate already-saved data.
 */
export interface ReflectionTagPair {
  id: string
  obstacle: string
  helper: string
}

export const REFLECTION_TAGS: ReflectionTagPair[] = [
  { id: 'energy', obstacle: 'Low energy', helper: 'Had energy' },
  { id: 'plan', obstacle: 'No plan', helper: 'Had a plan' },
  { id: 'realisticPlan', obstacle: 'Unrealistic plan', helper: 'Realistic plan' },
  { id: 'changes', obstacle: 'Unexpected changes', helper: 'Adapted to changes' },
  { id: 'accountability', obstacle: 'No one checked in', helper: 'Accountability to someone' },
  { id: 'deadline', obstacle: 'No deadline', helper: 'Had a deadline' },
  { id: 'distractions', obstacle: 'Distractions', helper: 'Removed distractions' },
  { id: 'priority', obstacle: 'Not a priority', helper: 'Made it a priority' },
  { id: 'checkIn', obstacle: 'Forgot about it', helper: 'Checked in with myself' },
]

export function reflectionTagLabel(pair: ReflectionTagPair, glad: boolean): string {
  return glad ? pair.helper : pair.obstacle
}
