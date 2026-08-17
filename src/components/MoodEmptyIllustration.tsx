import moodEmptyState from '../assets/MoodEmptyState.png'

/** DayDetailScreen's Mood-subtab empty state icon — the real exported asset, same pattern as `NotesEmptyIllustration`/`PracticesEmptyIllustration`/`TargetIllustration`. Native 156x156 (square). */
export function MoodEmptyIllustration({ className }: { className?: string }) {
  return <img src={moodEmptyState} alt="" width={156} height={156} className={className} />
}
