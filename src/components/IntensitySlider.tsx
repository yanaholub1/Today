import { useCallback, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { cn } from '../lib/cn'

export type IntensitySliderSegments = 3 | 5

export interface IntensitySliderProps {
  /** 0–100 */
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
  className?: string
  /**
   * Whether the slider responds to input at all — e.g. gated on the
   * previous question in the flow having been answered. Defaults to
   * false, so the slider is inert until a parent screen opts it in.
   * This no longer gates the "active" visual style directly: once the
   * slider is interactive, a single tap/drag/keypress/label-tap switches
   * the fill and current tick to their active look immediately, tracked
   * by internal state.
   */
  active?: boolean
  /**
   * 3 = "current energy level" (9 marks: pills at 0/4/8, dots between,
   * Low/Medium/High labels). 5 = "mood/emotion intensity" (9 marks: pills
   * at every even index alternating with dots at odd indexes — 5 pills +
   * 4 dots — numeral labels 1-5, plus a "A little"/"Very intense" caption
   * row beneath them). Controls tick layout, label count/text, and the label
   * row's own horizontal padding. Defaults to 3.
   */
  segments?: IntensitySliderSegments
  /** Override the default label text for the current `segments` count. */
  labels?: string[]
}

// Both variants use a 9-mark row; they differ only in which marks are
// pills vs dots and what labels sit beneath. 3-segment: pills only at the
// 3 label positions (0/4/8). 5-segment: pills alternate with dots at every
// position (square-circle-square-circle-square-circle-square-circle-square)
// per this fix — 5 pills (labeled 1-5) + 4 dots between them.
//
// `accentMarkIndexes` is the ORDERED version of the same set — index i of
// this array is the mark position for the i-th label, letting the "current
// mark" (the one that grows tall + fills, driven by the nearest-label
// index the value snaps to) be looked up directly rather than re-derived.
const SEGMENT_CONFIG: Record<
  IntensitySliderSegments,
  { markCount: number; accentMarkIndexes: readonly number[]; defaultLabels: string[]; labelPadding: string; rangeCaption?: readonly [string, string] }
> = {
  3: {
    markCount: 9,
    accentMarkIndexes: [0, 4, 8],
    defaultLabels: ['Low', 'Medium', 'High'],
    labelPadding: 'pl-7 pr-6', // 28px / 24px
  },
  5: {
    markCount: 9,
    accentMarkIndexes: [0, 2, 4, 6, 8],
    defaultLabels: ['1', '2', '3', '4', '5'],
    labelPadding: 'px-10', // 40px / 40px
    rangeCaption: ['A little', 'Very intense'], // review fix, was ['Lowest', 'Highest']
  },
}

/** Nearest of N evenly-spaced label anchors (0..100) to the current value. */
function nearestLabelIndex(value: number, labelCount: number): number {
  return Math.round((value / 100) * (labelCount - 1))
}

// Tick colors — review fix, re-verified against 10 fetched nodes covering
// every state of both variants (see this file's own component doc comment
// for the full list). Two independent things changed per tick: its COLOR
// (default pale gradient vs. filled saturated gradient, crossfaded via
// opacity since gradients themselves can't be tweened — same technique as
// before) and, for the one tick AT the current value, its HEIGHT (which
// CAN be tweened directly, no layering trick needed).
//  - Pill default: unchanged from the old design — `linear-gradient(to
//    left, white 14.683%, #fbc7e4 181.24%)`.
//  - Dot default: previously a flat `rgba(255,255,255,0.7)` — the raw SVG
//    export (`Ellipse 10`) shows this was always actually a gradient too
//    (`linear-gradient(to left, white 25.89%, #fbc7e4 95.55%)`, different
//    stop positions from the pill's own, kept separate rather than reused).
//  - Pill/dot FILLED (passed by the current fill boundary): raw SVG/CSS
//    both give `linear-gradient(to top, #f56093 <stop>, #f62870 <stop>)`
//    plus a `0.5px solid rgba(252,195,226,0.4)` border — the pill's own
//    stops (18.92%/81.25%) differ slightly from the dot's (0.27%/100%),
//    again kept as separate constants rather than forced to match.
const TICK_PILL_DEFAULT = 'linear-gradient(to left, white 14.683%, #fbc7e4 181.24%)'
const TICK_DOT_DEFAULT = 'linear-gradient(to left, white 25.89%, #fbc7e4 95.55%)'
const TICK_PILL_FILLED = 'linear-gradient(to top, #f56093 18.92%, #f62870 81.25%)'
const TICK_DOT_FILLED = 'linear-gradient(to top, #f56093 0.27%, #f62870 100%)'
const TICK_FILLED_BORDER = 'rgba(252,195,226,0.4)'
const TICK_TRANSITION_MS = 300

// Rest heights, unchanged in concept from the old design (20px pills, 6px
// dots) — the new addition is `TICK_CURRENT_HEIGHT`, applied only to the
// one pill sitting exactly at the current value. Fetched examples show
// 55px in most places and 56px in one (342:4617's "Low" state) — the same
// kind of small cross-fetch drift already documented elsewhere in this
// file's git history for the old knob's geometry; 55 (the majority value)
// is used here rather than treating both as meaningful. No fetched example
// shows a DOT ever taking this treatment — the current value always lands
// on a labeled (pill) position, never a dot, in both variants.
const TICK_REST_HEIGHT_PILL = 20
const TICK_REST_HEIGHT_DOT = 6
const TICK_CURRENT_HEIGHT = 55
const TICK_WIDTH_PILL = 8
const TICK_WIDTH_DOT = 6

// Fill bar geometry — review fix, re-verified against Figma nodes 345:9526
// ("Rating bar" in context) and 345:9529 (the fill frame isolated): the
// fill's own right edge should land exactly on the current pill's own
// right edge, INCLUDING that pill's `0.5px solid` stroke — "the vivid
// frame ends right where the stroke of the long element ends," per
// explicit direct request. get_metadata on 345:9526 gives exact bounding
// boxes: fill width 181px, current pill (index 4 of 9, the 3-segment
// variant's middle mark) at x=172.5/width=8 → its own right edge at
// 180.5px, 0.5px short of the fill's 181px — exactly that pill's own
// stroke width, confirming the fill is meant to sit flush with the
// OUTSIDE of the stroke, not the pill's bare box.
//
// The OLD formula here was a naive linear interpolation of `markIndex /
// (markCount - 1)` — that's only correct if every mark were the same
// width, but marks alternate between 8px pills (`accentMarkIndexes`) and
// 6px dots, and CSS `justify-content: space-between` (this row's own
// layout) distributes its 8 gaps AROUND each mark's real width, not
// around zero-width points. Re-deriving from the same metadata: gap width
// = (track − 2×40px padding − total mark width) / 8, so the true right
// edge of mark `i` is `40px + (sum of every mark's width up to and
// including i) + i × gap`, which — expanded algebraically — resolves to a
// single `calc(<px>px + <percent>%)` (below), not the old
// proportional-of-100%-plus-a-flat-fudge shape. Verified exact against
// the same 345:9526 data point (markIndex 4, 3-segment): this formula
// gives `calc(4.5px + 50%)`, which at that node's own 353px track width
// works out to 181px — byte-matching the fetched fill width above.
const FILL_TRACK_PADDING = 40
const FILL_EDGE_STROKE_FUDGE = 0.5 // the current pill's own `0.5px solid` border, drawn outside its box

function fillWidthForMark(markIndex: number, markCount: number, accentMarkIndexes: readonly number[]): string {
  if (markIndex >= markCount - 1) return '100%'

  const widthAt = (i: number) => (accentMarkIndexes.includes(i) ? TICK_WIDTH_PILL : TICK_WIDTH_DOT)
  let widthUpToMark = 0
  let totalMarkWidth = 0
  for (let i = 0; i < markCount; i++) {
    const w = widthAt(i)
    totalMarkWidth += w
    if (i <= markIndex) widthUpToMark += w
  }

  const gapCount = markCount - 1
  const gapFraction = markIndex / gapCount
  const pxPart = FILL_TRACK_PADDING + widthUpToMark - gapFraction * (FILL_TRACK_PADDING * 2 + totalMarkWidth) + FILL_EDGE_STROKE_FUDGE

  return `calc(${pxPart}px + ${gapFraction * 100}%)`
}

/** A tick mark that cross-fades its color between default and filled via opacity, and tweens its height directly when it's the current position. */
function Tick({ isAccent, isPassed, isCurrent }: { isAccent: boolean; isPassed: boolean; isCurrent: boolean }) {
  const width = isAccent ? TICK_WIDTH_PILL : TICK_WIDTH_DOT
  const height = isAccent && isCurrent ? TICK_CURRENT_HEIGHT : isAccent ? TICK_REST_HEIGHT_PILL : TICK_REST_HEIGHT_DOT
  const defaultStyle: CSSProperties = { backgroundImage: isAccent ? TICK_PILL_DEFAULT : TICK_DOT_DEFAULT }
  const activeStyle: CSSProperties = { backgroundImage: isAccent ? TICK_PILL_FILLED : TICK_DOT_FILLED, border: `0.5px solid ${TICK_FILLED_BORDER}` }

  return (
    <span className="relative shrink-0" style={{ width, height, transition: `height ${TICK_TRANSITION_MS}ms ease-out` }}>
      <span className="absolute inset-0 rounded-pill" style={defaultStyle} />
      <span
        className="absolute inset-0 rounded-pill"
        style={{ ...activeStyle, opacity: isPassed ? 1 : 0, transition: `opacity ${TICK_TRANSITION_MS}ms ease-out` }}
      />
    </span>
  )
}

/**
 * Custom-built intensity slider — not a styled native `<input type="range">`,
 * since the track, ticks, fill, and labels are all bespoke. Supports
 * drag-to-set, tap-to-jump on the track, tap-on-label, and arrow-key
 * stepping.
 *
 * Review fix — full redesign, replacing the earlier floating-knob version:
 * verified via get_design_context + get_screenshot on 10 nodes covering
 * every state of both variants — 342:4559 (energy default), 342:4617
 * (energy low), 340:4182 (energy medium), 342:4665 (energy high), 342:4579
 * (mood default), 342:4867/4813/340:4226/342:4705/4933 (mood 1-5). There is
 * no knob anymore: the current value is shown by (a) a progress-bar-style
 * fill growing from the track's left edge up to the current mark's own
 * right edge, and (b) that mark's own tick growing tall (20px → 55px) and
 * switching from its pale default gradient to a saturated filled one,
 * along with every tick before it. The base track's own gradient/border/
 * shadow (`--color-slider-from/to/border`, the `.sheen-track` utility) are
 * unchanged from the old design and were already byte-correct; only the
 * knob, the tick colors/geometry, the label colors/weights, and (for
 * `segments={5}`) a new "A little"/"Very intense" caption row (review fix
 * — was "Lowest"/"Highest") are new here.
 *
 * Like the old knob, the fill only ever renders once the slider has been
 * interacted with (`hasInteracted`) — the `active` prop still just gates
 * whether interaction is accepted at all, independent of this visual
 * switch, same separation as before.
 *
 * Tapping a label is a real interaction now, not decorative text —
 * explicit direct request, matching the drag/tap-on-track paths already
 * supported: each label is a `h-10 min-w-10` button, deliberately sized
 * past its own text so the tap target is generous, not just the glyph's
 * own bounding box.
 *
 * Review fix — labels used to live in their own row below the track,
 * spaced by `flex-1` (N equal cells) independent of the tick row above
 * (spaced by `justify-between` over 9 marks that ALTERNATE width — 8px
 * pills at the labeled positions, 6px dots between them, per
 * `fillWidthForMark`'s own derivation above). Those two distributions
 * only coincide at the two ends (mark 0 and the last mark both sit flush
 * against the row's own edges regardless of how the marks between them
 * are sized) — every label in between drifted from its own tick by a
 * different amount depending on viewport width, worse specifically on
 * the 5-segment mood slider (4 unevenly-spaced marks between the edges,
 * vs. 3-segment's single evenly-centered middle mark, which happened to
 * still land close to its own tick by symmetry alone).
 *
 * Fixed by deriving each label's position from the SAME cell as its own
 * tick, not a second computation: each of the 9 mark slots in the loop
 * below is now a `relative` wrapper holding both the `<Tick>` and (for a
 * labeled slot) a `button` absolutely positioned (`left-1/2
 * -translate-x-1/2`) under THAT wrapper specifically — so a label is
 * always exactly centered on its own tick's real rendered position, at
 * any track width, by construction rather than by two formulas
 * happening to agree. `self-stretch` on the wrapper (not the row's own
 * `items-center`) is what keeps each cell's own height pinned to the
 * track's full 57px regardless of whether ITS tick is currently 20px or
 * grown to 55px — without it, `top-full`'s 100% would be relative to the
 * tick's own varying height instead of a fixed anchor, and the label
 * would hop vertically as the current mark changes.
 */
export function IntensitySlider({
  value,
  onChange,
  ariaLabel = 'Intensity',
  className,
  active = false,
  segments = 3,
  labels,
}: IntensitySliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Visual "active" is purely "has this slider ever been touched" — no
  // longer ANDed with the `active` prop. That prop instead gates the
  // handlers below, so a non-interactive slider can never set
  // hasInteracted in the first place, which composes to the same net
  // effect without needing both conditions checked at render time.
  const isActive = hasInteracted
  const config = SEGMENT_CONFIG[segments]
  const labelList = labels ?? config.defaultLabels
  const activeLabelIndex = nearestLabelIndex(value, labelList.length)
  const currentMarkIndex = config.accentMarkIndexes[activeLabelIndex]
  const isFull = currentMarkIndex === config.markCount - 1

  const setFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const ratio = (clientX - rect.left) / rect.width
      const clamped = Math.min(1, Math.max(0, ratio))
      onChange(Math.round(clamped * 100))
    },
    [onChange],
  )

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!active) return
    setDragging(true)
    setHasInteracted(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!active || !dragging) return
    setFromClientX(e.clientX)
  }
  const handlePointerUp = () => setDragging(false)

  // Arrow keys move by one LABEL step, not a fixed 5% — the only positions
  // that have a visible effect in this redesign (a fill/tick change) are
  // the labeled anchors, so a smaller step would move the value without
  // moving anything the user can see until it crosses the next anchor.
  const labelStep = 100 / (labelList.length - 1)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!active) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(100, Math.round(value + labelStep)))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(0, Math.round(value - labelStep)))
    else if (e.key === 'Home') onChange(0)
    else if (e.key === 'End') onChange(100)
    else return
    setHasInteracted(true)
  }

  const handleLabelTap = (labelIndex: number) => {
    if (!active) return
    onChange(Math.round((labelIndex / (labelList.length - 1)) * 100))
    setHasInteracted(true)
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={active ? 0 : -1}
        aria-disabled={!active}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={cn(
          'sheen sheen-track focus-ring relative h-[57px] w-full touch-none rounded-pill border border-slider-border bg-[linear-gradient(180deg,var(--color-slider-from),var(--color-slider-to))]',
          active ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        {isActive && (
          <div
            aria-hidden="true"
            className={cn(
              'sheen sheen-track pointer-events-none absolute inset-y-0 left-0 border border-solid border-slider-border bg-[linear-gradient(180deg,var(--color-slider-fill-from),var(--color-slider-to))]',
              isFull ? 'rounded-pill' : 'rounded-l-pill rounded-r-[4px]',
            )}
            style={{ width: fillWidthForMark(currentMarkIndex, config.markCount, config.accentMarkIndexes), transition: 'width 200ms ease-out' }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-10">
          {Array.from({ length: config.markCount }, (_, i) => {
            const isAccent = config.accentMarkIndexes.includes(i)
            const isPassed = isActive && i <= currentMarkIndex
            const isCurrent = isActive && i === currentMarkIndex
            // -1 for a dot (no label); the label's own index into `labelList`
            // for a pill, since `accentMarkIndexes` is already ordered to
            // line up 1:1 with `labelList` (this file's own top comment).
            const labelIndex = config.accentMarkIndexes.indexOf(i)
            const label = labelIndex !== -1 ? labelList[labelIndex] : null
            return (
              // `self-stretch` (review fix, see doc comment below) — NOT the
              // row's own `items-center` — is what keeps this cell's height
              // fixed at the track's full 57px regardless of whether the
              // Tick inside it is currently 20px or grown to 55px, so the
              // label anchored to `top-full` below never shifts vertically
              // as the current mark changes.
              <div key={i} className="relative flex h-full shrink-0 items-center self-stretch">
                <Tick isAccent={isAccent} isPassed={isPassed} isCurrent={isCurrent} />
                {label !== null && (
                  <button
                    type="button"
                    disabled={!active}
                    onClick={() => handleLabelTap(labelIndex)}
                    className={cn(
                      'focus-ring pressable pointer-events-auto absolute top-full left-1/2 mt-1 flex h-10 min-w-10 -translate-x-1/2 items-center justify-center px-1 font-sans text-base whitespace-nowrap transition-colors duration-150',
                      isActive && labelIndex === activeLabelIndex ? 'font-semibold text-slider-label-active' : 'font-normal text-slider-label-default',
                    )}
                  >
                    {label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reserves the labels' own footprint (mt-1's 4px + h-10's 40px, matching those exact values above) in normal document flow — the labels themselves no longer occupy any (they're `absolute`, anchored to the tick row above), so without this a trailing rangeCaption row, or anything a caller places after this whole component, would sit up under the numbers instead of below them. */}
      <div className="h-11" aria-hidden="true" />

      {config.rangeCaption && (
        <div className={cn('mt-2 flex items-center justify-between font-sans text-[13px] text-slider-label-default', config.labelPadding)}>
          <span>{config.rangeCaption[0]}</span>
          <span>{config.rangeCaption[1]}</span>
        </div>
      )}
    </div>
  )
}
