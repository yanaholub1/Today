import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Circle, Clock, Heart, PencilSimple, X } from '@phosphor-icons/react'
import { PillSubtabSwitcher } from '../components/PillSubtabSwitcher'
import { IconTapTarget } from '../components/IconTapTarget'
import { NotGladIcon } from '../components/NotGladIcon'
import { MoodEmptyIllustration } from '../components/MoodEmptyIllustration'
import { IntentionEmptyIllustration } from '../components/IntentionEmptyIllustration'
import { MoodQuadrantBadge } from '../components/MoodQuadrantBadge'
import { SPHERES, ENERGY_LEVEL_ICON, ENERGY_LEVEL_COLOR } from '../lib/spheres'
import type { EnergyLevel } from '../lib/spheres'
import { REFLECTION_TAGS, reflectionTagLabel } from '../lib/reflectionTags'
import { TECHNIQUES } from '../lib/moodTechniques'
import type { IntentionRecord, MoodCheckInRecord } from '../lib/dayLogStore'
import { cn } from '../lib/cn'

/**
 * Router-state payload this screen expects (`navigate('/day', { state })`)
 * — data comes from whichever card was tapped (today's real store data,
 * or a Journal history card's mock data), not a URL-param lookup: both
 * entry points already have the full day's data in hand at the point
 * they render their own card, so handing it over directly is simpler and
 * lower-risk than adding a shared by-date mock lookup just for this.
 */
export interface DayDetailNavState {
  date: string // ISO
  energy: EnergyLevel | null
  /** When the energy level was logged — the small clock-badge time (335:2635). Optional: not every mock day needs one. */
  energyTime: string | null
  intentions: IntentionRecord[]
  moodCheckIns: MoodCheckInRecord[]
}

type DetailSubtab = 'intention' | 'mood'
const SUBTABS: { id: DetailSubtab; label: string }[] = [
  { id: 'intention', label: 'Intention' },
  { id: 'mood', label: 'Mood' },
]

// Review — reasons here render as plain right-aligned TEXT joined by " • ",
// not `ChoiceChip`-style pills: both fetched nodes (335:2613/335:2727) show
// this unambiguously (a `<p>` with `text-ellipsis`, no chip background/
// border anywhere on it). The task's own brief assumed chips; the actual
// Figma export doesn't use them here, so the export wins per the task's
// own "confirm from the nodes rather than assuming" instruction.

/**
 * One intention's stacked/overlapping card pair (335:2661/335:2727) — a
 * "recap" card (sphere pill + intention text) with a NEGATIVE bottom
 * margin pulling the "outcome" card below it up by 12px, so the two read
 * as one continuous unit with a visible seam. The outcome card's own
 * `pt-[24px]` (vs. its `pb-[12px]`) is what keeps its real content
 * clear of that 12px overlap — not a mistake to "fix" into symmetric
 * padding.
 *
 * Review fix: reverted back to a single reflection tag per intention
 * (Stage 4a's original shape) — an intervening multi-tag pass (up to 3,
 * with "+N" overflow badges and a tap-to-expand second row) has been
 * undone entirely; a single tag never needs to hide or expand, so the
 * whole card is a static, non-interactive `<div>` again.
 *
 * Re-verified against 335:2661's own node data: the outcome card is
 * `px-[12px]` (equal left/right, not the old badge-era asymmetric
 * `pr`/`pl`), with the signal (icon+label) and reason sitting in one
 * `gap-[40px]` row — neither sub-frame carries its own horizontal
 * padding, so the 12px inset on both edges comes from the shared
 * container alone. The reason frame itself really does have 0px padding,
 * exactly as specced.
 */
function IntentionDetailCard({ intention }: { intention: IntentionRecord }) {
  const sphere = SPHERES[intention.sphere]
  const SphereIcon = sphere.icon

  const hasOutcome = intention.glad !== null
  const tagPair = intention.tag ? REFLECTION_TAGS.find((t) => t.id === intention.tag) : undefined
  const reason = tagPair ? reflectionTagLabel(tagPair, intention.glad === true) : null

  const OutcomeIcon = intention.glad ? Circle : NotGladIcon // review fix — was CircleHalf, then Phosphor's real CircleHalfTilt (also wrong), see EveningReflectionFlow.tsx's own doc comment (node 367:2465)
  const outcomeLabel = intention.glad ? 'Went well' : 'Not really'

  return (
    <div className="isolate flex w-full flex-col items-start pb-3">
      <div className="z-[2] mb-[-12px] flex w-full flex-col items-start gap-2 rounded-[12px] border border-solid border-[#eddde6] bg-[#fffafc] p-3">
        <span className="flex items-center gap-1 rounded-[40px] border border-solid border-[#eddde6] py-0.5 pr-2 pl-1.5">
          <SphereIcon size={13} weight="fill" className="text-ink" />
          <span className="font-sans text-[13px] leading-[1.2] font-medium text-ink">{sphere.label}</span>
        </span>
        <p className="w-full font-sans text-base leading-[1.5] text-ink">{intention.text}</p>
      </div>

      {hasOutcome && (
        <div className="z-[1] flex w-full items-center gap-10 rounded-b-[12px] border border-solid border-[#eddde6] bg-white px-3 pt-6 pb-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <OutcomeIcon size={12} weight="fill" className="text-ink" />
            <span className="font-sans text-sm font-medium tracking-[-0.14px] whitespace-nowrap text-ink">{outcomeLabel}</span>
          </div>
          {reason && (
            <div className="min-w-0 flex-1">
              <span className="block overflow-hidden text-right font-sans text-[13px] font-medium text-ellipsis whitespace-nowrap text-[#717683]">{reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * One mood check-in row (340:3793) — icon+emotion+time always render; the
 * technique summary and note are each independently conditional, matching
 * this node's own metadata: every row's "note" frame exists twice in the
 * source, once real and once `hidden="true"` as a leftover toggle-off
 * copy, confirming notes are opt-in per check-in rather than a fixed
 * template with an empty state. Same reasoning for the technique card —
 * only the one example row that actually used a technique renders it.
 *
 * The technique card reuses `TechniqueCard.tsx`'s own unselected recipe
 * (`#fdfcfd` fill, `#eddde6` border) via the `.sheen-filter-active`
 * utility instead of hand-copying that inline box-shadow a second time —
 * confirmed byte-identical to this node's own technique-card shadow.
 * Its heart icon is a read-only "liked" indicator (not `TechniqueCard`'s
 * own interactive heart-toggle control), reusing that component's own
 * `text-warm` fill for the true state — filled when liked, gray outline
 * otherwise. The node also shows a green CheckCircle ("better") icon next
 * to it, but explicit direct feedback dropped it: the card already only
 * ever shows a technique that was actually tried, so a checkmark implying
 * "completed" was redundant with the card's own presence — `better` is
 * still tracked on the record, just no longer rendered here.
 *
 * Tapping the card toggles its `instructions` paragraph open/closed —
 * explicit direct request to mirror `TechniqueCard`'s own selected-state
 * accordion reveal (its description only renders `{selected && ...}`).
 * Reuses that same description text style (`text-[#494e59]`) but NOT its
 * selected-state background/border swap — this card isn't a live
 * selection, just a past record being expanded for more detail, so the
 * `#fdfcfd`/`#eddde6` resting look stays constant regardless of expanded
 * state.
 *
 * Emotion icon is `MoodQuadrantBadge` (already built for the Mood Tracker
 * card, Fix 8/9/11) — reused as-is rather than a bare `Icon`: this node's
 * own raw SVG export confirms the circular pale fill + thin border + inner
 * shadow around the glyph (`#ECF3FD`/`#DAE7FC` for the low-unpleasant/
 * CloudLightning example, byte-matching `MOOD_QUADRANTS`' existing fill/
 * textColor), not a flat colored glyph on its own.
 *
 * Review — the note-card's node data shows TWO different specimens: one
 * plain (full text, no truncation) and one with a "Show more" link plus a
 * bottom gradient fade over identical placeholder text. Nothing in this
 * task's own brief asks for a truncate/expand interaction (only conditional
 * presence), and this whole detail view has otherwise deliberately stayed
 * free of expand/collapse machinery (see `IntentionDetailCard`'s own
 * note) — so notes render in full here, not truncated. The pencil "Edit"
 * glyph is kept for visual fidelity but isn't wired to anything; this is a
 * read-only recap screen and editing a past check-in's note was never
 * asked for.
 */
function MoodCheckInDetailCard({ checkIn, isFirst, isLast }: { checkIn: MoodCheckInRecord; isFirst: boolean; isLast: boolean }) {
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const technique = checkIn.technique ? TECHNIQUES.find((t) => t.id === checkIn.technique) : undefined
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(checkIn.createdAt))

  return (
    // pt-0 on the first row (review fix, was a uniform py-4): the "Mood check-ins" title's own gap-3 (12px, on the wrapper below) already provides the title-to-first-row gap on its own — this row's own pt-4 used to stack on top of that, making the real gap 28px instead of the intended 12px. Every other row keeps pt-4, and pb-4 is unchanged on all rows (including this one) — only the first row's own TOP padding changes.
    <div className={cn('flex w-full flex-col gap-3 pb-4', isFirst ? 'pt-0' : 'pt-4', !isLast && 'border-b border-solid border-[#eddde6]')}>
      <div className="flex w-full items-start gap-3 px-1">
        <div className="flex flex-1 items-center gap-2">
          <MoodQuadrantBadge quadrant={checkIn.quadrant} size={20} />
          <p className="font-sans text-base font-medium tracking-[-0.16px] whitespace-nowrap text-ink">{checkIn.emotion}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-[8px] px-2">
          <Clock size={14} weight="regular" className="text-[#787d89]" />
          <p className="font-sans text-sm font-medium tracking-[-0.14px] whitespace-nowrap text-[#787d89]">{time}</p>
        </div>
      </div>

      {technique && (
        <button
          type="button"
          aria-expanded={instructionsOpen}
          onClick={() => setInstructionsOpen((v) => !v)}
          className="focus-ring pressable sheen sheen-filter-active relative flex w-full flex-col gap-3 rounded-[16px] border border-solid border-[#eddde6] bg-[#fdfcfd] p-4 text-left"
        >
          <div className="flex w-full items-center justify-between gap-2 pr-8">
            <p className="font-sans text-[15px] font-medium whitespace-nowrap text-[#787d89]">
              {technique.tag} • {technique.durationMinutes} min
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-sans text-base font-semibold text-ink">{technique.label}</p>
            {instructionsOpen && <p className="font-sans text-base text-[#494e59]">{technique.instructions}</p>}
          </div>
          <Heart size={24} weight={checkIn.liked ? 'fill' : 'regular'} className={checkIn.liked ? 'absolute top-2 right-2 text-warm' : 'absolute top-2 right-2 text-[#787d89]'} />
        </button>
      )}

      {checkIn.note && (
        <div className="relative flex w-full items-start gap-2 rounded-[16px] border border-solid border-[#eddde6] py-3 pr-10 pl-3">
          <p className="flex-1 font-sans text-base leading-[1.5] text-ink">{checkIn.note}</p>
          <PencilSimple size={20} weight="regular" aria-hidden="true" className="absolute top-3 right-3 text-[#787d89]" />
        </div>
      )}
    </div>
  )
}

/**
 * Day detail view (335:2613) — opened by tapping the Today card
 * (CheckInScreen) or any Journal history card (EntriesScreen), both
 * navigating to `/day` with a `DayDetailNavState` (see that type's own
 * doc comment for why router state, not a by-date lookup).
 *
 * The Intention/Mood pill switcher (reusing `PillSubtabSwitcher` as-is —
 * its `pill-switch-active` hue already byte-matches this node's own
 * `#faebf3`/`#e9cedd`/`#eb0056`, confirmed against index.css's existing
 * tokens, zero new styling needed) is real chrome in the fetched node.
 * "Mood" now has a real spec too (340:3793) — see `MoodCheckInDetailCard`'s
 * own doc comment for its fields and conditional sections.
 *
 * Header is a bespoke gradient hero (`from-[#fefafd]`/`to-[#fff5fa]`,
 * matching the node's own gradient stops) — NOT `TaskFlowHeader` itself
 * (that's a flat white bar; this screen's is a gradient, with the pill
 * switcher living in the separate white panel below it), but the title
 * row now reuses that component's own layout/spacing exactly: review fix,
 * the X used to sit on its own row below the title, next to the pill
 * switcher (matching this node's own original layout) — explicit direct
 * correction, moved into the title's own row instead (title `flex-1` on
 * the left, X pushed to the far right, same pattern `TaskFlowHeader`
 * itself uses) so this screen's exit affordance lines up with every other
 * flow screen's. Top padding is now `pt-[max(16px,env(safe-area-inset-
 * top))]` (was a bespoke `pt-[58px]`) — same value `TaskFlowHeader` uses —
 * so the title/X start at the same vertical position on this screen as on
 * "Set today's intention"/"Mood check-in".
 *
 * Review fix: this block's own bottom padding (was `pb-[51px]`) and the
 * white panel's `-mt-5` overlap below it are both gone — those two values
 * only ever existed to cancel each other out visually (the panel's own
 * `z-[1]` painted over whatever padding the negative margin didn't
 * cover), leaving a real 31px gap of visible gradient between the title
 * row and the white panel with no way to control it directly. Bottom
 * padding is now `pb-3` (12px, review fix again — briefly 0, now this
 * explicit direct request) — a real, visible 12px strip of gradient
 * between the title row and the white panel's own flat top edge, not
 * cancelled by any negative margin on the panel below.
 */
export function DayDetailScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [subtab, setSubtab] = useState<DetailSubtab>('intention')

  const state = location.state as DayDetailNavState | null
  if (!state) {
    navigate('/checkin', { replace: true })
    return null
  }

  const date = new Date(state.date)
  const isToday = new Date().toDateString() === date.toDateString()
  // No node covers the history-day title — own UX call, not pulled from Figma.
  const title = isToday ? "Today's check-ins" : `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)} check-ins`
  const EnergyIcon = state.energy ? ENERGY_LEVEL_ICON[state.energy] : null
  const energyLabel = state.energy ? state.energy[0].toUpperCase() + state.energy.slice(1) : null
  const energyTime = state.energyTime ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(state.energyTime)) : null

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div
        className="flex w-full items-center gap-3 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-3"
        style={{ background: 'linear-gradient(180deg, #fefafd 16.34%, #fff5fa 90.024%)', boxShadow: '0px 4px 5px rgba(247,189,221,0.18)' }}
      >
        <h1 className="flex-1 font-serif text-xl tracking-[-0.2px] text-ink">{title}</h1>
        <IconTapTarget icon={X} aria-label="Close" onClick={() => navigate(-1)} />
      </div>

      <div className="relative z-[1] flex flex-1 flex-col items-start rounded-t-[20px] border-t border-solid border-[#fdebe2] bg-white">
        <div className="flex w-full items-center px-5 pt-4">
          <PillSubtabSwitcher items={SUBTABS} activeId={subtab} onChange={setSubtab} />
        </div>

        {subtab === 'intention' ? (
          <>
            {state.energy && (
              <div className="flex w-full flex-col gap-3 px-5 pt-6">
                <p className="font-sans text-base font-semibold text-ink">Energy level</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {EnergyIcon && <EnergyIcon size={20} weight="fill" color={ENERGY_LEVEL_COLOR} />}
                    <p className="font-sans text-base font-medium tracking-[-0.16px] text-ink">{energyLabel}</p>
                  </div>
                  {energyTime && (
                    <div className="flex items-center gap-1.5 rounded-[8px] px-2">
                      <Clock size={14} weight="regular" className="text-[#787d89]" />
                      <p className="font-sans text-sm font-medium tracking-[-0.14px] text-[#787d89]">{energyTime}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex w-full flex-col gap-3 px-5 pt-5 pb-6">
              <p className="font-sans text-base font-semibold text-ink">Intentions</p>
              {state.intentions.length > 0 ? (
                <div className="flex w-full flex-col gap-2">
                  {state.intentions.map((intention) => (
                    <IntentionDetailCard key={intention.id} intention={intention} />
                  ))}
                </div>
              ) : (
                // Review fix: was a single plain text line ("No intentions
                // set.") — now the same icon+title+subtitle empty-state
                // recipe the Mood subtab's own empty state already uses
                // (DaySummaryCard's shape, scaled down for an in-tab
                // section), for a consistent empty state across both
                // subtabs. Explicit direct request, `IntentionEmptyState.png`.
                <div className="flex w-full flex-col items-center gap-2 py-10 text-center">
                  <IntentionEmptyIllustration className="size-10 object-contain" />
                  <p className="font-sans text-base font-medium text-ink">No intentions set</p>
                  <p className="font-sans text-sm text-ink/60">Nothing logged for this day.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3 px-5 pt-6 pb-6">
            <p className="font-sans text-base font-semibold text-ink">Mood check-ins</p>
            {state.moodCheckIns.length > 0 ? (
              <div className="flex w-full flex-col items-start">
                {state.moodCheckIns.map((checkIn, index) => (
                  <MoodCheckInDetailCard key={checkIn.id} checkIn={checkIn} isFirst={index === 0} isLast={index === state.moodCheckIns.length - 1} />
                ))}
              </div>
            ) : (
              // Fix 17's own empty-state recipe (DaySummaryCard: centered
              // icon + title + subtitle) scaled down for an in-tab section
              // rather than a full dashed-border card — no node shows this
              // state for THIS view, so it's inferred, not Figma-verified.
              // Review fix: icon is now the real exported `MoodEmptyState.png`
              // (was a plain Phosphor `MoonStars` glyph) — explicit direct
              // request, same real-artwork treatment `NotesEmptyIllustration`/
              // `PracticesEmptyIllustration` already use elsewhere.
              <div className="flex w-full flex-col items-center gap-2 py-10 text-center">
                <MoodEmptyIllustration className="size-10 object-contain" />
                <p className="font-sans text-base font-medium text-ink">No mood check-ins yet</p>
                <p className="font-sans text-sm text-ink/60">Nothing logged for this day.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
