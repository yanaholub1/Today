import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { TaskFlowHeader } from '../components/TaskFlowHeader'
import { IconTapTarget } from '../components/IconTapTarget'
import { MoodCategorySelector } from '../components/MoodCategorySelector'
import { SegmentedFilterPill } from '../components/SegmentedFilterPill'
import type { SegmentedFilterPillItem } from '../components/SegmentedFilterPill'
import { EmotionGrid } from '../components/EmotionGrid'
import type { EmotionGridItem } from '../components/EmotionGrid'
import { EmotionExplanationCard } from '../components/EmotionExplanationCard'
import { NotesField } from '../components/NotesField'
import { IntensitySlider } from '../components/IntensitySlider'
import { TechniqueCard } from '../components/TechniqueCard'
import { GradientActionButton } from '../components/GradientActionButton'
import { FeelBetterSheet } from '../components/FeelBetterSheet'
import { FlowSuccessScreen } from '../components/FlowSuccessScreen'
import { CheckFatIllustration } from '../components/CheckFatIllustration'
import { MOOD_QUADRANTS } from '../lib/moodCategories'
import type { MoodQuadrantId } from '../lib/moodCategories'
import { QUADRANT_EMOTIONS, ALL_EMOTIONS, techniquesForQuadrant } from '../lib/moodTechniques'
import { useDayLogStore } from '../lib/dayLogStore'

const STEP_ORDER = ['quadrant', 'emotion', 'intensity', 'technique', 'success'] as const
type MoodStep = (typeof STEP_ORDER)[number]

const QUADRANT_FILTER_ITEMS: SegmentedFilterPillItem[] = MOOD_QUADRANTS.map((q) => ({
  id: q.id,
  icon: q.icon,
  label: `${q.lines[0]}, ${q.lines[1]}`,
  selected: { fill: q.fill, border: q.border, boxShadow: q.boxShadow, iconColor: q.textColor },
}))

const STEP_TITLE: Record<MoodStep, string> = {
  quadrant: 'Check in on your mood',
  emotion: 'Which emotion fits best?',
  intensity: 'How intense is it?',
  technique: 'Recommended practices',
  success: '',
}

/** Nearest of the slider's 5 label anchors (0/25/50/75/100 → 1-5), matching IntensitySlider's own internal `nearestLabelIndex` for `segments={5}`. */
function intensityFromSliderValue(value: number): number {
  return Math.min(4, Math.max(0, Math.round(value / 25))) + 1
}

/**
 * Mood check-in flow — a 5-screen wizard: quadrant → emotion → intensity
 * (+ notes) → technique ("Recommended practices") → success, tracked as a
 * single `stepIndex` into STEP_ORDER (not a step stack) since the search
 * shortcut needs to jump forward by more than one step at once.
 *
 * The quadrant screen (node 109:3033 for the grid, 109:3060 for the search
 * block below it): `MoodCategorySelector`'s 2x2 grid, then a divider row
 * ("Or") and a bordered search field. Picking a search result sets
 * quadrant+emotion together and jumps straight to the emotion screen.
 *
 * The emotion screen: `SegmentedFilterPill` (wired to the 4 quadrants) +
 * "See all" ghost button flattens `EmotionGrid` to all 32 emotions; the
 * header's trailing MagnifyingGlass opens a dedicated search bar in the
 * body (distinct from the quadrant screen's shortcut — this one stays on
 * this step). Once an emotion is picked, `EmotionExplanationCard`
 * (verified against 217:15353) appears directly above the Continue button
 * inside its own `gap-4` (16px) wrapper — explicit direct request, kept
 * separate from the screen's own `gap-6` rhythm above it.
 *
 * The intensity screen (title "How intense is it?" — review fix, was
 * "How strong is it?", 217:15068's own verified copy) is now its OWN
 * screen, split back out of the emotion screen
 * per explicit correction — it recaps `EmotionExplanationCard`, then the
 * 5-segment `IntensitySlider`, then `NotesField` (verified against
 * 142:1885), then two CTAs: primary "What might help?" (→ technique
 * screen) and secondary "Complete check-in" (saves directly, no
 * technique). The card→slider gap is `mt-3` (12px), the node's own
 * literal value — review fix: this used to be inflated to `mt-9` (36px)
 * to clear the slider's old floating knob (which overflowed 28px above
 * its own track via absolute positioning), but the redesigned
 * IntensitySlider has no knob anymore, so the literal Figma spacing
 * applies directly again.
 *
 * The technique screen ("Recommended practices", renamed from "Try one of
 * these" — verified against 217:15546) drops the old separate execution
 * screen entirely: `TechniqueCard`'s existing selected-state description
 * reveal already shows the instructions inline, so there's nothing left
 * for a dedicated execution screen to do. Each card's heart now reads from
 * and writes to the shared store's `favoriteTechniqueIds` (review fix, no
 * Figma node — this IS the "add a favorite toggle where the user engages
 * with a technique" entry point) — previously local-only UI state that
 * fed just `liked` on this one check-in; now favoriting here also makes
 * the technique show up in the home screen's Practices subtab, and a
 * technique already favorited from a past check-in correctly shows its
 * heart pre-filled here too, since both read the same store value. Two
 * CTAs: primary "Practice completed" (disabled until a card is selected)
 * opens `FeelBetterSheet`; secondary "Skip practice" saves immediately
 * with no `better` answer.
 *
 * `FeelBetterSheet` (verified against 217:15546's own modal state) is
 * optional — answering Yes/"Not really" or dismissing via the scrim both
 * complete the check-in, only the saved `better` value differs (an answer
 * vs `null`). Either path lands on 'success', now the shared
 * `FlowSuccessScreen` (CheckFat illustration, "You've noticed how you
 * feel" / "Just let it be.") — no longer the earlier placeholder, which
 * predated any of the 3 flows having a confirmed success-state design.
 * Rendered as an early return before `TaskFlowHeader` (same reason the
 * other 2 flows' success screens aren't nested inside their own step
 * switch): it has its own bare top-right X, not that header's title row.
 */
export function MoodFlowScreen() {
  const navigate = useNavigate()
  const { submitMoodCheckIn, favoriteTechniqueIds, toggleFavoriteTechnique } = useDayLogStore()

  const [stepIndex, setStepIndex] = useState(0)
  const step: MoodStep = STEP_ORDER[stepIndex]

  const [quadrant, setQuadrant] = useState<MoodQuadrantId | null>(null)
  const [emotion, setEmotion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllEmotions, setShowAllEmotions] = useState(false)
  const [emotionSearchOpen, setEmotionSearchOpen] = useState(false)
  const [emotionSearchQuery, setEmotionSearchQuery] = useState('')
  const [intensityValue, setIntensityValue] = useState(50)
  const [intensityTouched, setIntensityTouched] = useState(false)
  const [note, setNote] = useState('')
  const [techniqueId, setTechniqueId] = useState<string | null>(null)
  const [feelBetterOpen, setFeelBetterOpen] = useState(false)

  const goBack = () => {
    if (stepIndex === 0 || step === 'success') {
      navigate('/checkin')
      return
    }
    setStepIndex((i) => i - 1)
  }
  const goNext = () => setStepIndex((i) => i + 1)

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const searchResults = trimmedQuery ? ALL_EMOTIONS.filter((e) => e.emotion.toLowerCase().includes(trimmedQuery)) : []

  const handleSearchPick = (result: { emotion: string; quadrant: MoodQuadrantId }) => {
    setQuadrant(result.quadrant)
    setEmotion(result.emotion)
    setSearchQuery('')
    setStepIndex(1) // straight to the emotion screen — bypasses the quadrant grid's own remaining interaction
  }

  const handleQuadrantSwitch = (id: string) => {
    setQuadrant(id as MoodQuadrantId)
    setEmotion(null) // the old emotion may not belong to the newly switched-to quadrant
    setShowAllEmotions(false) // tapping a specific quadrant pill filters back out of the "See all" flat list
  }

  const handleEmotionPick = (item: EmotionGridItem) => {
    setEmotion(item.emotion)
    setQuadrant(item.quadrant)
  }

  const trimmedEmotionQuery = emotionSearchQuery.trim().toLowerCase()
  const emotionSearchResults = trimmedEmotionQuery ? ALL_EMOTIONS.filter((e) => e.emotion.toLowerCase().includes(trimmedEmotionQuery)) : ALL_EMOTIONS

  const handleEmotionSearchPick = (item: EmotionGridItem) => {
    handleEmotionPick(item)
    setEmotionSearchOpen(false)
    setEmotionSearchQuery('')
  }

  const saveCheckIn = (better: boolean | null) => {
    if (!emotion || !quadrant) return
    submitMoodCheckIn({
      emotion,
      quadrant,
      intensity: intensityFromSliderValue(intensityValue),
      technique: techniqueId,
      better,
      liked: techniqueId ? favoriteTechniqueIds.includes(techniqueId) : null,
      note,
    })
    setStepIndex(STEP_ORDER.indexOf('success'))
  }

  const handleFeelBetterAnswer = (better: boolean) => {
    setFeelBetterOpen(false)
    saveCheckIn(better)
  }
  const handleFeelBetterDismiss = () => {
    setFeelBetterOpen(false)
    saveCheckIn(null)
  }

  if (step === 'success') {
    return (
      <FlowSuccessScreen
        icon={<CheckFatIllustration />}
        title="You've noticed how you feel"
        subtitle="Just let it be."
        onClose={() => navigate('/checkin')}
        onDone={() => navigate('/checkin')}
      />
    )
  }

  return (
    <>
      <TaskFlowHeader
        title={STEP_TITLE[step]}
        exit={step === 'quadrant' ? 'close' : 'back'}
        onExit={goBack}
        trailing={
          step === 'emotion' ? (
            <IconTapTarget
              icon={emotionSearchOpen ? X : MagnifyingGlass}
              aria-label={emotionSearchOpen ? 'Close search' : 'Search for an emotion'}
              onClick={() => setEmotionSearchOpen((open) => !open)}
            />
          ) : undefined
        }
      />
      {step === 'emotion' && quadrant ? (
        // Split layout, explicit direct request: the pill row/grid (or search
        // results) scroll in their own bounded region while the explanation
        // card + Continue button stay pinned at the screen's actual bottom,
        // always visible regardless of how long the list above gets (e.g.
        // "See all"'s 32 emotions). `[scrollbar-gutter:stable]` on the
        // scrolling region reserves the scrollbar's width up front so
        // content doesn't shift horizontally the moment it starts needing
        // to scroll.
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4 [scrollbar-gutter:stable]">
            {emotionSearchOpen ? (
              <>
                {/* h-14 (56px), no vertical padding — review fix, was pt-[14px]/pb-[13px] driven, matching every other input field's own fixed-height/zero-padding treatment. border-[#6d6b7c]/60 — review fix, default-state stroke opacity reduced app-wide (same value at both this search field's own instances below). rounded-pill (400px) — review fix, was rounded-[8px]; explicit direct request to match every other input field's own pill radius (TextInput, the Life area dropdown trigger), same value at both instances below, in all states (not just resting). */}
                <div className="focus-ring-field-shape flex h-14 w-full shrink-0 items-center gap-2 rounded-pill border border-solid border-[#6d6b7c]/60 bg-white px-4">
                  <MagnifyingGlass size={24} className="shrink-0 text-ink/70" />
                  <input
                    type="text"
                    value={emotionSearchQuery}
                    onChange={(e) => setEmotionSearchQuery(e.target.value)}
                    placeholder="Search a feeling"
                    className="focus-ring-field w-full rounded-pill bg-transparent font-sans text-base text-ink placeholder:text-ink/70"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {emotionSearchResults.length === 0 && <p className="font-sans text-base text-ink/60">No matching feelings.</p>}
                  {emotionSearchResults.map((result) => (
                    <button
                      key={result.emotion}
                      type="button"
                      onClick={() => handleEmotionSearchPick(result)}
                      className="focus-ring pressable rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left font-sans text-base font-medium text-ink"
                    >
                      {result.emotion}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SegmentedFilterPill
                  items={QUADRANT_FILTER_ITEMS}
                  activeId={quadrant}
                  onActiveChange={handleQuadrantSwitch}
                  onSeeAll={() => setShowAllEmotions(true)}
                  seeAllActive={showAllEmotions}
                />
                <EmotionGrid
                  items={showAllEmotions ? ALL_EMOTIONS : QUADRANT_EMOTIONS[quadrant].map((e) => ({ emotion: e, quadrant }))}
                  value={emotion}
                  onChange={handleEmotionPick}
                />
              </>
            )}
          </div>
          {/* pb-[max(32px,env(safe-area-inset-bottom))]: review fix, same class of bug as RegistrationScreen/FlowSuccessScreen — old flat pb-8 predates viewport-fit=cover going global; max() keeps the original 32px as the floor on non-notched devices. */}
          <div className="flex shrink-0 flex-col gap-4 px-5 pt-4 pb-[max(32px,env(safe-area-inset-bottom))]">
            {emotion && <EmotionExplanationCard emotion={emotion} quadrant={quadrant} />}
            <GradientActionButton disabled={!emotion} onClick={goNext}>
              Continue
            </GradientActionButton>
          </div>
        </div>
      ) : (
        // review fix: pb-[max(32px,env(safe-area-inset-bottom))] below — same bottom-safe-area fix as this file's other branch, this container's own flex-1 spacer pushes each step's button group down to sit flush against this same bottom edge.
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4 pb-[max(32px,env(safe-area-inset-bottom))]">
          {step === 'quadrant' && (
            <>
              <MoodCategorySelector
                onSelect={(id) => {
                  setQuadrant(id)
                  goNext()
                }}
              />
              <div className="flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-[#eddde6]" />
                <p className="font-sans text-base font-medium text-ink/60">Or</p>
                <div className="h-px flex-1 bg-[#eddde6]" />
              </div>
              <div className="focus-ring-field-shape flex h-14 w-full shrink-0 items-center gap-2 rounded-pill border border-solid border-[#6d6b7c]/60 bg-white px-4">
                <MagnifyingGlass size={24} className="shrink-0 text-ink/70" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search a feeling"
                  className="focus-ring-field w-full rounded-pill bg-transparent font-sans text-base text-ink placeholder:text-ink/70"
                />
              </div>
              {trimmedQuery && (
                <div className="flex flex-col gap-2">
                  {searchResults.length === 0 && <p className="font-sans text-base text-ink/60">No matching feelings.</p>}
                  {searchResults.map((result) => (
                    <button
                      key={result.emotion}
                      type="button"
                      onClick={() => handleSearchPick(result)}
                      className="focus-ring pressable rounded-card border border-solid border-neutral-border bg-offwhite px-4 py-3 text-left font-sans text-base font-medium text-ink"
                    >
                      {result.emotion}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

        {step === 'intensity' && emotion && quadrant && (
          <div className="flex w-full flex-1 flex-col">
            <EmotionExplanationCard emotion={emotion} quadrant={quadrant} />
            <IntensitySlider
              value={intensityValue}
              onChange={(value) => {
                setIntensityValue(value)
                setIntensityTouched(true)
              }}
              active
              segments={5}
              ariaLabel="Mood intensity"
              className="mt-3"
            />
            <NotesField value={note} onChange={setNote} className="mt-8" />
            <div className="flex-1" />
            <div className="flex flex-col gap-2">
              <GradientActionButton disabled={!intensityTouched} onClick={goNext}>
                What might help?
              </GradientActionButton>
              <GradientActionButton variant="secondary" disabled={!intensityTouched} onClick={() => saveCheckIn(null)}>
                Complete check-in
              </GradientActionButton>
            </div>
          </div>
        )}

        {step === 'technique' && quadrant && (
          <>
            <div className="flex flex-col gap-3">
              {techniquesForQuadrant(quadrant).map((t) => (
                <TechniqueCard
                  key={t.id}
                  tag={t.tag}
                  durationMinutes={t.durationMinutes}
                  label={t.label}
                  description={t.instructions}
                  selected={techniqueId === t.id}
                  onClick={() => setTechniqueId(t.id)}
                  hearted={favoriteTechniqueIds.includes(t.id)}
                  onHeartToggle={() => toggleFavoriteTechnique(t.id)}
                />
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex flex-col gap-2">
              <GradientActionButton disabled={!techniqueId} onClick={() => setFeelBetterOpen(true)}>
                Practice completed
              </GradientActionButton>
              <GradientActionButton variant="secondary" onClick={() => saveCheckIn(null)}>
                Skip practice
              </GradientActionButton>
            </div>
          </>
        )}

        </div>
      )}

      <FeelBetterSheet open={feelBetterOpen} onAnswer={handleFeelBetterAnswer} onDismiss={handleFeelBetterDismiss} />
    </>
  )
}
