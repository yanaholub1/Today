import { Heart } from '@phosphor-icons/react'

export interface TechniqueCardProps {
  tag: string
  durationMinutes: number
  label: string
  description: string
  selected: boolean
  onClick: () => void
  hearted: boolean
  onHeartToggle: () => void
}

/**
 * Technique suggestion card — verified against node 111:5610 (unselected)
 * and 111:5677 (selected), both re-confirmed on the "Recommended
 * practices" screen (217:15546). The two states aren't just a color swap:
 * only the SELECTED card renders the technique's description paragraph
 * beneath its title — an accordion-style reveal on select, not a fixed
 * layout with hidden text.
 *
 * The heart (top-right) is a real, independent tap target — explicit
 * direct request: tapping it toggles `hearted` without selecting the card.
 * Review fix: now wired all the way to the shared store's
 * `favoriteTechniqueIds` by its only caller (MoodFlowScreen) — favoriting
 * a technique here makes it show up in the home screen's Practices subtab
 * (no Figma node for that subtab yet; see PracticeCard.tsx). It can't be a
 * nested `<button>` inside the card's own selecting `<button>` (invalid
 * HTML), so it's a sibling `<button>` absolutely positioned over the same
 * corner, inside a shared `relative` wrapper — its own `stopPropagation`
 * keeps a heart tap from also toggling card selection underneath it.
 * Filled ink-pink when hearted, outline gray otherwise; neither state is
 * specified by any node (both fetched examples show only the plain
 * outline), so this fill treatment is inferred, not verified.
 */
export function TechniqueCard({ tag, durationMinutes, label, description, selected, onClick, hearted, onHeartToggle }: TechniqueCardProps) {
  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className="focus-ring flex w-full flex-col items-start gap-3 rounded-[16px] border border-solid p-4 text-left"
        style={{
          backgroundColor: selected ? '#fef5f9' : '#fdfcfd',
          borderColor: selected ? '#f7d4e2' : '#eddde6',
          boxShadow: selected
            ? 'inset 2px 0 40px rgba(255,255,255,0.3), inset -2px 0 40px rgba(255,255,255,0.3), inset 0 -2px 5px rgba(170,143,158,0.16), inset 0 8px 2px rgba(255,255,255,0.44)'
            : 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 4px 4px rgba(255,255,255,0.35)',
        }}
      >
        <div className="flex w-full items-center justify-between">
          <p className="font-sans text-[15px] font-medium text-[#787d89]">
            {tag} • {durationMinutes} min
          </p>
          <span className="size-6 shrink-0" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-sans text-base font-medium text-ink">{label}</p>
          {selected && <p className="font-sans text-base text-[#494e59]">{description}</p>}
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onHeartToggle()
        }}
        aria-pressed={hearted}
        aria-label={hearted ? `Remove ${label} from Practices` : `Save ${label} to Practices`}
        className="focus-ring absolute top-4 right-4 flex size-6 items-center justify-center"
      >
        <Heart size={24} weight={hearted ? 'fill' : 'regular'} className={hearted ? 'text-warm' : 'text-[#787d89]'} />
      </button>
    </div>
  )
}
