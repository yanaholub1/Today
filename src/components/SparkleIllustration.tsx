import sparkle from '../assets/Sparkle.png'

/** Evening reflection flow's success-screen illustration — the real exported asset, same pattern as `TargetIllustration`/`CheckFatIllustration`. */
export function SparkleIllustration({ className }: { className?: string }) {
  return <img src={sparkle} alt="" width={108} height={108} className={className} />
}
