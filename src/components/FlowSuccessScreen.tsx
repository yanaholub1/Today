import type { ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { IconTapTarget } from './IconTapTarget'
import { GradientActionButton } from './GradientActionButton'

export interface FlowSuccessScreenProps {
  icon: ReactNode
  title: string
  subtitle: string
  onClose: () => void
  onDone: () => void
  /** Overrides the button's default "Done" label — e.g. the magic-link "check your email" step reuses this same template but needs "Use a different email" instead. Defaults to "Done" so every existing call site is unaffected. */
  doneLabel?: string
}

/**
 * Shared end-of-flow success screen — extracted from `MorningIntentionFlow`'s
 * own "Your intention is set" step (verified against node 217:14940) once
 * `EveningReflectionFlow`/`MoodFlowScreen` needed the exact same template
 * with only the icon/copy swapped: a bare top-right X (not
 * `TaskFlowHeader`'s usual left-aligned X next to a title — this screen
 * has no title row at all), a centered icon/title/subtitle group, and a
 * "Done" button with no progress bar. `icon` is a `ReactNode` (not an
 * image src) so each flow passes its own illustration component.
 *
 * "Done" is always `variant="secondary"` (pale gradient, `#fcbbd2` border,
 * ink text) — explicit direct correction re-verified against node
 * 253:2147, applying to every success screen at once since this is their
 * one shared component.
 */
export function FlowSuccessScreen({ icon, title, subtitle, onClose, onDone, doneLabel = 'Done' }: FlowSuccessScreenProps) {
  return (
    <>
      <div className="flex w-full items-center justify-end px-5 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <IconTapTarget icon={X} aria-label="Close" onClick={onClose} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 pb-8 text-center">
        {icon}
        <div className="flex flex-col items-center gap-3">
          <p className="font-serif text-xl text-ink">{title}</p>
          <p className="font-sans text-base leading-[1.5] text-ink">{subtitle}</p>
        </div>
      </div>
      {/*
        `pb-[max(20px,env(safe-area-inset-bottom))]` (review fix): this
        wrapper's `pb-5` (20px) was a fixed value from before
        `viewport-fit=cover` went global — this is the true bottom-of-
        screen element for every flow that ends on this shared success
        template (mood check-in, both intention flows, and Registration's
        own "check your email" step), so it's now exposed to the same
        home-indicator gap `pt-[max(16px,env(safe-area-inset-top))]`
        above already handles for the top. Same pattern, same reasoning.
      */}
      <div className="px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <GradientActionButton variant="secondary" onClick={onDone}>
          {doneLabel}
        </GradientActionButton>
      </div>
    </>
  )
}
