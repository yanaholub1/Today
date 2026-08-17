// One-shot flag: ReturningUserLoadingScreen's own giant-circle-collapses-
// onto-the-wordmark sequence should only ever play once per session, on
// the very first time a returning user lands on `/loading`, not on a
// mid-session revisit to `/`. A plain module singleton (not
// sessionStorage-backed) is deliberate: it resets on a real page reload,
// matching "first time THIS SESSION," and needs no cleanup.
//
// Review fix: BottomNav.tsx used to be this flag's other consumer (its
// own check-in-FAB splash, landing the same kind of circle on the "+"
// button on first mount) — that animation was removed per explicit
// request, so this flag now has exactly one owner.
//
// Split into a pure read and a separate claim, rather than one
// read-and-claim function, so callers can read this safely from a
// `useState(() => ...)` lazy initializer (React may invoke that more than
// once per mount under StrictMode) and only perform the actual claim
// — the mutation — from an effect, which is where React expects side
// effects to live and where StrictMode's mount→cleanup→mount replay stays
// safe (claiming twice has no different effect than once).
let claimed = false

export function peekFirstLoadSplashAvailable(): boolean {
  return !claimed
}

export function claimFirstLoadSplash(): void {
  claimed = true
}
