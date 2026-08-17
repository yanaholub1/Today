import intentionEmptyState from '../assets/IntentionEmptyState.png'

/** DayDetailScreen's Intention-subtab empty state icon — the real exported asset, same pattern as `NotesEmptyIllustration`/`PracticesEmptyIllustration`/`TargetIllustration`. Native 120x120 (square). */
export function IntentionEmptyIllustration({ className }: { className?: string }) {
  return <img src={intentionEmptyState} alt="" width={120} height={120} className={className} />
}
