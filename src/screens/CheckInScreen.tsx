import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompletionSummaryCard } from '../components/CompletionSummaryCard'
import type { DayLog } from '../components/CompletionSummaryCard'
import type { DayDetailNavState } from './DayDetailScreen'
import { DaySummaryCard } from '../components/DaySummaryCard'
import { PracticesEmptyIllustration } from '../components/PracticesEmptyIllustration'
import { PracticeCard } from '../components/PracticeCard'
import { HomeHeader } from '../components/HomeHeader'
import { SecondaryNav } from '../components/SecondaryNav'
import type { SecondaryNavSection } from '../components/SecondaryNav'
import { CheckInMenuSheet } from '../components/CheckInMenuSheet'
import { getGreeting } from '../lib/greeting'
import { getDisplayName } from '../lib/displayName'
import { useDayLogStore } from '../lib/dayLogStore'
import { useAuth } from '../lib/authStore'
import { fetchPastDayBundles } from '../lib/dayLogHistory'
import { QUADRANT_TO_MOOD_CATEGORY } from '../lib/moodCategories'
import { TECHNIQUES } from '../lib/moodTechniques'
import { cn } from '../lib/cn'

/**
 * Home screen. HomeHeader (Fix 19) is verified against 117:5748 and is
 * full-bleed — it sits outside this screen's usual `px-5` page padding so
 * its gradient background can reach the true screen edges, with the rest
 * of the content (SecondaryNav, "Today" title/day-log card) kept inset
 * in a separate `px-5` wrapper below it.
 *
 * SecondaryNav (Fix 18, verified against 117:5758) sits exactly 20px
 * below HomeHeader (`mt-5` — Fix 19's own spec) and exactly 20px above
 * the "Today" title (`mt-5` on that block — explicit direct request,
 * superseding Fix 18's original 32px/Figma-derived value).
 *
 * The main content area under "Today" (Fix 21) now reads real state from
 * the shared day-log store (Stage 4) instead of its own dev toggle:
 * `intentions` (+ `dayLog.energy`, always set alongside them —
 * `submitMorningIntentions` writes both atomically) become
 * CompletionSummaryCard's `intention`; mood check-ins stay empty (Stage
 * 4b's own territory, not built yet). `DaySummaryCard`'s full empty state
 * still renders when there's neither.
 *
 * `gladAboutDay` aggregates every REFLECTED intention's outcome into one
 * day-level boolean ("glad" only once ALL of them were glad — one "not
 * really" among them reads as false for the day), staying undefined until
 * at least one intention has been reflected on. CompletionSummaryCard no
 * longer renders a thumbs icon at all (review fix — one-per-intention
 * would overcrowd the card now that up to 3 intentions/day exist), so
 * this value currently has no visual consumer on this screen; it's kept
 * on the `DayLog` shape for other future consumers rather than dropped.
 *
 * The empty-state DaySummaryCard is also a real entry point into the
 * check-in menu now (tapping it opens the same CheckInMenuSheet the tab
 * bar's floating button opens) — explicit direct request, not from
 * 117:5768 (visual-only, no interaction states). This screen owns its
 * own sheet-open state rather than sharing BottomNav's: the two triggers
 * live in different components with no shared parent state today, and
 * CheckInMenuSheet itself is a plain controlled component (just
 * open/onClose props), so a second independent instance is the
 * lower-risk option over introducing a new cross-component store for
 * one boolean.
 *
 * Empty state now has two distinct heights depending on whether the user
 * has EVER logged anything, not just today (review fix — this used to be
 * one `DaySummaryCard` treatment regardless):
 *  - Genuinely nothing logged, ever (`isCompleteEmpty`, checked against
 *    `hasPastEntries` below — a lightweight reuse of the same
 *    `fetchPastDayBundles` query `EntriesScreen`/`PatternsScreen` already
 *    run for their own history, just read for existence, not full data):
 *    `DaySummaryCard` grows (`flex-1`) to fill the space this screen
 *    already stretches to fill above TabLayout's pinned tab bar, with a
 *    fixed `mb-[77px]` reserved below it — unchanged from before this fix.
 *    Rather than un-pinning the tab bar (which would need a `TabLayout`
 *    change affecting every tab screen) or leaving a viewport-dependent
 *    gap, the CARD's own height is what shrinks, so the gap below it is
 *    real regardless of viewport height. That margin isn't 40px on its
 *    own — the floating "+" button's own circle pokes up 37px above the
 *    bar it sits on (`TAB_BAR_FAB_GLOW.top` in BottomNav), so 77px (40 +
 *    37) is what actually lands a 40px gap on the BUTTON itself, not just
 *    the bar behind it.
 *  - Today's empty but real history exists (explicit direct request, per
 *    Figma): `DaySummaryCard` instead hugs its own natural content height
 *    (`h-[166px]`, this state's own Figma-specified number — not derived
 *    from flex/stretch math like the case above), same treatment
 *    `CompletionSummaryCard` already gets when there IS real content.
 *
 * This screen's own root drops its usual `pb-8` ONLY for the
 * `isCompleteEmpty` branch — that bottom padding exists for every OTHER
 * case (natural-height content, whether `CompletionSummaryCard` or the
 * new hugging `DaySummaryCard`), but for the flex-1/`mb-[77px]` case it
 * would just add 32px past where the card's own margin already lands the
 * bar.
 *
 * Review fix — SecondaryNav's two sections now actually diverge: `notes`
 * is everything described above; `practices` is a new, separate branch
 * showing the favorited-techniques list (`PracticeCard.tsx`) or its own
 * `DaySummaryCard`-recipe empty state, reading/writing the shared store's
 * `favoriteTechniqueIds`. No Figma node exists for this yet — built from
 * established patterns only, per that fix's own summary. The old
 * `key={section}` remount trick is gone: it existed only because both
 * sections rendered the identical placeholder before, which no longer
 * applies now that they render genuinely different content.
 *
 * Review fix — short-viewport compression, same `clamp(MIN, a·vh + b, MAX)`
 * mechanism OnboardingScreen's own doc comment established (companion to
 * that screen's `h-dvh` fix, reused here on `TabLayout`'s own container):
 * on a short enough real viewport this screen's intrinsic content height
 * (header + SecondaryNav + title + card) can exceed the space
 * `TabLayout`'s `flex-1 overflow-y-auto` region has available, which used
 * to just scroll internally rather than compress. The two `mt-5` gaps
 * (HomeHeader→SecondaryNav, SecondaryNav→title) and the title→card `gap-3`
 * are now the compressible ones — `MAX` in each is this screen's own
 * original value, so nothing changes at any normal/larger viewport height;
 * `MIN` is a floor that keeps rows from crowding. Deliberately NOT
 * touched: `mb-[77px]` (empty-state gap to the floating button) and the
 * root's `pb-8` (gap to the tab bar with real content) — both stay fixed,
 * per this screen's own non-negotiable clearance around the FAB/tab bar.
 * Anchored to the same 800px/560px viewport-height reference points
 * Onboarding's own gaps use, so a device short enough to compress one
 * screen compresses the other by a comparable amount.
 */
export function CheckInScreen() {
  const navigate = useNavigate()
  const [section, setSection] = useState<SecondaryNavSection>('notes')
  const [menuOpen, setMenuOpen] = useState(false)
  const { dayLog, intentions, moodCheckIns, favoriteTechniqueIds, toggleFavoriteTechnique } = useDayLogStore()
  const { userId } = useAuth()

  // Existence-only check, reusing the same query EntriesScreen/PatternsScreen
  // already run for their own real history — see this component's own doc
  // comment for why the true-empty vs. today-only-empty distinction needs
  // this at all.
  const [hasPastEntries, setHasPastEntries] = useState(false)
  useEffect(() => {
    if (!userId) {
      setHasPastEntries(false)
      return
    }
    let cancelled = false
    fetchPastDayBundles(userId).then((bundles) => {
      if (!cancelled) setHasPastEntries(bundles.length > 0)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const reflectedIntentions = intentions.filter((intention) => intention.reflectedAt !== null)
  const dayLogView: DayLog = {
    date: new Date(),
    intention: intentions.length > 0 && dayLog?.energy ? { spheres: intentions.map((i) => i.sphere), energyLevel: dayLog.energy } : undefined,
    gladAboutDay: reflectedIntentions.length > 0 ? reflectedIntentions.every((intention) => intention.glad === true) : undefined,
    moodCheckIns: moodCheckIns.map((m) => ({ id: m.id, emotion: m.emotion, categoryId: QUADRANT_TO_MOOD_CATEGORY[m.quadrant] })),
  }
  const hasDayContent = !!dayLogView.intention || dayLogView.moodCheckIns.length > 0
  const isCompleteEmpty = !hasDayContent && !hasPastEntries

  // Review fix — no Figma node for this list yet (see PracticeCard.tsx's
  // own doc comment). `.filter((t): t is ... => ...)` drops any stale id
  // that no longer matches a real `TECHNIQUES` entry, a defensive guard
  // that can't actually happen today (ids only ever come from that same
  // list) but costs nothing and avoids a crash if that ever changes.
  const favoriteTechniques = favoriteTechniqueIds.map((id) => TECHNIQUES.find((t) => t.id === id)).filter((t): t is (typeof TECHNIQUES)[number] => t !== undefined)

  const openDayDetail = () => {
    const detailState: DayDetailNavState = {
      date: dayLogView.date.toISOString(),
      energy: dayLog?.energy ?? null,
      energyTime: dayLog?.createdAt ?? null,
      intentions,
      moodCheckIns,
    }
    navigate('/day', { state: detailState })
  }

  return (
    <div className={cn('flex min-h-full flex-col', !isCompleteEmpty && 'pb-8')}>
      <HomeHeader greeting={getGreeting(getDisplayName())} onProfileClick={() => navigate('/profile')} />

      <div className="flex flex-1 flex-col px-5">
        {/* self-start — the switcher should hug its own content width, not stretch to the row's full width the way a flex-column child does by default. */}
        <SecondaryNav activeSection={section} onSectionChange={setSection} className="mt-[clamp(0.5rem,5vh_-_20px,1.25rem)] self-start" />

        {section === 'notes' ? (
          // gap-3 (12px) is an explicit request, applying uniformly regardless of which card renders below "Today" — superseding Fix 17's original 18px (node 117:5768's own title-to-card spacing). mt-5 keeps this block exactly 20px below SecondaryNav (explicit request, superseding Fix 18's original 32px). flex-1 (only when truly empty) lets DaySummaryCard grow into this block's own stretch — see this component's own doc comment for why that's now `isCompleteEmpty`, not just `!hasDayContent`. Title is text-lg (18px) — explicit direct correction, was text-xl (20px).
          <div className={cn('mt-[clamp(0.5rem,5vh_-_20px,1.25rem)] flex flex-col gap-[clamp(0.375rem,2.5vh_-_8px,0.75rem)]', isCompleteEmpty && 'flex-1')}>
            <h2 className="font-serif text-lg text-ink">Today</h2>
            {hasDayContent ? (
              <CompletionSummaryCard {...dayLogView} onClick={openDayDetail} />
            ) : isCompleteEmpty ? (
              // `flex-1` shrinks the card to leave exactly 40px before the
              // floating "+" button itself (explicit direct correction — not
              // the bar's own top edge): the button's circle pokes up 37px
              // above the bar (BottomNav's own `TAB_BAR_FAB_GLOW.top`), so the
              // margin reserved here is 40 + 37 = 77px to land the gap on the
              // BUTTON, not the bar behind it — see this component's own doc
              // comment.
              <DaySummaryCard onClick={() => setMenuOpen(true)} className="mb-[77px] flex-1" />
            ) : (
              // Today's empty but real history exists — this state's own
              // Figma-specified height (166px), hugging its own content
              // instead of stretching. See this component's own doc comment.
              <DaySummaryCard onClick={() => setMenuOpen(true)} className="h-[166px]" />
            )}
          </div>
        ) : (
          // Practices subtab (review fix) — no Figma node yet, see
          // PracticeCard.tsx's own doc comment. Mirrors the Notes branch's
          // own rhythm (mt-5, gap-3, flex-1-when-empty) rather than inventing
          // a different one.
          <div className={cn('mt-[clamp(0.5rem,5vh_-_20px,1.25rem)] flex flex-col gap-[clamp(0.375rem,2.5vh_-_8px,0.75rem)]', favoriteTechniques.length === 0 && 'flex-1')}>
            <h2 className="font-serif text-lg text-ink">Practices</h2>
            {favoriteTechniques.length > 0 ? (
              <div className="flex flex-col gap-2">
                {favoriteTechniques.map((technique) => (
                  <PracticeCard key={technique.id} technique={technique} onUnfavorite={() => toggleFavoriteTechnique(technique.id)} />
                ))}
              </div>
            ) : (
              <DaySummaryCard
                icon={<PracticesEmptyIllustration className="size-[44px] object-contain" />}
                title="No favorite practices yet"
                subtitle="Favorite a technique from a mood check-in to save it here."
                className="mb-[77px] flex-1"
              />
            )}
          </div>
        )}
      </div>

      <CheckInMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
