import { Sun, Moon, CheckCircle } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { HeroActionCardVariant } from '../components/HeroActionCard'
import type { IntentionRecord } from './dayLogStore'
import { isEvening } from './greeting'

/**
 * The Intention card's 4 states. Only `unset` exists in the static Figma
 * file (node 109:4148, the saturated "Set intention" card) — `setQuiet`,
 * `eveningUnreflected`, and `reflected` are new visual states in the same
 * language, not extracted, per the brief.
 *
 * Real state (Stage 4) is `deriveIntentionState` below, computed from the
 * shared day-log store's intentions + the real clock (`isEvening`, ./greeting).
 */
export type IntentionState = 'unset' | 'setQuiet' | 'eveningUnreflected' | 'reflected'

/**
 * Derives which of the 4 states applies right now: no intentions today →
 * `unset`; intentions exist but it isn't evening yet → `setQuiet` (a quiet
 * confirmation, not a live entry point — reflection can't start before
 * the evening cutoff); evening arrived and at least one intention still
 * has no `reflectedAt` → `eveningUnreflected`; every intention reflected →
 * `reflected`. `now` is injectable for testability, defaulting to the
 * real clock.
 */
export function deriveIntentionState(intentions: IntentionRecord[], now: Date = new Date()): IntentionState {
  if (intentions.length === 0) return 'unset'
  if (!isEvening(now)) return 'setQuiet'
  const allReflected = intentions.every((intention) => intention.reflectedAt !== null)
  return allReflected ? 'reflected' : 'eveningUnreflected'
}

export interface IntentionStateConfig {
  variant: HeroActionCardVariant
  label: string
  icon: Icon
  iconWeight: 'regular' | 'fill'
  /** Whether tapping the card should navigate into the flow. `setQuiet` is a passive confirmation, not a live entry point; `reflected` is fully done — HeroActionCard's own `disabled` prop covers that one instead. */
  tappable: boolean
  disabled: boolean
}

export const INTENTION_STATE_CONFIG: Record<IntentionState, IntentionStateConfig> = {
  unset: {
    variant: 'primary',
    label: 'Set intention',
    icon: Sun,
    iconWeight: 'fill',
    tappable: true,
    disabled: false,
  },
  setQuiet: {
    variant: 'secondary',
    label: 'Set for today',
    icon: Sun,
    iconWeight: 'fill',
    tappable: false,
    disabled: false,
  },
  eveningUnreflected: {
    variant: 'primary',
    label: 'Reflect on your day',
    icon: Moon,
    iconWeight: 'fill',
    tappable: true,
    disabled: false,
  },
  reflected: {
    variant: 'secondary',
    label: 'All done for today',
    icon: CheckCircle,
    iconWeight: 'fill',
    tappable: false,
    disabled: true,
  },
}
