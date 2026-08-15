import type { ReactNode } from 'react'
import { ArrowLeft, X } from '@phosphor-icons/react'
import { IconTapTarget } from './IconTapTarget'

export interface TaskFlowHeaderProps {
  /** Usually a plain string, but accepts any ReactNode — e.g. EveningReflectionFlow's "Today's reflection 1 of 3" needs a smaller/lighter inline count suffix (verified against node 229:16031), not just plain text. */
  title?: ReactNode
  /** 'close' (X) at the start of a flow, 'back' (arrow) mid-flow once there's a previous step to return to. */
  exit: 'close' | 'back'
  onExit: () => void
  /** Optional trailing content on the same line as the title (e.g. a search icon button) — explicit direct request, not from any audited node. Renders right after the title, not pushed to the far edge. */
  trailing?: ReactNode
}

/**
 * Shared header for every screen inside a full-screen task flow — every
 * such screen needs a visible exit affordance so the user can bail out
 * without finishing, per the brief. Uses `IconTapTarget` (flat, no fill/
 * border), matching plain nav icons elsewhere in the app — explicitly NOT
 * the gradient `GradientCircleButton` treatment, which is a distinct
 * component for a different button (e.g. the picker-screen back arrow).
 *
 * `title` is optional since these flow shells don't have real step
 * content yet (Stage 4) — screens can pass one once they have something
 * to label.
 *
 * Review fix — verified against node 213:14117: the CLOSE ("X") icon sits
 * on the RIGHT of the header (title flex-1 on the left, X pushed to the
 * far right edge), not the left as originally built. The BACK arrow is
 * unaffected — no node for this fix showed it moving, and Stage 3 already
 * placed it correctly on the left as the "previous step" affordance,
 * genuinely distinct from "close" — so only the `exit === 'close'` layout
 * changes here. `title`+`trailing` are wrapped in one `flex-1` group so
 * the exit icon (whichever side it's on) is the thing that gets pushed to
 * the row's true edge, not just placed after a fixed-width title.
 */
export function TaskFlowHeader({ title, exit, onExit, trailing }: TaskFlowHeaderProps) {
  const exitButton = <IconTapTarget icon={exit === 'close' ? X : ArrowLeft} aria-label={exit === 'close' ? 'Close' : 'Back'} onClick={onExit} />

  return (
    <header className="flex w-full items-center gap-3 px-5 pt-[max(16px,env(safe-area-inset-top))] pb-2">
      {exit === 'back' && exitButton}
      <div className="flex flex-1 items-center gap-3">
        {title && <h1 className="font-serif text-xl text-ink">{title}</h1>}
        {trailing}
      </div>
      {exit === 'close' && exitButton}
    </header>
  )
}
