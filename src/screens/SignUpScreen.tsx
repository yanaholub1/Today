import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { GradientActionButton } from '../components/GradientActionButton'
import { useAuth } from '../lib/authStore'
import { useThemeColor } from '../lib/useThemeColor'
import { ReturningUserLoadingScreen } from './ReturningUserLoadingScreen'

// Matches Supabase's own default minimum — checked client-side so the
// obvious case doesn't need a round-trip, with the server's own error
// (surfaced via `error` below) as the fallback for anything this simple
// check doesn't catch (e.g. leaked-password protection, if ever enabled).
const MIN_PASSWORD_LENGTH = 6

/**
 * Create-an-account / continue-into-an-existing-one (name + email +
 * password + confirm password) — review fix: this is now
 * OnboardingScreen's own "Sign in" button destination (previously
 * unhooked, previously built around `signUp()`, which would have created
 * a brand-new account unrelated to whatever's already saved under this
 * device's own anonymous session).
 *
 * Now calls `authStore.tsx`'s `registerAccount(name, email, password)` —
 * see that function's own doc comment for the full mechanics. Two
 * successful outcomes, neither needing anything further here (no
 * explicit navigation — `useAuth()`'s `status`/`isAnonymous` flip via
 * Supabase's own `onAuthStateChange`, and App.tsx's `RedirectIfRegistered`,
 * already wrapping this route, redirects into the app on its own, same
 * mechanism every other sign-in path in this app already relies on):
 * - the current anonymous session becomes a real, permanent account
 *   (Case A) — same user id, so everything already saved on this device
 *   is preserved automatically, no migration needed.
 * - the chosen email already belongs to a different, existing account
 *   (Case B) — `registerAccount` transparently signs into THAT account
 *   using the same password just typed here, rather than dead-ending on
 *   an "already registered" message the way the old `signUp()`-based
 *   version did. Known, accepted limitation: today's anonymous-session
 *   data on this device is NOT merged into that existing account (see
 *   `registerAccount`'s own doc comment for why).
 *
 * Any other failure (weak password, invalid email, or a wrong password
 * on the Case B fallback login) surfaces as one plain error message —
 * unlike the old version, there's no separate "needs email confirmation"
 * state to handle: this project's "Confirm email" setting is off, so
 * `registerAccount` never has a pending, not-yet-real session to wait on.
 *
 * Review fix — `submitting` now also swaps the whole screen for
 * `ReturningUserLoadingScreen` (the same splash the app already shows a
 * returning user while it loads), rather than just disabling the button
 * and relabeling it "Creating account…": account creation is a real
 * network round-trip, previously the only auth action in the app with no
 * loading state of its own. `onDone={() => {}}` — deliberately a no-op,
 * see that screen's own doc comment on its `onDone` prop — this screen
 * stays in control of when to stop showing it (on error, back to the
 * form below; on success, App.tsx's `RedirectIfRegistered` unmounts this
 * whole screen once `status`/`isAnonymous` flip, same as it always has).
 * `useThemeColor` mirrors the splash's own pink while it's showing, same
 * hex `AuthLoadingScreen` already uses — otherwise the status bar/toolbar
 * chrome would stay this screen's usual white underneath a pink splash.
 */
export function SignUpScreen() {
  const navigate = useNavigate()
  const { registerAccount, beginMinLoadingWindow } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useThemeColor(submitting && '#ffdcf5')

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const canSubmit = Boolean(name.trim()) && Boolean(email.trim()) && Boolean(password) && !passwordTooShort && !submitting

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    beginMinLoadingWindow()
    const result = await registerAccount(name.trim(), email.trim(), password)
    if (result.error) {
      setSubmitting(false)
      setError(result.error)
    }
    // No error: signed in — either upgraded this device's anonymous session or signed into an existing account. App.tsx's own route guards take it from here; `submitting` stays true so the loading screen keeps showing until that unmount happens.
  }

  if (submitting) return <ReturningUserLoadingScreen onDone={() => {}} />

  return (
    <div className="mx-auto flex h-dvh w-full sm:max-w-[393px] flex-col bg-white">
      <TaskFlowHeader exit="back" onExit={() => navigate('/onboarding')} />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-ink">Create your account</h1>
          <p className="font-sans text-base text-ink/70">Enter your name, email, and a password.</p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <label htmlFor="name" className="font-sans text-sm font-medium text-ink">
            Name
          </label>
          <TextInput id="name" type="text" required autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mt-6 flex flex-col gap-2">
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
            onChange={(e) => setEmail(e.target.value)}
          />
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

        {error && <p className="mt-4 font-sans text-sm text-warm">{error}</p>}

        <div className="flex-1" />
        <div className="flex flex-col gap-4">
          <GradientActionButton type="submit" disabled={!canSubmit}>
            Create account
          </GradientActionButton>
          <p className="text-center font-sans text-lg text-ink">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/sign-in')} className="focus-ring pressable font-semibold text-[#e90555]">
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
