import target from '../assets/Target.png'

/** Morning intention flow's success-screen illustration — the real exported asset, same pattern as `SparkleIllustration`/`CheckFatIllustration`. Replaces the earlier `SunHorizonIllustration` per explicit direct request (recolored icon set). */
export function TargetIllustration({ className }: { className?: string }) {
  return <img src={target} alt="" width={108} height={108} className={className} />
}
