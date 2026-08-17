import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { markOnboardingComplete, clearOnboardingComplete } from './onboardingFlag'
import { setDisplayName } from './displayName'
import { setIntentionCutoffTime } from './intentionCutoff'

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

/**
 * `registerAccount`'s two non-error outcomes — see that function's own doc
 * comment for the full anonymous-upgrade-with-fallback-login mechanics.
 * `signedIntoExistingAccount: true` means the chosen email already
 * belonged to a real account and this call signed into THAT account
 * instead of upgrading the current anonymous session — the caller doesn't
 * need to do anything differently either way (both land on the same
 * `onAuthStateChange`-driven redirect), but may want to know which
 * happened for messaging purposes.
 */
interface RegisterAccountResult {
  error: string | null
  signedIntoExistingAccount: boolean
}

interface AuthStoreValue {
  status: AuthStatus
  /** True for the silent, no-UI session `signInAnonymously()` establishes on every device — see this provider's own doc comment. Lets callers (App.tsx's `RedirectIfRegistered`) tell "has a session" apart from "has a REAL, permanent account." */
  isAnonymous: boolean
  userId: string | null
  email: string | null
  signUp: (email: string, password: string) => Promise<SignUpResult>
  /** Resolves with an error message on failure (Supabase returns the same generic message for both a wrong password and an unknown email — deliberately, so this can't distinguish which; translated to friendlier copy via `friendlyAuthError` before it gets here), null on success — the caller decides how to surface it. */
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  registerAccount: (name: string, email: string, password: string) => Promise<RegisterAccountResult>
  /** Best-effort push of an already-locally-saved name to the real account (`user_metadata.display_name`, same field `registerAccount` sets), so a real account carries it cross-device — a no-op for an anonymous session (mirrors `syncSession`'s own real-account-only gate below). Callers own their own local write (ProfileScreen → `displayName.ts`, unchanged) and call this separately, deliberately NOT on every keystroke — see ProfileScreen.tsx's own doc comment for why. */
  syncDisplayNameToAccount: (name: string) => void
  /** Writes the daily intention cutoff to local storage (always, so `deriveIntentionState` sees it immediately regardless of anonymous/real) and, for a real account, best-effort mirrors it to `user_metadata.intention_cutoff_time` too — same dual-write shape as `syncDisplayNameToAccount`, just combined into one call since a native `<input type="time">` doesn't fire per keystroke the way a text field does. */
  updateIntentionCutoffTime: (time: string | null) => void
  signOut: () => Promise<void>
  /**
   * True for `MIN_LOADING_SCREEN_MS` after `beginMinLoadingWindow()` is
   * called, regardless of how fast the real request behind it resolves —
   * see that function's own doc comment for the full mechanism and why
   * this lives here rather than in SignUpScreen/SignInScreen themselves.
   */
  minLoadingWindowActive: boolean
  /** Call at the START of a registration/sign-in submission (SignUpScreen/SignInScreen's own `handleSubmit`) — see this function's own doc comment. */
  beginMinLoadingWindow: () => void
}

const AuthContext = createContext<AuthStoreValue | null>(null)

/**
 * Floor for how long `ReturningUserLoadingScreen` stays visible once a
 * registration/sign-in submission starts (review fix — a fast connection
 * could resolve in ~100-200ms, which unmounted the loading screen mid
 * entrance-animation and read as an abrupt jump-cut rather than a real
 * loading beat). Only ever a FLOOR, never an extension beyond however long
 * the real work actually takes — see `beginMinLoadingWindow`'s own doc
 * comment for the mechanism that guarantees that.
 */
const MIN_LOADING_SCREEN_MS = 1000

/**
 * Supabase's own `signInWithPassword` message for both a wrong password and
 * an unknown email (deliberately identical, anti-enumeration — see this
 * file's own doc comments above) — translated to friendlier app copy at the
 * one place both call sites that can produce it (the `signInWithPassword`
 * wrapper below, and `registerAccount`'s own Case-B fallback login) route
 * through. Any other error message is passed through unchanged.
 */
function friendlyAuthError(message: string): string {
  return message === 'Invalid login credentials' ? 'Email or password is incorrect. Please try again.' : message
}

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
 *
 * Review fix — `syncSession` below is now the ONE place that reacts to a
 * session becoming real (non-anonymous), called from both the initial
 * `getSession()` "already has a session" branch and `onAuthStateChange`
 * (previously each just set `session`/`status` directly, duplicated).
 * Centralizing this is what lets `registerAccount` below need no
 * post-success logic of its own: the moment Supabase's own event fires
 * for a successful upgrade OR a Case-B fallback login, this same code
 * path (a) marks onboarding complete — otherwise a device that reaches a
 * real account without ever having completed onboarding locally (a
 * fresh device signing into an EXISTING account, or this device's own
 * upgrade flow) would bounce in a redirect loop, since `RequireOnboarded`
 * gates the rest of the app on that local flag alone, never on real auth
 * status — and (b) mirrors `user_metadata.display_name` (set once, at
 * registration time, via `registerAccount`'s own `data` field below) into
 * `displayName.ts`'s local storage, so `getGreeting`/`getDisplayName`
 * pick up the real account's name on ANY device that signs into it,
 * without either of those call sites needing to change at all.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [minLoadingWindowActive, setMinLoadingWindowActive] = useState(false)

  /**
   * Starts (or restarts, on a retry after an error) a `MIN_LOADING_SCREEN_MS`
   * floor on `minLoadingWindowActive`, which App.tsx's `RedirectIfRegistered`
   * ALSO consults before navigating away from `/sign-up`/`/sign-in`: it
   * won't redirect into the app while this is still true, even once the
   * real account is already signed in, so the loading screen those two
   * screens are showing can't be unmounted mid-entrance-animation by a
   * fast response. This can't be done by delaying `registerAccount`'s/
   * `signInWithPassword`'s OWN returned promise instead (the more obvious-
   * looking fix) — Supabase's `onAuthStateChange` (this provider's own
   * subscription, above) fires as a side effect of the SAME underlying
   * request, independently of when that promise resolves back to the
   * caller, so `status`/`isAnonymous` (and therefore `RedirectIfRegistered`'s
   * own redirect) would already have updated before any such delay ran.
   * A plain `setTimeout` back to `false` — not tracking "is the real
   * request still pending" — is what keeps this a FLOOR, not an added
   * delay on top of slow requests: once real work has already taken
   * longer than `MIN_LOADING_SCREEN_MS`, this flips back to `false` on
   * its own schedule and `RedirectIfRegistered` redirects the moment
   * `status` says it's ready, with no extra wait layered on.
   */
  const beginMinLoadingWindow = () => {
    setMinLoadingWindowActive(true)
    window.setTimeout(() => setMinLoadingWindowActive(false), MIN_LOADING_SCREEN_MS)
  }

  useEffect(() => {
    const syncSession = (newSession: Session | null) => {
      setSession(newSession)
      setStatus(newSession ? 'signedIn' : 'signedOut')
      if (newSession && !newSession.user.is_anonymous) {
        markOnboardingComplete()
        const name = newSession.user.user_metadata?.display_name
        if (typeof name === 'string' && name.trim()) setDisplayName(name)
        // Same mirror as display_name above, same reasoning: lets a second
        // device signing into this account pick up the cutoff time it was
        // set on, without ProfileScreen needing to know this mirror exists.
        const cutoffTime = newSession.user.user_metadata?.intention_cutoff_time
        if (typeof cutoffTime === 'string' && /^\d{2}:\d{2}$/.test(cutoffTime)) setIntentionCutoffTime(cutoffTime)
      }
    }

    // Establishes a silent anonymous session so dayLogStore.tsx's already-built
    // save paths have a real userId to write against, with no visible sign-up/sign-in
    // step. On success, onAuthStateChange picks it up the same way it already does
    // for signUp/signInWithPassword (neither of those sets state here either). On error
    // (e.g. the project's "Allow anonymous sign-ins" toggle is off), fall back to the
    // exact 'signedOut' state this app is already in today — no hang, no regression.
    // Extracted (review fix) so it can also run right after an explicit sign-out below,
    // not just on this effect's own initial mount — see that call site's own comment.
    const establishAnonymousSession = async () => {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Anonymous sign-in failed', error)
        setSession(null)
        setStatus('signedOut')
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        syncSession(data.session)
      } else {
        // No persisted session — first-ever launch on this device, or one that failed to restore.
        establishAnonymousSession()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      syncSession(newSession)
      // Review fix: re-run the SAME bootstrap above after an explicit sign-out
      // (`signOut` below), not just on first mount — that mount-time call only
      // ever fires once per page load, so without this, a device that signs
      // out and then taps "Get started" again (no full reload in between)
      // would be stuck with `userId: null` for the rest of the tab's life,
      // silently no-op'ing every dayLogStore write. Scoped to the `SIGNED_OUT`
      // event specifically (not "any null session") so it can never fire
      // mid sign-up/sign-in — neither of those flows ever emits SIGNED_OUT.
      if (event === 'SIGNED_OUT') establishAnonymousSession()
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
    return { error: error ? friendlyAuthError(error.message) : null }
  }

  /**
   * Upgrades the CURRENT session's anonymous user into a real, permanent
   * account (Case A), with a built-in fallback for the case where the
   * chosen email already belongs to a different, existing account
   * (Case B) — this is Supabase's own documented pattern for this exact
   * situation (`guides/auth/auth-anonymous#linking-an-anonymous-user-to-
   * an-existing-account`), not invented here.
   *
   * `updateUser({ email, password, data })` is the real anonymous→
   * permanent call (confirmed against the installed SDK's own types —
   * `linkIdentity()` is OAuth/OIDC-only, not applicable to email+password).
   * Since this project's "Confirm email" setting is off, this completes
   * immediately — same `auth.uid()` as the anonymous session it started
   * from, so every row already saved under that id (RLS-scoped by
   * `user_id = auth.uid()`) is preserved automatically, with no migration
   * step needed. `data: { display_name: name }` sets the name in
   * `user_metadata` in this same call — `syncSession` above (this
   * provider's own `onAuthStateChange` handling) mirrors it into
   * `displayName.ts`'s local storage the moment the resulting session
   * event fires, so this function itself doesn't need to touch that.
   *
   * If `error.code === 'email_exists'` (the installed SDK's real error
   * code for this, confirmed in `@supabase/auth-js`'s own `ErrorCode`
   * union — not a guessed string), the email belongs to a genuine
   * existing account: falls back to `signInWithPassword`, a real login to
   * THAT account. Known, accepted limitation (confirmed, not silently
   * assumed): whatever's saved under the now-abandoned anonymous session
   * on this device is NOT migrated into the existing account — doing so
   * safely would need a security-definer Postgres function this project
   * doesn't have, since a plain client-side reassignment can't get past
   * RLS once the session has moved to the different, real user's `auth.uid()`.
   *
   * Any other error (weak password, invalid email, rate limit, etc.) is
   * surfaced as-is via Supabase's own `error.message`.
   */
  const registerAccount = async (name: string, email: string, password: string): Promise<RegisterAccountResult> => {
    const { error } = await supabase.auth.updateUser({ email, password, data: { display_name: name } })
    if (!error) return { error: null, signedIntoExistingAccount: false }
    if (error.code === 'email_exists') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) return { error: friendlyAuthError(signInError.message), signedIntoExistingAccount: false }
      return { error: null, signedIntoExistingAccount: true }
    }
    return { error: error.message, signedIntoExistingAccount: false }
  }

  // Both gated on `!session.user.is_anonymous`, the exact same real-account
  // check `syncSession` above already uses — an anonymous session simply
  // never gets a Supabase write, local storage is the whole story for it,
  // unchanged from today. Fire-and-forget, matching every other store
  // write in this app — failures are logged, not surfaced in the UI, since
  // local storage already has the correct value either way.
  const syncDisplayNameToAccount = (name: string) => {
    if (!session || session.user.is_anonymous) return
    const trimmed = name.trim()
    if (!trimmed) return
    supabase.auth.updateUser({ data: { display_name: trimmed } }).then(({ error }) => {
      if (error) console.error('Failed to sync display name to account', error)
    })
  }

  const updateIntentionCutoffTime = (time: string | null) => {
    setIntentionCutoffTime(time)
    if (!session || session.user.is_anonymous) return
    supabase.auth.updateUser({ data: { intention_cutoff_time: time } }).then(({ error }) => {
      if (error) console.error('Failed to sync intention cutoff time to account', error)
    })
  }

  /**
   * Review fix — root cause of "Log out doesn't do anything": this used to
   * just call `supabase.auth.signOut()` and stop there. That DID clear the
   * real session (confirmed — the bug wasn't a broken/unwired button), but
   * nothing downstream ever noticed: `RequireOnboarded`/`RootRoute`
   * (App.tsx) gate the ENTIRE app purely on the local
   * `today:onboardingComplete` flag, never on real auth status — a
   * deliberate choice from when auth was paused (see that flag's own doc
   * comment), never revisited once real accounts came back. So the app
   * just sat exactly where it was, silently down to a `null` userId
   * (every dayLogStore write already no-ops on that), with zero visible
   * change — reading exactly like "still logged in."
   *
   * Clearing the flag HERE, before calling Supabase, is what actually
   * makes `RequireOnboarded` redirect to `/onboarding` on the very next
   * render: `onAuthStateChange`'s SIGNED_OUT event (fired by the call
   * below) causes this provider to re-render regardless, and by clearing
   * the flag first rather than after, that render is guaranteed to see it
   * already gone — no race with exactly when the event fires relative to
   * this function's own execution.
   *
   * `displayName.ts`/`intentionCutoff.ts`'s LOCAL mirrors are cleared too
   * (blank/null already means "clear" to both setters) — otherwise the
   * signed-out greeting, and the next anonymous session's own cutoff
   * check, would keep showing/enforcing the just-logged-out account's own
   * private settings. Local-only clears, NOT `syncDisplayNameToAccount`/
   * `updateIntentionCutoffTime` (which push to Supabase) — this must not
   * touch the real account's still-valid stored preferences, only this
   * device's local cache of them.
   */
  const signOut = async () => {
    clearOnboardingComplete()
    setDisplayName('')
    setIntentionCutoffTime(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        isAnonymous: session?.user.is_anonymous ?? false,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        signUp,
        signInWithPassword,
        registerAccount,
        syncDisplayNameToAccount,
        updateIntentionCutoffTime,
        signOut,
        minLoadingWindowActive,
        beginMinLoadingWindow,
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
