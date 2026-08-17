import { ArrowClockwise, SignOut } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { useAuth } from '../lib/authStore'
import { getDisplayName, setDisplayName } from '../lib/displayName'
import { getIntentionCutoffTime } from '../lib/intentionCutoff'

/**
 * Real content for what was a placeholder (Fix 19, node 117:5748) — no
 * Figma node for this screen's actual layout, so it reuses SettingsScreen's
 * own established "label + TextInput, no submit step" pattern rather than
 * inventing new field styling.
 *
 * Display name MOVED here from SettingsScreen (review fix) — Settings no
 * longer shows it. Still persists to `displayName.ts`'s local storage on
 * every keystroke (unchanged mechanism/UX from when it lived in Settings),
 * but now ALSO syncs to the real account, on blur only — not on every
 * keystroke like the local write. `updateUser()` is a real network call;
 * firing it per character would mean one Supabase request per keystroke
 * for no benefit (local storage is already the instant, correct value the
 * rest of the app reads), and out-of-order responses from a slow
 * connection could momentarily show a stale name. Blur is the natural
 * "done typing" signal here, same idea as any plain form field's own
 * validate-on-blur convention, just applied to a background sync instead.
 * A no-op for the common anonymous-session case (`syncDisplayNameToAccount`
 * itself checks this — see authStore.tsx's own doc comment).
 *
 * Review fix — SettingsScreen.tsx removed entirely and folded in here:
 * with just a cutoff-time field and a "replay onboarding" escape hatch,
 * there were too few settings items to justify a second destination
 * beside Profile (HomeHeader.tsx's own Settings icon is gone too). Both
 * moved verbatim — same fields, same handlers, same storage
 * (`intentionCutoff.ts` local + best-effort account sync via
 * `updateIntentionCutoffTime`, unchanged), just grouped under a
 * "Preferences" label beneath the name field instead of living on their
 * own screen. "Log out" is new to this screen (previously the last item
 * on Settings) — placed last, separated from Preferences by a divider and
 * extra top margin, and recolored `text-warm` (this app's existing
 * warm/pink token, already used for error/attention states elsewhere —
 * reused here, not invented) rather than the neutral ink "Replay
 * onboarding" keeps, so it reads as a distinct, deliberate action rather
 * than one more preference row.
 */
export function ProfileScreen() {
  const navigate = useNavigate()
  const { syncDisplayNameToAccount, updateIntentionCutoffTime, signOut } = useAuth()
  const [name, setName] = useState(() => getDisplayName() ?? '')
  const [cutoffTime, setCutoffTime] = useState(() => getIntentionCutoffTime() ?? '')

  const handleCutoffChange = (value: string) => {
    setCutoffTime(value)
    updateIntentionCutoffTime(value || null)
  }

  return (
    <>
      <TaskFlowHeader title="Profile" exit="close" onExit={() => navigate('/checkin')} />
      <div className="flex flex-1 flex-col px-5 pt-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="displayName" className="font-sans text-sm font-medium text-ink">
            Display name
          </label>
          <TextInput
            id="displayName"
            placeholder="Add your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setDisplayName(e.target.value)
            }}
            onBlur={(e) => syncDisplayNameToAccount(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <p className="font-sans text-sm font-medium text-ink">Preferences</p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="intentionCutoff" className="font-sans text-base font-medium text-ink">
                Daily intention cutoff
              </label>
              {cutoffTime && (
                <button type="button" onClick={() => handleCutoffChange('')} className="focus-ring pressable font-sans text-sm font-medium text-[#e90555]">
                  Clear
                </button>
              )}
            </div>
            <TextInput id="intentionCutoff" type="time" value={cutoffTime} onChange={(e) => handleCutoffChange(e.target.value)} />
            <p className="font-sans text-sm text-ink/60">After this time each day, setting a new intention turns off until tomorrow. Leave blank for no cutoff.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/onboarding', { state: { replay: true } })}
            className="focus-ring pressable flex items-center gap-3 rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left"
          >
            <ArrowClockwise size={20} className="text-ink/70" />
            <span className="font-sans text-base font-medium text-ink">Replay onboarding</span>
          </button>
        </div>

        <div className="flex-1" />
        <div className="mt-6 border-t border-solid border-neutral-border pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => signOut()}
            className="focus-ring pressable flex w-full items-center gap-3 rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left"
          >
            <SignOut size={20} className="text-warm" />
            <span className="font-sans text-base font-medium text-warm">Log out</span>
          </button>
        </div>
      </div>
    </>
  )
}
