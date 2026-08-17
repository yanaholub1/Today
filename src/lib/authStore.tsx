import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

/**
 * 'loading' is the brief window before Supabase's initial `getSession()`
 * call resolves — App.tsx's route guards must NOT decide onboarding-vs-app
 * during this window (that's exactly the "only re-authenticate if there's
 * genuinely no valid session" requirement), so callers gate on this
 * explicitly rather than treating a missing session as "signed out" from
 * the first render.
 */
type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

/**
 * `signUp`'s three non-error outcomes, per Supabase's own `signUp()`
 * contract — the caller (SignUpScreen) can't tell any of these apart from
 * `error` alone, since Supabase deliberately returns a 200 (not an error)
 * for "this email is already registered," to avoid letting an attacker
 * enumerate which emails have accounts:
 * - `alreadyRegistered`: `data.user.identities` comes back as an EMPTY
 *   array — Supabase's own documented signal for this case (a real new
 *   signup always has at least one identity). No session, no email sent.
 * - `needsEmailConfirmation`: a real new signup, but `data.session` is
 *   null — the project still has "Confirm email" on, so the account
 *   exists but isn't usable until the confirmation link is clicked.
 * - neither flag set: `data.session` came back non-null — confirmation
 *   is off (or not required), the user is signed in immediately.
 *   `useAuth().status` flips to `'signedIn'` on its own via
 *   `onAuthStateChange` below; the caller doesn't need to do anything
 *   further, same as every other sign-in path in this app already works.
 */
interface SignUpResult {
  error: string | null
  alreadyRegistered: boolean
  needsEmailConfirmation: boolean
}

interface AuthStoreValue {
  status: AuthStatus
  userId: string | null
  email: string | null
  signUp: (email: string, password: string) => Promise<SignUpResult>
  /** Resolves with an error message on failure (Supabase returns the same generic "Invalid login credentials" for both a wrong password and an unknown email — deliberately, so this can't distinguish which), null on success — the caller decides how to surface it. */
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthStoreValue | null>(null)

/**
 * Real auth (Stage 6, originally magic-link — review fix, switched to
 * email/password: `signUp()`/`signInWithPassword()` instead of the old
 * single `signInWithMagicLink`/`signInWithOtp`, since password auth
 * genuinely needs the two kept separate — Supabase itself distinguishes
 * new-account creation from returning-user sign-in, unlike OTP where
 * "sign up" and "sign in" were the same request). Session persistence —
 * the hard requirement that a session survives a reload — is Supabase's
 * own default behavior here (`persistSession: true`, `localStorage`
 * storage, both defaults in `supabaseClient.ts`), not something built
 * here; this provider's own job is just to surface that persisted
 * session as React state on load via `getSession()`, then stay in sync
 * via `onAuthStateChange` for sign-in/sign-out/token-refresh events —
 * unchanged by the OTP-to-password switch, since that mechanism was
 * always provider-agnostic.
 *
 * Review fix — every user (new or returning) now gets a real, silent
 * Supabase session via `signInAnonymously()` when `getSession()` finds
 * nothing persisted, so `dayLogStore.tsx`'s already-built save paths
 * (previously always no-op'd on a `null` userId, per the data-persistence
 * audit) actually persist. No new UI: the active flow's own routing is
 * still driven entirely by the local onboarding flag (`onboardingFlag.ts`),
 * never by `status` here, so this resolves in the background without
 * gating or delaying anything the user sees. The anonymous session
 * persists exactly like a real one (same `persistSession`/localStorage
 * mechanism above), so a returning user's `getSession()` restores the
 * SAME identity rather than minting a new one each launch.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setSession(data.session)
        setStatus('signedIn')
        return
      }
      // No persisted session (first-ever launch on this device, or one that failed to
      // restore) — establish a silent anonymous session so dayLogStore.tsx's already-built
      // save paths have a real userId to write against, with no visible sign-up/sign-in
      // step. On success, onAuthStateChange below picks it up the same way it already does
      // for signUp/signInWithPassword (neither of those sets state here either). On error
      // (e.g. the project's "Allow anonymous sign-ins" toggle is off), fall back to the
      // exact 'signedOut' state this app is already in today — no hang, no regression.
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Anonymous sign-in failed', error)
        setSession(null)
        setStatus('signedOut')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'signedIn' : 'signedOut')
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    // emailRedirectTo: only actually used if "Confirm email" is on (the
    // confirmation link needs somewhere to send the user back to) — same
    // mechanism, same URL, as the old magic-link flow's own
    // emailRedirectTo, so it inherits that flow's already-solved
    // LAN-redirect-URL setup rather than needing a new one.
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) return { error: error.message, alreadyRegistered: false, needsEmailConfirmation: false }
    const alreadyRegistered = data.user?.identities?.length === 0
    return { error: null, alreadyRegistered, needsEmailConfirmation: !alreadyRegistered && !data.session }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        signUp,
        signInWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthStoreValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
