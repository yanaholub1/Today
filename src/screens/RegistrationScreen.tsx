import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeSimpleOpen } from '@phosphor-icons/react'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { GradientActionButton } from '../components/GradientActionButton'
import { FlowSuccessScreen } from '../components/FlowSuccessScreen'
import { useAuth } from '../lib/authStore'

/**
 * Magic-link sign-in (Stage 6 — replaces the old mock-registration version
 * of this screen, which just flipped an in-memory `isRegistered` flag).
 * Still built from the same established patterns as before: Young Serif
 * headline, Figtree body/label text, `TextInput`'s pill-shaped field
 * recipe, `GradientActionButton`'s primary CTA recipe, `TaskFlowHeader` for
 * the back arrow — no visual/layout change from the prior version, only
 * the copy (which now genuinely describes a magic link, not a password
 * account) and the submit handler's body.
 *
 * Two steps, not one: submitting sends the link (`signInWithMagicLink`)
 * and shows a "Check your email" confirmation — reusing `FlowSuccessScreen`
 * (the same icon/title/subtitle/button template every flow's own success
 * step already uses) rather than inventing new success-screen UI. There's
 * no Figma node for a "check your email" state (there wasn't one for the
 * original mock registration screen either), so the icon is a plain
 * Phosphor glyph in the app's `--color-warm` accent, not an exported
 * illustration asset.
 *
 * This step does NOT grant access on its own — unlike the old mock flow,
 * there's no local `register()` call here. The user only actually signs
 * in once they open the email and tap the link on this device; `authStore`'s
 * `onAuthStateChange` picks that up automatically and `RedirectIfRegistered`/
 * `RequireRegistration` (App.tsx) route them into `/checkin` from wherever
 * the link lands them — this screen doesn't need to know when that happens.
 *
 * Onboarding's own "Get started"/"Sign in" both land here now (see
 * OnboardingScreen.tsx) — magic link makes "sign up" and "sign in" the same
 * flow, so there's still nothing to distinguish between the two.
 */
export function RegistrationScreen() {
  const navigate = useNavigate()
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    const { error } = await signInWithMagicLink(email.trim())
    setSending(false)
    if (error) {
      setError(error)
      return
    }
    setLinkSent(true)
  }

  if (linkSent) {
    return (
      <div className="mx-auto flex h-screen w-full max-w-[393px] flex-col bg-white">
        <FlowSuccessScreen
          icon={<EnvelopeSimpleOpen size={108} weight="duotone" className="text-warm" />}
          title="Check your email"
          subtitle={`We sent a magic link to ${email.trim()}. Open it on this device to sign in.`}
          onClose={() => setLinkSent(false)}
          onDone={() => setLinkSent(false)}
          doneLabel="Use a different email"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-[393px] flex-col bg-white">
      <TaskFlowHeader exit="back" onExit={() => navigate('/onboarding')} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-6 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-ink">Sign in to Today</h1>
          <p className="font-sans text-base text-ink/70">We'll email you a magic link — no password needed.</p>
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
          {error && <p className="font-sans text-sm text-warm">{error}</p>}
        </div>

        <div className="flex-1" />
        <GradientActionButton type="submit" disabled={!email.trim() || sending}>
          {sending ? 'Sending…' : 'Send magic link'}
        </GradientActionButton>
      </form>
    </div>
  )
}
