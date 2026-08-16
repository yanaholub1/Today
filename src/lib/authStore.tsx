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

interface AuthStoreValue {
  status: AuthStatus
  userId: string | null
  email: string | null
  /** Sends a magic link. Resolves with an error message on failure, null on success — the caller decides how to surface it. */
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthStoreValue | null>(null)

/**
 * Real auth (Stage 6), replacing the old mock `isRegistered` flag that used
 * to live on `dayLogStore`. Session persistence — the hard requirement that
 * a user only clicks the magic link once per device — is Supabase's own
 * default behavior here (`persistSession: true`, `localStorage` storage,
 * both defaults in `supabaseClient.ts`), not something built here; this
 * provider's own job is just to surface that persisted session as React
 * state on load via `getSession()`, then stay in sync via
 * `onAuthStateChange` for sign-in/sign-out/token-refresh events.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'signedIn' : 'signedOut')
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithMagicLink = async (email: string) => {
    // emailRedirectTo: the app's own root — RootRoute redirects into
    // /checkin once the client parses the returned session from the URL
    // (detectSessionInUrl, on by default), so no dedicated /auth/callback
    // route is needed.
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
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
        signInWithMagicLink,
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
