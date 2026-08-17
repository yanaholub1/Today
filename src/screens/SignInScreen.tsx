import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { TextInput } from '../components/TextInput'
import { GradientActionButton } from '../components/GradientActionButton'
import { useAuth } from '../lib/authStore'
import { useThemeColor } from '../lib/useThemeColor'
import { ReturningUserLoadingScreen } from './ReturningUserLoadingScreen'

/**
 * Sign-in (email + password) — review fix: split from the old magic-link
 * RegistrationScreen once Supabase's own `signInWithPassword()` needed
 * separate handling from `signUp()` (unlike OTP, where "sign up" and
 * "sign in" were the same request).
 *
 * Review fix: no longer OnboardingScreen's own "Sign in" destination —
 * that button now routes to `/sign-up` instead (see SignUpScreen.tsx's
 * own doc comment for why: it's become the one general "create an
 * account or continue into an existing one" form). This screen is now a
 * plain, manual returning-user login — reachable by direct URL, and from
 * SignUpScreen's own "Already have an account?" row.
 *
 * Two error states Supabase distinguishes server-side:
 * - "Invalid login credentials" — wrong password OR unknown email,
 *   deliberately the SAME generic message for both (anti-enumeration,
 *   same reasoning as SignUpScreen's own already-registered check) —
 *   translated to friendlier copy by authStore.tsx's own
 *   `friendlyAuthError` rather than guessing which one's actually wrong.
 * - "Email not confirmed" — a real account that hasn't clicked its
 *   confirmation link yet (only reachable if "Confirm email" is on —
 *   see SignUpScreen.tsx's own doc comment on that setting, currently
 *   expected to be off) — surfaced distinctly since the fix here (check
 *   your inbox) is different from a wrong password.
 *
 * On success, nothing further happens here: `useAuth()`'s `status` flips
 * to `'signedIn'` via Supabase's own `onAuthStateChange`, and App.tsx's
 * route guards (`RequireRegistration`/`RootRoute`) redirect into the app
 * on their own — same mechanism every other sign-in path already uses.
 *
 * Review fix — `submitting` now also swaps the whole screen for
 * `ReturningUserLoadingScreen` (the same splash the app already shows a
 * returning user while it loads) instead of just disabling the button
 * and relabeling it "Signing in…" — see SignUpScreen.tsx's own doc
 * comment on the identical pattern there (`onDone={() => {}}`,
 * `useThemeColor` mirroring the splash's pink) for the full reasoning;
 * not repeated here.
 */
export function SignInScreen() {
  const navigate = useNavigate()
  const { signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useThemeColor(submitting && '#ffdcf5')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signInWithPassword(email.trim(), password)
    if (error) {
      setSubmitting(false)
      setError(error)
    }
    // No error: signed in — App.tsx's own route guards take it from here; `submitting` stays true so the loading screen keeps showing until that unmount happens.
  }

  if (submitting) return <ReturningUserLoadingScreen onDone={() => {}} />

  return (
    <div className="mx-auto flex h-dvh w-full sm:max-w-[393px] flex-col bg-white">
      <TaskFlowHeader exit="back" onExit={() => navigate('/onboarding')} />
      {/*
        `pb-[max(32px,env(safe-area-inset-bottom))]` + `h-dvh` (not
        `h-screen`): the same home-indicator-clipping fix the old
        RegistrationScreen needed — `h-dvh` keeps this container from
        rendering taller than what's really visible (the `100vh`-vs-real
        -viewport mismatch on iOS Safari), and the `max()` floor keeps
        the original 32px spacing on non-notched devices while growing
        past it only when the real safe-area inset demands more.
      */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-ink">Sign in</h1>
          <p className="font-sans text-base text-ink/70">Enter your email and password.</p>
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
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="font-sans text-sm text-warm">{error}</p>}
        </div>

        <div className="flex-1" />
        <div className="flex flex-col gap-4">
          <GradientActionButton type="submit" disabled={!email.trim() || !password || submitting}>
            Sign in
          </GradientActionButton>
          <p className="text-center font-sans text-lg text-ink">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/sign-up')} className="focus-ring pressable font-semibold text-[#e90555]">
              Sign up
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
