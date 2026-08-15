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
export function FlowSuccessScreen({ icon, title, subtitle, onClose, onDone }: FlowSuccessScreenProps) {
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
      <div className="px-5 pt-4 pb-5">
        <GradientActionButton variant="secondary" onClick={onDone}>
          Done
        </GradientActionButton>
      </div>
    </>
  )
}
