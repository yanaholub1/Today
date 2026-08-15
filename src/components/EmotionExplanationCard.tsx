import { EMOTION_EXPLANATIONS } from '../lib/emotionExplanations'
import { MOOD_QUADRANTS } from '../lib/moodCategories'
import type { MoodQuadrantId } from '../lib/moodCategories'
import { cn } from '../lib/cn'

export interface EmotionExplanationCardProps {
  emotion: string
  quadrant: MoodQuadrantId
  className?: string
}

/**
 * Self-regulation/awareness card — verified against node 217:15353 (and
 * its recap duplicate on 217:15068) for the overall shape: a bordered
 * `#eddde6`, white-fill, 12px-radius box containing a pill with the
 * emotion word, then a regular 16px `#2f374a` explanation paragraph below.
 *
 * The pill's fill/text color is explicit direct request, superseding the
 * fixed `#fae1e9`/`#6d0e2d` both fetched example nodes actually show
 * (which read as one hardcoded style, not confirmed per-quadrant): now
 * pulled from `MOOD_QUADRANTS`, the SAME source and SAME values already
 * used for that quadrant's own selected pill/card elsewhere (fill →
 * `quadrant.fill`, text → `quadrant.textColor`) so this card's pill always
 * matches the mood category the emotion belongs to. Border uses
 * `quadrant.border` for the same reason, grouped with fill/text rather
 * than left as the old fixed `#eac3d0`.
 *
 * Renders nothing if the emotion has no entry in `EMOTION_EXPLANATIONS`
 * (shouldn't happen for the 32 built-in words, but avoids ever showing an
 * empty card for a future/typo'd emotion).
 */
export function EmotionExplanationCard({ emotion, quadrant, className }: EmotionExplanationCardProps) {
  const explanation = EMOTION_EXPLANATIONS[emotion]
  if (!explanation) return null
  const quadrantDef = MOOD_QUADRANTS.find((q) => q.id === quadrant)!

  return (
    <div className={cn('flex w-full flex-col gap-2 rounded-[12px] border border-solid border-[#eddde6] bg-white px-5 py-3', className)}>
      <span
        className="inline-flex w-fit items-center rounded-[40px] border border-solid py-0.5 pr-2 pl-1.5"
        style={{ backgroundColor: quadrantDef.fill, borderColor: quadrantDef.border }}
      >
        <span className="font-sans text-[13px] leading-[1.2] font-medium" style={{ color: quadrantDef.textColor }}>
          {emotion}
        </span>
      </span>
      <p className="font-sans text-base leading-[1.5] text-ink">{explanation}</p>
    </div>
  )
}
