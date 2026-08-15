import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { MorningIntentionFlow } from './intentionFlow/MorningIntentionFlow'
import { EveningReflectionFlow } from './intentionFlow/EveningReflectionFlow'
import { useDayLogStore } from '../lib/dayLogStore'
import { deriveIntentionState } from '../lib/intentionState'

/**
 * Gate for `/checkin/intention` (Stage 4) — decides morning vs. evening
 * flow from the SAME derived state driving the "Set intention" entry
 * point everywhere else (CheckInMenuSheet, the floating tab-bar button's
 * chooser — the app's only entry point into this flow since Fix 30
 * removed the old full-screen hero-card gate): `unset` → morning flow (nothing
 * logged yet, whatever time it is); `eveningUnreflected` → evening flow.
 * `setQuiet`/`reflected` aren't real entry states (the card that leads
 * here is either inert or disabled for both, per
 * INTENTION_STATE_CONFIG's `tappable`) — reachable only via a stale deep
 * link, so this just bounces back to the dashboard rather than rendering
 * anything.
 *
 * `state` is captured ONCE on mount (lazy `useState` initializer), not
 * recomputed on every render — Fix 24 bug fix: `MorningIntentionFlow` now
 * shows its own "Your intention is set" success step AFTER calling
 * `submitMorningIntentions`, before the user taps "Done" to actually
 * leave. Recomputing `state` reactively meant that submit call itself
 * (which changes `intentions`, the same store this gate reads) flipped
 * `state` away from `'unset'` mid-flow, so this component immediately
 * rendered `<Navigate to="/checkin" />` and yanked the success screen out
 * from under the user before they ever saw it. Freezing the decision at
 * mount time means this gate gets out of the way once, on entry, and
 * lets whichever flow it picked own the rest of its own navigation.
 */
export function IntentionFlowScreen() {
  const { intentions } = useDayLogStore()
  const [state] = useState(() => deriveIntentionState(intentions))

  if (state === 'unset') return <MorningIntentionFlow />
  if (state === 'eveningUnreflected') return <EveningReflectionFlow />
  return <Navigate to="/checkin" replace />
}
