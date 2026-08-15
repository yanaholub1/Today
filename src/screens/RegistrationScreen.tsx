import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { GradientActionButton } from '../components/GradientActionButton'
import { useDayLogStore } from '../lib/dayLogStore'

/**
 * Registration screen (review fix — no Figma node exists for this yet,
 * flagged as inferred pending real design confirmation, same as Fix 28's
 * Practices tab and Fix 30's chooser sheet). Built entirely from patterns
 * already established elsewhere: Young Serif headline (`font-serif`, same
 * as every other screen title), Figtree body/label text, `TextInput`'s
 * existing pill-shaped field recipe (Fix 24 — reused as-is, just
 * overridden to `type="email"`), `GradientActionButton`'s existing
 * primary CTA recipe (same button OnboardingScreen already uses). Reuses
 * `TaskFlowHeader` for the back arrow even though this is a bare
 * top-level route, not one wrapped in `FlowLayout` — that header doesn't
 * depend on the layout itself, just renders a bar, so this is a real
 * reuse, not a lookalike.
 *
 * This is UI/mock-only, per this fix's own explicit scope: submitting
 * just calls the shared store's `register()` (sets `isRegistered = true`)
 * and routes into Check-in home. No real validation beyond a non-empty
 * check (disables the button, not a format check), no password field, no
 * backend call — Stage 6 (Supabase/magic-link auth) will need to replace
 * this submit handler's body with a real request, but shouldn't need to
 * touch the route guard itself (`RequireRegistration` in App.tsx), which
 * only cares about the one `isRegistered` boolean regardless of what sets
 * it.
 *
 * Onboarding's own "Get started"/"Sign in" both land here now instead of
 * routing straight into Check-in home (see OnboardingScreen.tsx) — this
 * screen doesn't distinguish between the two, since there's no real
 * sign-in flow to route "Sign in" to yet either (same open question
 * flagged in Fix 29's own summary).
 */
export function RegistrationScreen() {
  const navigate = useNavigate()
  const { register } = useDayLogStore()
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    register()
    navigate('/checkin')
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-[393px] flex-col bg-white">
      <TaskFlowHeader exit="back" onExit={() => navigate('/onboarding')} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-6 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-ink">Create your account</h1>
          <p className="font-sans text-base text-ink/70">Enter your email to get started with Today.</p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <label htmlFor="email" className="font-sans text-sm font-medium text-ink">
            Email
          </label>
          <TextInput
            id="email"
            type="email"
            required
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex-1" />
        <GradientActionButton type="submit" disabled={!email.trim()}>
          Continue
        </GradientActionButton>
      </form>
    </div>
  )
}
