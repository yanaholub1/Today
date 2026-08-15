import { PillSubtabSwitcher } from './PillSubtabSwitcher'

export type SecondaryNavSection = 'notes' | 'practices'

export interface SecondaryNavProps {
  activeSection: SecondaryNavSection
  onSectionChange: (section: SecondaryNavSection) => void
  className?: string
}

const SECTIONS: { id: SecondaryNavSection; label: string }[] = [
  { id: 'notes', label: 'Notes' },
  { id: 'practices', label: 'Practices' },
]

/**
 * Section switcher (Notes/Practices) above the Check-in home screen's main
 * content. Review fix: replaced with the pill-style switcher — verified
 * against node 294:2304, byte-identical to `PillSubtabSwitcher`'s existing
 * `pill-switch-active` recipe (already built for the Patterns tab's own
 * Intention/Mood switcher, 323:4609), so this reuses that component
 * directly rather than a second implementation of the same look. The old
 * underline `TabSwitcher` treatment (and the "All time" date-filter chip
 * that used to sit alongside it — not part of 294:2304, dropped per
 * explicit direct request) are both gone; `TabSwitcher.tsx` itself was
 * deleted since this was its only remaining caller.
 */
export function SecondaryNav({ activeSection, onSectionChange, className }: SecondaryNavProps) {
  return <PillSubtabSwitcher items={SECTIONS} activeId={activeSection} onChange={onSectionChange} className={className} />
}
