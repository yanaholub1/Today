import { ArrowClockwise, SignOut } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { useAuth } from '../lib/authStore'
import { getDisplayName, setDisplayName } from '../lib/displayName'

/**
 * Stage 6 — logout, the one entry this screen's own placeholder comment
 * always flagged as coming "in a later stage." Cutoff time (the other
 * item that comment named) is still out of scope — no `profiles` table
 * exists yet to store it (see supabase/schema.sql's own doc comment).
 *
 * No Figma node for this row — built from patterns already established
 * elsewhere (`rounded-card`/`border-neutral-border`/`bg-offwhite`, the
 * same plain list-row treatment MoodFlowScreen's own emotion-search
 * results use) rather than inventing new list-row styling, since this
 * screen had nothing of its own to match against.
 *
 * Fire-and-forget, like every other store write in this app — no local
 * navigation on click. Once `signOut()`'s `onAuthStateChange` event
 * flips `useAuth()`'s status to 'signedOut', `App.tsx`'s
 * `RequireRegistration` redirects to `/onboarding` on its own; this
 * screen doesn't need to know when that happens.
 *
 * Review fix — display name + "Replay onboarding" added, same "no Figma
 * node, reuse established patterns" approach as the row above. Display
 * name reuses SignInScreen's own label+TextInput pattern and is saved to
 * `displayName.ts` (same localStorage mechanism as the onboarding flag)
 * on every change — optional everywhere, so there's no submit step or
 * validation gating it, just persist-as-you-type. "Replay onboarding"
 * navigates to `/onboarding` with `{ state: { replay: true } }`, the
 * signal `App.tsx`'s `RedirectIfOnboarded` checks to allow this one
 * intentional visit through without touching the underlying
 * `today:onboardingComplete` flag — the next normal cold start still
 * reads that flag and goes straight to `/checkin`.
 */
export function SettingsScreen() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [name, setName] = useState(() => getDisplayName() ?? '')

  const handleNameChange = (value: string) => {
    setName(value)
    setDisplayName(value)
  }

  return (
    <>
      <TaskFlowHeader title="Settings" exit="close" onExit={() => navigate('/checkin')} />
      <div className="flex flex-1 flex-col gap-6 px-5 pt-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="displayName" className="font-sans text-sm font-medium text-ink">
            Display name
          </label>
          <TextInput
            id="displayName"
            placeholder="Add your name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding', { state: { replay: true } })}
            className="focus-ring pressable flex items-center gap-3 rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left"
          >
            <ArrowClockwise size={20} className="text-ink/70" />
            <span className="font-sans text-base font-medium text-ink">Replay onboarding</span>
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="focus-ring pressable flex items-center gap-3 rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left"
          >
            <SignOut size={20} className="text-ink/70" />
            <span className="font-sans text-base font-medium text-ink">Log out</span>
          </button>
        </div>
      </div>
    </>
  )
}
