import checkFat from '../assets/CheckFat.png'

/** Mood check-in flow's success-screen illustration — the real exported asset, same pattern as `TargetIllustration`/`SparkleIllustration`. */
export function CheckFatIllustration({ className }: { className?: string }) {
  return <img src={checkFat} alt="" width={108} height={108} className={className} />
}
