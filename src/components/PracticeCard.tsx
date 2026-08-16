import { Heart } from '@phosphor-icons/react'
import type { TechniqueDef } from '../lib/moodTechniques'

export interface PracticeCardProps {
  technique: TechniqueDef
  onUnfavorite: () => void
}

/**
 * One row in the home screen's Practices subtab (review fix — no Figma
 * node exists for this screen yet, per the task's own brief; flagged here
 * and in this fix's summary as inferred, pending real design). Reuses
 * `TechniqueCard`'s own unselected-card recipe byte-for-byte (`#fdfcfd`
 * fill, `#eddde6` border, the `.sheen-filter-active` utility) rather than
 * inventing new styling — the same recipe DayDetailScreen's own read-only
 * technique summary already reuses for its Mood subtab, so this is the
 * THIRD use of one established "static technique card" look, not a new
 * one. Not built as a `TechniqueCard` instance directly: that component's
 * props (`selected`/`onClick`/`description`) are all about the pick-a-
 * technique flow, which has no meaning in a saved-favorites list — a
 * small dedicated component keeps this list's own responsibility (show +
 * unfavorite) separate from the flow's own (browse + select).
 *
 * Every technique shown here is, by definition, currently favorited (the
 * list is built directly from `favoriteTechniqueIds`), so the heart is
 * always rendered filled — tapping it only ever unfavorites, mirroring
 * `TechniqueCard`'s own heart as a real, independent tap target.
 */
export function PracticeCard({ technique, onUnfavorite }: PracticeCardProps) {
  return (
    <div className="sheen sheen-filter-active relative flex w-full flex-col gap-3 rounded-[16px] border border-solid border-[#eddde6] bg-[#fdfcfd] p-4">
      <p className="pr-8 font-sans text-[15px] font-medium text-[#787d89]">
        {technique.tag} • {technique.durationMinutes} min
      </p>
      <p className="font-sans text-base font-medium text-ink">{technique.label}</p>
      <button
        type="button"
        onClick={onUnfavorite}
        aria-label={`Remove ${technique.label} from Practices`}
        className="focus-ring pressable absolute top-4 right-4 flex size-6 items-center justify-center"
      >
        <Heart size={24} weight="fill" className="text-warm" />
      </button>
    </div>
  )
}
