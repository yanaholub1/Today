import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeSimpleOpen } from '@phosphor-icons/react'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { GradientActionButton } from '../components/GradientActionButton'
import { FlowSuccessScreen } from '../components/FlowSuccessScreen'
import { useAuth } from '../lib/authStore'

// Matches Supabase's own default minimum — checked client-side so the
// obvious case doesn't need a round-trip, with the server's own error
// (surfaced via `error` below) as the fallback for anything this simple
// check doesn't catch (e.g. leaked-password protection, if ever enabled).
const MIN_PASSWORD_LENGTH = 6

/**
 * Sign-up (email + password + confirm password) — review fix: replaces
 * the old magic-link RegistrationScreen, split from SignInScreen.tsx now
 * that Supabase's own `signUp()`/`signInWithPassword()` genuinely need
 * separate handling (unlike OTP, where "sign up" and "sign in" were the
 * same request). OnboardingScreen's "Get started" routes here; "Sign in"
 * routes to SignInScreen.tsx instead.
 *
 * Three non-error outcomes from `signUp()` (see authStore.tsx's own
 * `SignUpResult` doc comment for the full reasoning):
 * - already registered → inline message pointing at Sign In, no email
 *   sent. This is a genuine SUCCESS response from Supabase (deliberate
 *   anti-enumeration behavior — a real error here would let an attacker
 *   probe which emails have accounts), so it's checked for explicitly
 *   rather than caught in the `error` branch below.
 * - needs email confirmation → reuses `FlowSuccessScreen`'s "Check your
 *   email" template, same as the old magic-link flow used for the same
 *   UI. This is a DEFENSIVE fallback, not the expected path: the
 *   product decision for this app is "Confirm email" OFF (a Supabase
 *   dashboard setting, outside what this app's own code controls) — if
 *   this branch is ever actually reached, that setting is still on and
 *   needs to be flipped off in the dashboard for sign-up to work the
 *   way it's designed to here.
 * - signed in immediately (the expected/designed-for path) → nothing
 *   further to do here; `useAuth()`'s `status` flips to `'signedIn'` on
 *   its own via Supabase's own `onAuthStateChange`, and App.tsx's route
 *   guards redirect into the app — same mechanism every other sign-in
 *   path in this app already relies on.
 *
 * "Confirm password" only ever exists client-side — Supabase's own
 * `signUp()` has no equivalent, so mismatch checking has to happen here
 * before the request is even sent.
 */
export function SignUpScreen() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const passwordsMatch = password === confirmPassword
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const canSubmit = Boolean(email.trim()) && Boolean(password) && Boolean(confirmPassword) && passwordsMatch && !passwordTooShort && !submitting

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) {
      setConfirmTouched(true)
      return
    }
    setSubmitting(true)
    setError(null)
    setAlreadyRegistered(false)
    const result = await signUp(email.trim(), password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.alreadyRegistered) {
      setAlreadyRegistered(true)
      return
    }
    if (result.needsEmailConfirmation) {
      setConfirmationSent(true)
    }
    // Neither flag set: signed in — App.tsx's own route guards take it from here.
  }

  // `h-dvh` (not `h-screen`) on both this branch's container and the main
  // return's below, same home-indicator-clipping fix the old
  // RegistrationScreen needed — see SignInScreen.tsx's own comment for
  // the full reasoning, unchanged here.
  if (confirmationSent) {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-[393px] flex-col bg-white">
        <FlowSuccessScreen
          icon={<EnvelopeSimpleOpen size={108} weight="duotone" className="text-warm" />}
          title="Check your email"
          subtitle={`We sent a confirmation link to ${email.trim()}. Open it on this device to finish creating your account.`}
          onClose={() => setConfirmationSent(false)}
          onDone={() => setConfirmationSent(false)}
          doneLabel="Use a different email"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[393px] flex-col bg-white">
      <TaskFlowHeader exit="back" onExit={() => navigate('/onboarding')} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-ink">Create your account</h1>
          <p className="font-sans text-base text-ink/70">Enter your email and choose a password.</p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <label htmlFor="email" className="font-sans text-sm font-medium text-ink">
            Email
          </label>
          <TextInput
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setAlreadyRegistered(false)
            }}
          />
          {alreadyRegistered && (
            <p className="font-sans text-sm text-warm">
              This email's already registered —{' '}
              <button type="button" onClick={() => navigate('/sign-in')} className="focus-ring underline">
                sign in instead
              </button>
              .
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="password" className="font-sans text-sm font-medium text-ink">
            Password
          </label>
          <TextInput
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordTooShort && <p className="font-sans text-sm text-warm">Password must be at least {MIN_PASSWORD_LENGTH} characters.</p>}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="font-sans text-sm font-medium text-ink">
            Confirm password
          </label>
          <TextInput
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
          />
          {confirmTouched && !passwordsMatch && <p className="font-sans text-sm text-warm">Passwords don't match.</p>}
        </div>

        {error && <p className="mt-4 font-sans text-sm text-warm">{error}</p>}

        <div className="flex-1" />
        <div className="flex flex-col gap-4">
          <GradientActionButton type="submit" disabled={!canSubmit}>
            {submitting ? 'Creating account…' : 'Create account'}
          </GradientActionButton>
          <button type="button" onClick={() => navigate('/sign-in')} className="focus-ring pressable font-sans text-lg font-semibold text-[#e90555]">
            Already have an account? Sign in
          </button>
        </div>
      </form>
    </div>
  )
}
