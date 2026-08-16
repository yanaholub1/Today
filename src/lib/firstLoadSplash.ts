// One-shot flag: the check-in FAB's own giant-circle splash (BottomNav.tsx)
// should only ever play once per session — on the very first time the
// authenticated app shell mounts, not on every later remount of BottomNav
// (e.g. leaving via a FlowLayout route and coming back). A plain module
// singleton (not sessionStorage-backed) is deliberate: it resets on a real
// page reload, matching "first time THIS SESSION," and needs no cleanup.
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
