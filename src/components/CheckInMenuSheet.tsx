import { useNavigate } from 'react-router-dom'
import { Flower } from '@phosphor-icons/react'
import { GradientActionButton } from './GradientActionButton'
import { useDayLogStore } from '../lib/dayLogStore'
import { deriveIntentionState, INTENTION_STATE_CONFIG } from '../lib/intentionState'

export interface CheckInMenuSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Bottom-sheet popup triggered by tapping the tab bar's floating "+"
 * button — re-verified against node 242:1751 (Fix 23), which replaces
 * this popup's earlier stacked-hero-card look (109:3847) entirely: a
 * plain white panel (`border-black/10`, `shadow-[0px_-3px_24px_rgba(0,0,0,0.12)]`,
 * `rounded-t-[24px]`, `pt-8 pb-10 px-5`, `gap-2`) holding two simple
 * `rounded-[12px]` `h-[52px]` buttons instead of the old 327px-tall
 * hero-card pair — no home-indicator bar in this node, so that decorative
 * element is dropped along with the old chrome it belonged to.
 *
 * The two buttons reuse `GradientActionButton` at `radius="md"` rather
 * than `HeroActionCard`'s "compact" size — same gradient/border/shadow
 * recipe (independently confirmed here against 242:1751's own "Set
 * intention"/"Check in mood" pair), just a different shape (icon beside
 * label at a fixed height, not a big stacked card). "Set intention" still
 * reuses `INTENTION_STATE_CONFIG` for its label/icon/variant/tappable/
 * disabled state — that 4-state logic isn't specific to any one
 * component, it's the app's real intention-flow entry-point behavior.
 * "Check in mood" stays static, same as before.
 *
 * Review fix (Fix 30): this sheet is now the app's ONLY entry point into
 * either flow — the old full-screen hero-card pair (`CheckInHeroChoices`,
 * `HeroActionCard` at `size="full"`) that used to gate every app start at
 * `/` (`CheckInGateScreen`) has been removed entirely, along with that
 * screen and component. `/` now just redirects (to `/checkin` once
 * registered), so this floating-button popup is the single, always-
 * available way to start either flow, exactly as it already was for any
 * screen reached after the very first app-start.
 *
 * The backdrop (tap-to-dismiss) and slide transition are NOT in the
 * source — Figma can't capture interaction/motion, and a bottom sheet
 * with no way to dismiss it except picking an option would trap the user.
 * Flagged as inferred, same as TextInput/FlowActionButton.
 */
export function CheckInMenuSheet({ open, onClose }: CheckInMenuSheetProps) {
  const navigate = useNavigate()
  const { intentions } = useDayLogStore()
  const intentionState = deriveIntentionState(intentions)
  const intentionConfig = INTENTION_STATE_CONFIG[intentionState]
  const IntentionIcon = intentionConfig.icon

  const goTo = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div className={open ? 'pointer-events-auto fixed inset-0 z-40' : 'pointer-events-none fixed inset-0 z-40'}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Check in"
        className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[393px] flex-col gap-2 rounded-t-[24px] border border-solid border-black/10 bg-white px-5 pt-8 pb-10 shadow-[0px_-3px_24px_0px_rgba(0,0,0,0.12)] transition-transform duration-200 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <GradientActionButton
          radius="md"
          className="h-[52px]"
          variant={intentionConfig.variant}
          disabled={intentionConfig.disabled}
          aria-disabled={!intentionConfig.tappable || intentionConfig.disabled}
          icon={<IntentionIcon size={24} weight={intentionConfig.iconWeight} color={intentionConfig.variant === 'primary' ? 'white' : undefined} />}
          onClick={intentionConfig.tappable ? () => goTo('/checkin/intention') : undefined}
        >
          {intentionConfig.label}
        </GradientActionButton>
        <GradientActionButton radius="md" className="h-[52px]" variant="secondary" icon={<Flower size={24} weight="fill" />} onClick={() => goTo('/checkin/mood')}>
          Check in mood
        </GradientActionButton>
      </div>
    </div>
  )
}
