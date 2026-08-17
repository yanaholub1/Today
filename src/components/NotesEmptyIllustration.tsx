import notesEmptyState from '../assets/NotesEmptyState.png'

/** "Notes" subtab empty state icon (DaySummaryCard's default) — the real exported asset, same pattern as `TargetIllustration`/`SparkleIllustration`/`CheckFatIllustration`. Native 156x156 (square), same aspect ratio as the Phosphor glyph it replaces. */
export function NotesEmptyIllustration({ className }: { className?: string }) {
  return <img src={notesEmptyState} alt="" width={156} height={156} className={className} />
}
