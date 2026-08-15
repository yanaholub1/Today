// Visual smoke test for the design token layer — not a real screen.
// Proves colors, radii, and the sheen shadow utility render as expected.
export default function TokenPreview() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[393px] flex-col gap-6 bg-white p-5">
      <div className="sheen sheen-warm flex h-40 items-center justify-center rounded-hero border-2 border-warm-border bg-warm">
        <p className="font-serif text-2xl tracking-[-0.28px] text-white">
          Set intention
        </p>
      </div>

      <div className="sheen sheen-pale flex h-40 items-center justify-center rounded-hero border-2 border-warm-pale-border bg-warm-pale">
        <p className="font-serif text-2xl tracking-[-0.28px] text-ink">
          Mood check-in
        </p>
      </div>

      <div className="flex gap-2">
        <div className="sheen sheen-chip-warm flex flex-1 items-center justify-center rounded-card border border-warm-chip-border bg-warm-mid py-3">
          <p className="font-sans text-base font-medium tracking-[-0.16px] text-white">
            High energy
          </p>
        </div>
        <div className="sheen sheen-chip-warm flex flex-1 items-center justify-center rounded-card border border-warm-chip-border bg-warm-pale-alt py-3">
          <p className="font-sans text-base font-medium tracking-[-0.16px] text-ink">
            High energy
          </p>
        </div>
        <div className="sheen sheen-chip-cool flex flex-1 items-center justify-center rounded-card border border-cool-pale-border bg-cool-pale py-3">
          <p className="font-sans text-base font-medium tracking-[-0.16px] text-ink">
            High energy
          </p>
        </div>
      </div>
    </div>
  )
}
