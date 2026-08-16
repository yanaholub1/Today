import { SignOut } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { useAuth } from '../lib/authStore'

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
 */
export function SettingsScreen() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return (
    <>
      <TaskFlowHeader title="Settings" exit="close" onExit={() => navigate('/checkin')} />
      <div className="flex flex-1 flex-col gap-2 px-5 pt-2">
        <button
          type="button"
          onClick={() => signOut()}
          className="focus-ring pressable flex items-center gap-3 rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left"
        >
          <SignOut size={20} className="text-ink/70" />
          <span className="font-sans text-base font-medium text-ink">Log out</span>
        </button>
      </div>
    </>
  )
}
