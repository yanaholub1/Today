import { useState } from 'react'
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
 * one.
 *
 * Review fix: the card itself now expands on tap to reveal
 * `technique.instructions` — explicit direct request, matching the same
 * expand-to-reveal-instructions interaction the mood check-in flow's own
 * `TechniqueCard` and DayDetailScreen's read-only technique-summary card
 * (`MoodCheckInDetailCard`) already both support; this was previously the
 * one static, non-interactive technique card in the app. `instructions`
 * (not `description`) is the same field DayDetailScreen's own reveal
 * already shows — see `TechniqueDef`'s own doc comment for why that one
 * field covers both the picker flow's "selected card" copy and this kind
 * of after-the-fact instruction reveal. The heart can't be a nested
 * `<button>` inside the card's own now-clickable `<button>` (invalid
 * HTML), so it's a sibling `<button>` absolutely positioned over the same
 * corner inside a shared `relative` wrapper — same structure
 * `TechniqueCard` already uses for its own select-vs-favorite split, its
 * own `stopPropagation` keeping a heart tap from also toggling this
 * card's expand state.
 *
 * Every technique shown here is, by definition, currently favorited (the
 * list is built directly from `favoriteTechniqueIds`), so the heart is
 * always rendered filled — tapping it only ever unfavorites, mirroring
 * `TechniqueCard`'s own heart as a real, independent tap target.
 */
export function PracticeCard({ technique, onUnfavorite }: PracticeCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="focus-ring pressable sheen sheen-filter-active flex w-full flex-col gap-3 rounded-[16px] border border-solid border-[#eddde6] bg-[#fdfcfd] p-4 text-left"
      >
        <p className="pr-8 font-sans text-[15px] font-medium text-[#787d89]">
          {technique.tag} • {technique.durationMinutes} min
        </p>
        <div className="flex flex-col gap-2">
          <p className="font-sans text-base font-medium text-ink">{technique.label}</p>
          {expanded && <p className="font-sans text-base text-[#494e59]">{technique.instructions}</p>}
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onUnfavorite()
        }}
        aria-label={`Remove ${technique.label} from Practices`}
        className="focus-ring pressable absolute top-4 right-4 flex size-6 items-center justify-center"
      >
        <Heart size={24} weight="fill" className="text-warm" />
      </button>
    </div>
  )
}
