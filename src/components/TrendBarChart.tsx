import { cn } from '../lib/cn'

export interface TrendBarChartPoint {
  key: string
  label: string
  value: number
  /** Shown in the bar's own title attr — e.g. "High" or "3.4". */
  valueLabel: string
  /** CSS `background-image` for this specific bar — lets a discrete-value chart (e.g. energy's Low/Medium/High) give each level its own color rather than one flat fill. Falls back to the app's default pink track gradient when omitted. */
  gradient?: string
}

export interface TrendBarChartProps {
  points: TrendBarChartPoint[]
  /** Upper bound each bar's height is measured against (e.g. 3 for energy's low/medium/high). */
  max: number
  className?: string
}

const DEFAULT_GRADIENT = 'linear-gradient(180deg, var(--color-slider-from), var(--color-slider-to))'

/**
 * Small hand-built bar chart — NOT pulled from a charting library. No
 * Figma node exists for the Patterns screen at all (checked exhaustively
 * across the whole "Today" canvas), so this reuses the app's own
 * established visual language instead of a generic dashboard look:
 * `rounded-pill` bar caps and the app's existing type scale for labels. A
 * real charting library would be overkill for "a handful of evenly-spaced
 * vertical bars" — this is simpler and has zero new dependencies.
 *
 * Currently used only for energy (Fix 25 moved mood off this component
 * entirely, onto `MoodTimeline`'s stacked-dot view instead) — energy is a
 * genuinely discrete Low/Medium/High value logged once per day, so this
 * stays plain vertical bars, not a smoothed/interpolated line, which
 * would visually imply a continuous measurement that doesn't exist.
 *
 * Each bar's height is `value/max` of the chart's own fixed pixel height;
 * a `value` of 0 or less still renders a minimal visible sliver (not a
 * fully collapsed bar) so an empty day reads as "recorded, at the floor"
 * rather than looking like a rendering bug.
 */
export function TrendBarChart({ points, max, className }: TrendBarChartProps) {
  const CHART_HEIGHT = 96

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="flex items-end gap-1.5" style={{ height: CHART_HEIGHT + 24 }}>
        {points.map((point) => {
          const ratio = Math.max(0.04, Math.min(1, point.value / max))
          return (
            <div key={point.key} className="flex w-7 shrink-0 flex-col items-center gap-1.5">
              <div className="flex w-full items-end justify-center" style={{ height: CHART_HEIGHT }} title={point.valueLabel}>
                <div
                  className="w-full rounded-pill"
                  style={{
                    height: `${ratio * 100}%`,
                    backgroundImage: point.gradient ?? DEFAULT_GRADIENT,
                    boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.05), inset 0 3px 3px rgba(255,255,255,0.4)',
                  }}
                  aria-hidden="true"
                />
              </div>
              <span className="font-sans text-[11px] font-medium whitespace-nowrap text-ink/50">{point.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
