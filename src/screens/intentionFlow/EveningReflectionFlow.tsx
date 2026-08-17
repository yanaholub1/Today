import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretDown, Circle, CircleHalfTilt } from '@phosphor-icons/react'
import { TaskFlowHeader } from '../../components/TaskFlowHeader'
import { GradientActionButton } from '../../components/GradientActionButton'
import { NotesField } from '../../components/NotesField'
import { ReasonPickerSheet } from '../../components/ReasonPickerSheet'
import { FlowSuccessScreen } from '../../components/FlowSuccessScreen'
import { SparkleIllustration } from '../../components/SparkleIllustration'
import { SPHERES } from '../../lib/spheres'
import { REFLECTION_TAGS, reflectionTagLabel } from '../../lib/reflectionTags'
import { useDayLogStore } from '../../lib/dayLogStore'

interface DraftReflection {
  glad: boolean | null
  tagId: string | null
  note: string
}

const THUMB_UNSELECTED = { backgroundColor: '#fef6fa', borderColor: '#fbdfef' }
const THUMB_SELECTED = { backgroundColor: '#fae1e9', borderColor: '#eac3d0' }
const THUMB_SHADOW = 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 4px 4px rgba(255,255,255,0.35)'

/** Filled = brand pink `#f4266e`; unfilled = the same hue at 20% opacity — both verified against node 229:16179. */
const PROGRESS_FILLED = '#f4266e'
const PROGRESS_UNFILLED = 'rgba(244,38,110,0.2)'

/**
 * Evening reflection flow — verified against 217:14333 (single intention,
 * unanswered), 217:14658/217:14777 ("Glad" answered Yes/"Not really"), and
 * 229:16031/229:16179 (the 2-3-intention variant's title suffix and
 * progress bar). Each of today's intentions gets its own card, navigated
 * strictly forward (no back-arrow anywhere in any fetched node — every
 * state shows a plain X, so `exit` is always `'close'` here, unlike the
 * intention/mood flows' back-arrow-after-step-1 pattern).
 *
 * The recap card ("Health" pill + intention text, bordered `#eddde6`,
 * rounded-12) mirrors the mood flow's `EmotionExplanationCard` shape.
 * Review fix (178:9260): the sphere pill itself is now borderless-fill —
 * `border-[#eddde6]` stroke, `text-ink` icon+label, no `bg-` — since it's a
 * read-only recap of an already-saved intention, not live picker UI. It
 * used to share the reason-trigger pill's fixed `#fae1e9`/`#eac3d0`/
 * `#6d0e2d` recipe (see below); that recipe is now scoped to the reason
 * trigger alone.
 *
 * "Glad about how this went?" is now a persisted pill toggle (fixed
 * inline styles above, `h-[48px]` — explicit direct request), matching
 * `FeelBetterSheet`'s own Yes/"Not really" pill recipe otherwise exactly —
 * a real style change from the earlier `ChoiceChip` card-shaped pair. Its
 * icon is Phosphor's `Circle` for "Yes" (`weight="fill"`, a solid disc)
 * and `CircleHalfTilt` for "Not really" (`weight="fill"` — review fix,
 * verified against node 363:11766, was `CircleHalf`'s plain half-filled
 * disc; same swap applied everywhere else this "Not really"/`glad ===
 * false` glyph appears — DayDetailScreen's own outcome row and
 * PatternsScreen.tsx's "How it went" card — each keeping its own existing
 * size, this fix only swaps the glyph), and both share the same 2-color
 * pair regardless of
 * which option — unselected `#353d4f`, selected `#6d0e2d` (the latter
 * already an established app color, reused verbatim). The surrounding
 * pill's own colors/shadow (`THUMB_UNSELECTED`/`THUMB_SELECTED`/
 * `THUMB_SHADOW` above) and the label text's own color are unrelated to
 * this fix and unchanged. The
 * reason picker is a dropdown-style trigger that opens `ReasonPickerSheet`
 * (a bottom sheet reusing `SpherePicker`'s exact pill treatment minus the
 * icon). Once a reason is picked, the trigger shows it as a real pill
 * (not plain text) — verified against node 178:9046: the trigger's own
 * padding becomes asymmetric (`pl-1`/4px, `pr-4`/16px — tight on the pill
 * side, roomier before the caret), fixed height 54px, and the pill itself
 * is a fixed 44px-tall `#fae1e9`/`#eac3d0`/`#6d0e2d` chip — still live
 * picker UI, so it keeps this fixed recipe even after the sphere recap
 * pill above moved to a borderless-stroke style (178:9260 only covers the
 * recap card, not this trigger); not `SpherePicker`'s dark `sphere-selected`
 * hue (that was an earlier, incorrect guess at "the same pill style").
 * Review fix: an intervening
 * multi-select pass (up to 3 reasons, wrapped pills, `min-h-12`) has been
 * reverted back to this original single-select shape — see
 * `ReasonPickerSheet`'s own doc comment. Notes uses `NotesField`
 * (type-or-record, same as the mood flow) instead of a plain `TextInput`.
 *
 * For 2-3 intentions: the header title gains a smaller, lighter "N of M"
 * suffix (verified against 229:16031 — same serif family, just smaller/
 * lighter, not switched to sans), and a segmented progress bar appears
 * above the button (verified against 229:16179) — one segment per
 * intention, filled brand pink for cards already passed (`i < cardIndex`),
 * pale for the current and remaining ones. The button reads "Continue"
 * until the last card, where it reads "Complete" — matches all 3 single-
 * card nodes (which are simultaneously first AND last, hence always
 * showing "Complete") plus 229:16179's own "Continue" example.
 *
 * Completing the last card no longer navigates straight back to
 * `/checkin` — it submits, then shows `FlowSuccessScreen` ("For today,
 * this is enough" / sparkle illustration), the same end-of-flow template
 * `MorningIntentionFlow` uses for its own "Your intention is set" screen,
 * explicit direct request. `showSuccess` is separate local state, not a
 * URL/step param, since nothing else in this flow needs to navigate back
 * into it.
 */
export function EveningReflectionFlow() {
  const navigate = useNavigate()
  const { intentions, submitEveningReflections } = useDayLogStore()

  const [cardIndex, setCardIndex] = useState(0)
  const [drafts, setDrafts] = useState<DraftReflection[]>(() => intentions.map(() => ({ glad: null, tagId: null, note: '' })))
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const intention = intentions[cardIndex]
  const draft = drafts[cardIndex]
  const isLastCard = cardIndex === intentions.length - 1

  if (showSuccess) {
    return (
      <FlowSuccessScreen
        icon={<SparkleIllustration />}
        title="For today, this is enough"
        subtitle="Some things may become clearer with time. Let the day be as it was."
        onClose={() => navigate('/checkin')}
        onDone={() => navigate('/checkin')}
      />
    )
  }

  if (!intention || !draft) return null // guarded by IntentionFlowScreen's gating — shouldn't render with no intentions

  const updateDraft = (patch: Partial<DraftReflection>) => setDrafts((prev) => prev.map((d, i) => (i === cardIndex ? { ...d, ...patch } : d)))

  const canProceed = draft.glad !== null && draft.tagId !== null

  const handleAction = () => {
    if (!isLastCard) {
      setCardIndex((i) => i + 1)
      return
    }
    submitEveningReflections(
      intentions.map((intentionRecord, i) => ({
        intentionId: intentionRecord.id,
        glad: drafts[i].glad!,
        tag: drafts[i].tagId!,
        note: drafts[i].note,
      })),
    )
    setShowSuccess(true)
  }

  const sphere = SPHERES[intention.sphere]
  const SphereIcon = sphere.icon
  const reasonTitle = draft.glad ? 'What helped?' : 'What got in the way?'
  const selectedTag = draft.tagId ? REFLECTION_TAGS.find((t) => t.id === draft.tagId) : null

  return (
    <>
      <TaskFlowHeader
        title={
          intentions.length > 1 ? (
            <>
              Today's reflection <span className="text-[15px] text-ink/70">{cardIndex + 1} of {intentions.length}</span>
            </>
          ) : (
            "Today's reflection"
          )
        }
        exit="close"
        onExit={() => navigate('/checkin')}
      />
      {/* pb-[max(32px,env(safe-area-inset-bottom))]: review fix, same class of bug as RegistrationScreen/FlowSuccessScreen — old flat pb-8 predates viewport-fit=cover going global; max() keeps the original 32px as the floor on non-notched devices. */}
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-3">
          <p className="font-sans text-base font-medium text-ink">Glad about how this went?</p>
          <div className="flex w-full flex-col gap-2 rounded-[12px] border border-solid border-[#eddde6] p-3">
            <span className="inline-flex w-fit items-center gap-1 rounded-[40px] border border-solid border-[#eddde6] py-0.5 pr-2 pl-1.5">
              <SphereIcon size={13} weight="fill" className="text-ink" />
              <span className="font-sans text-[13px] leading-[1.2] font-medium text-ink">{sphere.label}</span>
            </span>
            <p className="font-sans text-base leading-[1.5] text-ink">{intention.text}</p>
          </div>
        </div>

        <div className="mt-5 flex w-full gap-2">
          <button
            type="button"
            aria-pressed={draft.glad === true}
            onClick={() => updateDraft({ glad: true, tagId: null })}
            className="focus-ring pressable flex h-[48px] flex-1 items-center justify-center gap-2 rounded-pill border border-solid pr-3.5 pl-3"
            style={{ ...(draft.glad === true ? THUMB_SELECTED : THUMB_UNSELECTED), boxShadow: THUMB_SHADOW }}
          >
            <Circle size={20} weight="fill" style={{ color: draft.glad === true ? '#6d0e2d' : '#353d4f' }} />
            <span className="font-sans text-base font-medium" style={{ color: draft.glad === true ? '#6d0e2d' : '#2f374a' }}>
              Yes
            </span>
          </button>
          <button
            type="button"
            aria-pressed={draft.glad === false}
            onClick={() => updateDraft({ glad: false, tagId: null })}
            className="focus-ring pressable flex h-[48px] flex-1 items-center justify-center gap-2 rounded-pill border border-solid pr-3.5 pl-3"
            style={{ ...(draft.glad === false ? THUMB_SELECTED : THUMB_UNSELECTED), boxShadow: THUMB_SHADOW }}
          >
            <CircleHalfTilt size={20} weight="fill" style={{ color: draft.glad === false ? '#6d0e2d' : '#353d4f' }} />
            <span className="font-sans text-base font-medium" style={{ color: draft.glad === false ? '#6d0e2d' : '#2f374a' }}>
              Not really
            </span>
          </button>
        </div>

        {draft.glad !== null && (
          <div className="mt-6 flex flex-col gap-3">
            <p className="font-sans text-base font-medium text-ink">{reasonTitle}</p>
            <button
              type="button"
              onClick={() => setReasonSheetOpen(true)}
              className="focus-ring pressable flex h-14 w-full shrink-0 items-center justify-between rounded-pill border border-solid border-[#6d6b7c]/60 pr-4 pl-1"
            >
              {selectedTag ? (
                <span
                  className="flex h-12 items-center justify-center rounded-pill border border-solid border-[#eac3d0] bg-[#fae1e9] pr-3.5 pl-2.5"
                  style={{ boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 3px 3px rgba(255,255,255,0.4)' }}
                >
                  <span className="font-sans text-base font-medium whitespace-nowrap text-[#6d0e2d]">{reflectionTagLabel(selectedTag, draft.glad)}</span>
                </span>
              ) : (
                <span className="pl-3 font-sans text-base text-ink/70">Choose from options</span>
              )}
              <CaretDown size={20} className="shrink-0 text-ink" />
            </button>
          </div>
        )}

        {draft.glad !== null && <NotesField value={draft.note} onChange={(value) => updateDraft({ note: value })} className="mt-6" />}

        <div className="flex-1" />
        <div className="flex flex-col gap-2">
          {intentions.length > 1 && (
            <div className="flex h-1 w-full gap-1" aria-label={`Intention ${cardIndex + 1} of ${intentions.length}`}>
              {intentions.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-pill" style={{ backgroundColor: i < cardIndex ? PROGRESS_FILLED : PROGRESS_UNFILLED }} />
              ))}
            </div>
          )}
          <GradientActionButton disabled={!canProceed} onClick={handleAction}>
            {isLastCard ? 'Complete' : 'Continue'}
          </GradientActionButton>
        </div>
      </div>

      {draft.glad !== null && (
        <ReasonPickerSheet
          open={reasonSheetOpen}
          title={reasonTitle}
          tags={REFLECTION_TAGS}
          glad={draft.glad}
          value={draft.tagId}
          onSelect={(tagId) => {
            updateDraft({ tagId })
            setReasonSheetOpen(false)
          }}
          onDismiss={() => setReasonSheetOpen(false)}
        />
      )}
    </>
  )
}
