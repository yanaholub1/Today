import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, MagnifyingGlass, MoonStars, Plus, Sun, X } from '@phosphor-icons/react'
import { HeroActionCard } from './components/HeroActionCard'
import { ChoiceChip } from './components/ChoiceChip'
import { SegmentedFilterPill } from './components/SegmentedFilterPill'
import { IntensitySlider } from './components/IntensitySlider'
import { IconTapTarget } from './components/IconTapTarget'
import { GradientCircleButton } from './components/GradientCircleButton'
import { MoodCategorySelector } from './components/MoodCategorySelector'
import { MOOD_CATEGORIES } from './lib/moodCategories'
import type { MoodCategoryId } from './lib/moodCategories'

// Same shared source MoodCategorySelector reads from, so the switcher and
// the card grid can never show two different colors for the same category.
const FILTER_ITEMS = MOOD_CATEGORIES.map((c) => ({
  id: c.id,
  icon: c.icon,
  label: c.label,
  selected: { fill: c.fill, border: c.border, boxShadow: c.boxShadow },
}))

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-ink/60">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Every component/variant/state in the library, side by side, for visual QA.
 * Not a real screen — a checklist you can eyeball against the Figma file.
 */
export default function ComponentLibraryPreview() {
  const [warmSelected, setWarmSelected] = useState(true)
  const [coolSelected, setCoolSelected] = useState(false)
  const [activeFilter, setActiveFilter] = useState<MoodCategoryId>('off')
  const [lastTappedQuadrant, setLastTappedQuadrant] = useState<string | null>(null)
  const [inactiveDemoValue, setInactiveDemoValue] = useState(20)
  const [activeDemoValue, setActiveDemoValue] = useState(60)
  const [fiveSegmentValue, setFiveSegmentValue] = useState(50)

  return (
    <div className="mx-auto flex w-full sm:max-w-[393px] flex-col gap-8 bg-white p-5 pb-16">
      <h1 className="font-serif text-2xl text-ink">Today — component library</h1>

      <Section title="HeroActionCard — standalone">
        <div className="flex flex-col gap-4">
          <HeroActionCard variant="primary" icon={<Sun size={48} weight="fill" color="white" />} label="Set intention" />
          <HeroActionCard variant="secondary" icon={<Sun size={48} weight="fill" />} label="Mood check-in" />
          <HeroActionCard variant="secondary" label="Disabled" disabled />
        </div>
      </Section>

      <Section title="HeroActionCard — stacked pair (fused seam)">
        <div className="flex flex-col">
          <HeroActionCard
            variant="primary"
            stackPosition="first"
            icon={<Sun size={40} weight="fill" color="white" />}
            label="Set intention"
            className="min-h-32"
          />
          <HeroActionCard
            variant="secondary"
            stackPosition="last"
            icon={<Sun size={40} weight="fill" />}
            label="Mood check-in"
            className="min-h-32"
          />
        </div>
      </Section>

      <Section title="ChoiceChip">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceChip
            label="High energy"
            family="warm"
            selected={warmSelected}
            onClick={() => setWarmSelected((s) => !s)}
          />
          <ChoiceChip label="High energy" family="warm" selected={false} />
          <ChoiceChip
            label="Calm"
            family="cool"
            selected={coolSelected}
            onClick={() => setCoolSelected((s) => !s)}
          />
          <ChoiceChip label="Calm" family="cool" selected={false} />
        </div>
        <p className="font-sans text-xs text-ink/60">Cool-selected (top right) is a Stage 2 addition — no equivalent exists in the source.</p>
        <ChoiceChip label="Sleepy" family="cool" icon={<MoonStars size={20} />} selected={false} />
      </Section>

      <Section title="SegmentedFilterPill">
        <SegmentedFilterPill
          items={FILTER_ITEMS}
          activeId={activeFilter}
          onActiveChange={(id) => setActiveFilter(id as MoodCategoryId)}
          onSeeAll={() => {}}
        />
        <p className="font-sans text-xs text-ink/60">Tap any segment — the selected one always renders as a full pill on top, with its own category color, at any of the 4 positions.</p>
      </Section>

      <Section title="MoodCategorySelector">
        <MoodCategorySelector onSelect={(id) => setLastTappedQuadrant(id)} />
        <p className="font-sans text-xs text-ink/60">
          Every card shows its full color unconditionally — there is no dimmed/unselected state. A tap is a one-way action, not a toggle{lastTappedQuadrant ? ` (last tapped: ${lastTappedQuadrant})` : ''}.
        </p>
      </Section>

      <Section title="IntensitySlider — 3 segments (energy level)">
        <div className="flex flex-col gap-8">
          <p className="font-sans text-xs text-ink/60">Not interactive — previous question not yet answered (tap/drag do nothing at all)</p>
          <IntensitySlider
            value={inactiveDemoValue}
            onChange={setInactiveDemoValue}
            ariaLabel="Current energy level (inactive demo)"
            active={false}
          />
        </div>
        <div className="mt-10 flex flex-col gap-8">
          <p className="font-sans text-xs text-ink/60">Interactive — drag the track or tap a label; it switches to active on first touch, and the fill/current tick track the nearest label</p>
          <IntensitySlider
            value={activeDemoValue}
            onChange={setActiveDemoValue}
            ariaLabel="Current energy level (active demo)"
            active
          />
        </div>
      </Section>

      <Section title="IntensitySlider — 5 segments (mood/emotion intensity)">
        <IntensitySlider
          value={fiveSegmentValue}
          onChange={setFiveSegmentValue}
          ariaLabel="Emotion intensity"
          segments={5}
          active
        />
      </Section>

      <Section title="IconTapTarget">
        <div className="flex items-center gap-2">
          <IconTapTarget icon={ArrowLeft} aria-label="Go back" />
          <IconTapTarget icon={MagnifyingGlass} aria-label="Search" />
          <IconTapTarget icon={ArrowLeft} aria-label="Disabled example" disabled />
          <div className="flex size-14 items-center justify-center rounded-hero bg-warm">
            <IconTapTarget icon={X} aria-label="Close" tone="white" />
          </div>
        </div>
      </Section>

      <Section title="GradientCircleButton">
        <div className="flex items-center gap-4 pt-8">
          <GradientCircleButton icon={Plus} weight="bold" size={72} aria-label="Add" />
          <GradientCircleButton icon={Plus} weight="bold" size={72} aria-label="Add (disabled)" disabled />
        </div>
        <p className="font-sans text-xs text-ink/60">
          New component (node 109:4143) — a 3-stop gradient circle with a flat solid border, a 2-layer diagonal-offset inset shadow, and a white highlight shape behind it. Distinct from IconTapTarget, which stays flat for plain nav icons.
          Uses <code>weight=&quot;bold&quot;</code> here, not the default <code>&quot;fill&quot;</code> — Phosphor's fill-weight Plus is a rounded-square add-badge, not the plain cross this button's source actually shows.
          Shown here at <code>size={'{'}72{'}'}</code> per direct request, matching the tab bar's FAB — 109:4143 itself is still 88px unconfirmed-changed, so the component's own default stays 88, this preview instance just overrides it.
        </p>
      </Section>
    </div>
  )
}
