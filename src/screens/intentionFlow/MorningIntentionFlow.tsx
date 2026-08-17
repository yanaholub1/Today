import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretDown, Plus, Trash } from '@phosphor-icons/react'
import { TaskFlowHeader } from '../../components/TaskFlowHeader'
import { GradientActionButton } from '../../components/GradientActionButton'
import { TextInput } from '../../components/TextInput'
import { IntensitySlider } from '../../components/IntensitySlider'
import { LifeAreaPickerSheet } from '../../components/LifeAreaPickerSheet'
import { TargetIllustration } from '../../components/TargetIllustration'
import { FlowSuccessScreen } from '../../components/FlowSuccessScreen'
import { SPHERES } from '../../lib/spheres'
import type { SphereId, EnergyLevel } from '../../lib/spheres'
import { useDayLogStore, MAX_INTENTIONS_PER_DAY } from '../../lib/dayLogStore'
import type { MorningIntentionDraft } from '../../lib/dayLogStore'
import { cn } from '../../lib/cn'

/** Segment-1's own base (unfilled) tint — distinct from segment 2's `PROGRESS_UNFILLED`, both verified against 213:14225/213:14091. */
const PROGRESS_SEG1_BASE = '#f2c0d2'
const PROGRESS_FILLED = '#f4266e'
const PROGRESS_UNFILLED = 'rgba(244,38,110,0.2)'

/** Nearest of the slider's 3 label anchors (0/50/100 — Low/Medium/High), matching IntensitySlider's own internal `nearestLabelIndex` for `segments={3}`. */
function energyFromSliderValue(value: number): EnergyLevel {
  const index = Math.min(2, Math.max(0, Math.round(value / 50)))
  return (['low', 'medium', 'high'] as const)[index]
}

type FlowStep = 'details' | 'energy' | 'success'

/**
 * 2-segment progress bar shared by the 'details'/'energy' steps — verified
 * against 213:14225 (segment 1 at half-fill, nothing saved yet), 178:9207
 * (segment 1 at full fill, once ≥1 intention is saved), and 213:14091
 * (segment 1 full, segment 2 still unfilled, on the energy step). Segment
 * 2 never fills within this flow — it represents the step you're
 * currently ON, matching EveningReflectionFlow's own "only PASSED steps
 * fill" convention; there's no 3rd step after 'energy' to make it fill.
 * Figma's own export rounds each segment's fill with per-corner radii
 * baked in for its one tested frame width — simplified here to a plain
 * `rounded-pill` per segment/fill, visually equivalent at any width.
 */
function IntentionProgressBar({ step, hasSavedIntention }: { step: 'details' | 'energy'; hasSavedIntention: boolean }) {
  const segment1Fill = step === 'energy' || hasSavedIntention ? '100%' : '50%'
  return (
    <div className="flex h-1 w-full gap-1">
      <div className="relative h-1 flex-1 overflow-hidden rounded-pill" style={{ backgroundColor: PROGRESS_SEG1_BASE }}>
        <div className="absolute inset-y-0 left-0 rounded-pill" style={{ width: segment1Fill, backgroundColor: PROGRESS_FILLED }} />
      </div>
      <div className="h-1 flex-1 rounded-pill" style={{ backgroundColor: PROGRESS_UNFILLED }} />
    </div>
  )
}

/**
 * Morning flow — re-verified against 213:14225/178:8794/178:8845/178:8937/
 * 178:9032/178:9207/253:1904 (step 1, "details"), 213:14091 (step 2,
 * "energy"), and 217:14940 (the success screen) — Fix 24, a substantial
 * correction of the earlier single-page/single-intention pass:
 *
 *  - Up to `MAX_INTENTIONS_PER_DAY` (3) intentions again, not 1 — explicit
 *    direct request, reversing that earlier cap. The visible text+area
 *    fields are always the CURRENTLY-being-composed entry; tapping "Add
 *    intention" commits it into `savedIntentions` below (its own
 *    trash-deletable recap card) and resets the fields for the next one.
 *    Review fix (178:9260): that recap card's own sphere pill is now
 *    borderless-fill (`border-[#eddde6]`, `text-ink` icon+label) — it used
 *    to share the dropdown trigger's fixed `#fae1e9`/`#eac3d0`/`#6d0e2d`
 *    pink recipe (still true of the trigger itself, see below), but the
 *    two are scoped separately now: the recap pill is a read-only summary
 *    of an already-saved intention, the trigger is still live picker UI,
 *    and only the former changed here.
 *  - "Save intention" (review fix — was "Add intention") is disabled
 *    (`#cdbfc4` border/ink text) until the current entry has both a
 *    non-empty text AND a chosen area, then switches to its "ready" look
 *    (`#c15178` border/`#a7073e` text) — both states still render at the
 *    Figma export's own `opacity-70`, which isn't an enabled/disabled
 *    signal here, just this button's constant style. Once 3 are saved,
 *    the button is replaced entirely by an amber note (253:1904), not
 *    just disabled.
 *  - "Life area" (review fix — was "Which area does it support?") is no longer `SpherePicker`'s inline
 *    chip grid — it's a dropdown trigger (`LifeAreaPickerSheet`) using the
 *    exact same asymmetric-padding/pill-inside-trigger pattern already
 *    built for EveningReflectionFlow's reason picker, right down to the
 *    fixed `#fae1e9`/`#eac3d0`/`#6d0e2d` pill recipe (`sphere-fixed` hue).
 *  - Energy level is no longer on this same page — it's `step: 'energy'`,
 *    a distinct screen reached via "Continue" (only enabled once at least
 *    one intention has been explicitly ADDED — a deliberately simple,
 *    predictable rule: filling the visible fields alone doesn't silently
 *    count, matching the literal "Add" verb on that button; not directly
 *    confirmed by any single fetched node, flagged as the inferred
 *    choice). "Save" is now "Complete" on this step, matching 213:14091.
 *  - Completing submits everything at once (unchanged mechanism, just
 *    fed the now-plural `savedIntentions`) and moves to `step: 'success'`
 *    (217:14940) rather than navigating straight back to `/checkin` — a
 *    real intermediate screen, not a toast/snackbar. Rendered via the
 *    shared `FlowSuccessScreen` (extracted once `EveningReflectionFlow`
 *    needed the identical template with only its icon/copy swapped) —
 *    its own top-right-only X and no-title layout live there now, not
 *    inline here. No step in this whole flow has a back arrow in any
 *    fetched node — `exit` is always `'close'`.
 *
 * The area dropdown trigger is `h-14` (56px — review fix, was `h-12`/48px,
 * matching every input field app-wide) with no vertical padding —
 * explicit direct correction, replacing the earlier `py-[13px]`-driven
 * height with a fixed one so its content centers via `items-center`
 * rather than via padding. Its own selected-sphere pill is `h-12` (48px —
 * review fix, was `h-[40px]`, matching the same "selected pill inside a
 * dropdown trigger" treatment app-wide) with its own vertical padding
 * dropped for the same reason. Default-state border is
 * `border-[#6d6b7c]/60` (review fix, was fully opaque) — the selected
 * pill's own `#eac3d0` border is a separate, unaffected color.
 */
export function MorningIntentionFlow() {
  const navigate = useNavigate()
  const { submitMorningIntentions } = useDayLogStore()

  const [step, setStep] = useState<FlowStep>('details')
  const [savedIntentions, setSavedIntentions] = useState<MorningIntentionDraft[]>([])
  const [draftText, setDraftText] = useState('')
  const [draftSphere, setDraftSphere] = useState<SphereId | null>(null)
  const [areaSheetOpen, setAreaSheetOpen] = useState(false)
  const [energyValue, setEnergyValue] = useState(50)
  const [energyTouched, setEnergyTouched] = useState(false)

  const draftComplete = draftText.trim().length > 0 && draftSphere !== null
  const atMax = savedIntentions.length >= MAX_INTENTIONS_PER_DAY
  const canAddMore = draftComplete && !atMax
  const canContinue = savedIntentions.length > 0
  const canComplete = energyTouched

  const handleAddIntention = () => {
    if (!canAddMore || !draftSphere) return
    setSavedIntentions((prev) => [...prev, { text: draftText.trim(), sphere: draftSphere }])
    setDraftText('')
    setDraftSphere(null)
  }

  const handleRemoveIntention = (index: number) => {
    setSavedIntentions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    if (!canContinue) return
    setStep('energy')
  }

  const handleComplete = () => {
    if (!canComplete) return
    submitMorningIntentions(savedIntentions, energyFromSliderValue(energyValue))
    setStep('success')
  }

  const selectedSphere = draftSphere ? SPHERES[draftSphere] : null
  const SelectedSphereIcon = selectedSphere?.icon

  if (step === 'success') {
    return (
      <FlowSuccessScreen
        icon={<TargetIllustration />}
        title="Your intention is set"
        subtitle="You've noticed what matters today. That's enough for now."
        onClose={() => navigate('/checkin')}
        onDone={() => navigate('/checkin')}
      />
    )
  }

  if (step === 'energy') {
    return (
      <>
        <TaskFlowHeader title="Set today's intention" exit="close" onExit={() => navigate('/checkin')} />
        {/* pb-[max(32px,env(safe-area-inset-bottom))]: review fix, same class of bug as RegistrationScreen/FlowSuccessScreen — old flat pb-8 predates viewport-fit=cover going global; max() keeps the original 32px as the floor on non-notched devices. */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))]">
          {/*
            gap-4 — the app's usual title-to-content spacing. Review fix:
            was gap-9 (36px) to clear the slider's old floating knob, which
            rendered 28px above its own track regardless of value; the
            redesigned IntensitySlider has no knob (the current value now
            shows via a fill + tall tick fully contained within the track's
            own 57px height), so that extra clearance no longer applies.
          */}
          <div className="flex flex-col gap-4">
            <p className="font-sans text-lg font-medium text-ink">Current energy level</p>
            <IntensitySlider
              value={energyValue}
              onChange={(value) => {
                setEnergyValue(value)
                setEnergyTouched(true)
              }}
              active
              segments={3}
              ariaLabel="Energy level"
            />
          </div>

          <div className="flex-1" />
          <div className="flex flex-col gap-2">
            <IntentionProgressBar step="energy" hasSavedIntention />
            <GradientActionButton disabled={!canComplete} onClick={handleComplete}>
              Complete
            </GradientActionButton>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TaskFlowHeader title="Set today's intention" exit="close" onExit={() => navigate('/checkin')} />
      {/* pb-[max(32px,env(safe-area-inset-bottom))]: review fix, same class of bug as RegistrationScreen/FlowSuccessScreen — old flat pb-8 predates viewport-fit=cover going global; max() keeps the original 32px as the floor on non-notched devices. */}
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-6 pb-[max(32px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="font-sans text-base font-medium text-ink">What matters most today?</p>
              <TextInput value={draftText} onChange={(e) => setDraftText(e.target.value)} placeholder="Type your focus for today" />
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-sans text-base font-medium text-ink">Life area</p>
              <button
                type="button"
                onClick={() => setAreaSheetOpen(true)}
                className={cn(
                  'focus-ring pressable flex h-14 w-full shrink-0 items-center justify-between rounded-pill border border-solid border-[#6d6b7c]/60',
                  selectedSphere ? 'pr-4 pl-1' : 'px-4',
                )}
              >
                {selectedSphere && SelectedSphereIcon ? (
                  <span
                    className="flex h-12 items-center gap-2 rounded-pill border border-solid border-[#eac3d0] bg-[#fae1e9] pr-3.5 pl-2.5"
                    style={{ boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 3px 3px rgba(255,255,255,0.4)' }}
                  >
                    <SelectedSphereIcon size={20} weight="fill" className="text-[#6d0e2d]" />
                    <span className="font-sans text-base font-medium whitespace-nowrap text-[#6d0e2d]">{selectedSphere.label}</span>
                  </span>
                ) : (
                  <span className="font-sans text-base text-ink/70">Choose area</span>
                )}
                <CaretDown size={20} className={cn('shrink-0 text-ink', areaSheetOpen && '-scale-y-100')} />
              </button>
            </div>
          </div>

          {atMax ? (
            <div className="flex w-full flex-col gap-1 rounded-[12px] border border-solid border-[#eee2c9] bg-[#fef9ef] p-3">
              <p className="font-sans text-base font-medium text-[#614405]">You&apos;ve chosen enough for today</p>
              <p className="font-sans text-base text-[#6a6458]">Let these {MAX_INTENTIONS_PER_DAY} intentions have your attention for now.</p>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canAddMore}
              onClick={handleAddIntention}
              className={cn(
                // h-[58px] — review fix, was h-12 (48px); matches this same screen's own "Continue" button (GradientActionButton, height driven by its py-3.5 padding rather than a fixed class) — explicit direct request, height only, no other change.
                'focus-ring pressable flex h-[58px] w-full items-center justify-center gap-2 rounded-[8px] border border-solid px-4 py-2 opacity-70',
                canAddMore ? 'border-[#c15178] bg-[#fefafc] text-[#a7073e]' : 'border-[#cdbfc4] text-[#17171c]',
              )}
            >
              <Plus size={20} />
              {/* text-lg (18px) — review fix, was text-base (16px); matches the primary button's own text size (GradientActionButton's "Continue"), explicit direct request, size+weight only — font-medium already matched. */}
              <span className="font-sans text-lg font-medium">Save intention</span>
            </button>
          )}

          {savedIntentions.length > 0 && (
            <div className="flex w-full flex-col gap-6">
              <div className="h-px w-full bg-[#eddde6]" />
              <div className="flex flex-col gap-2">
                {savedIntentions.map((intention, index) => {
                  const sphere = SPHERES[intention.sphere]
                  const Icon = sphere.icon
                  return (
                    <div key={index} className="relative flex w-full flex-col gap-2 rounded-[12px] border border-solid border-[#eddde6] p-3">
                      <span className="inline-flex w-fit items-center gap-1 rounded-[40px] border border-solid border-[#eddde6] py-0.5 pr-2 pl-1.5">
                        <Icon size={13} weight="fill" className="text-ink" />
                        <span className="font-sans text-[13px] leading-[1.2] font-medium text-ink">{sphere.label}</span>
                      </span>
                      <p className="pr-12 font-sans text-base leading-[1.5] text-ink">{intention.text}</p>
                      <button
                        type="button"
                        aria-label={`Remove "${intention.text}"`}
                        onClick={() => handleRemoveIntention(index)}
                        className="focus-ring pressable absolute top-0 right-0 flex size-11 items-center justify-center rounded-2xl bg-white"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />
        <div className="flex flex-col gap-2">
          <IntentionProgressBar step="details" hasSavedIntention={savedIntentions.length > 0} />
          <GradientActionButton disabled={!canContinue} onClick={handleContinue}>
            Continue
          </GradientActionButton>
        </div>
      </div>

      <LifeAreaPickerSheet
        open={areaSheetOpen}
        value={draftSphere}
        onSelect={(sphere) => {
          setDraftSphere(sphere)
          setAreaSheetOpen(false)
        }}
        onDismiss={() => setAreaSheetOpen(false)}
      />
    </>
  )
}
