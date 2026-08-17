import practicesEmptyState from '../assets/PracticesEmptyState.png'

/** "Practices" subtab empty state icon (DaySummaryCard's `icon` override on CheckInScreen's Practices branch) — the real exported asset, same pattern as `TargetIllustration`/`SparkleIllustration`/`CheckFatIllustration`. Native 137x117 (not square, unlike the Phosphor `Heart` glyph it replaces or `NotesEmptyIllustration`'s own square export) — rendered inside a fixed square box with `object-contain` wherever it's used (review fix: was `h-[52px] w-auto`, which matched Notes' height but not its total footprint, since this asset is wider than tall), so it scales to the same size as the Notes icon without stretching. */
export function PracticesEmptyIllustration({ className }: { className?: string }) {
  return <img src={practicesEmptyState} alt="" width={137} height={117} className={className} />
}
