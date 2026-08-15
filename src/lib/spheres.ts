import { PersonArmsSpread, PiggyBank, Heart, TennisBall, HouseLine, UsersFour, BookOpen, TrendUp, BatteryVerticalLow, BatteryVerticalMedium, BatteryVerticalHigh } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

/** The 8-sphere list, per the brief — fixed regardless of which icons are confirmed below. */
export type SphereId = 'health' | 'finances' | 'romance' | 'funHobbies' | 'homeEnvironment' | 'family' | 'personalGrowth' | 'work'

export interface SphereDef {
  id: SphereId
  label: string
  icon: Icon
}

/**
 * Icon/label per life sphere — all 8 now confirmed against node 109:2863
 * (the real "Life area" picker on the intention-setting screen), each
 * Phosphor's stock "fill" weight. PersonArmsSpread (Health), PiggyBank
 * (Finances), and HouseLine (Home) were individually diffed against
 * @phosphor-icons/react's own source (exact coordinate match after
 * scaling); Heart/TennisBall/UsersFour/BookOpen weren't each individually
 * diffed but come from the same 109:2863 export batch at the same weight,
 * so treated as consistent rather than re-verified one by one — flag if
 * any turns out to need a closer look.
 *
 * `homeEnvironment`'s label is just "Home" (Fix 24 — explicit direct
 * correction, shortened from "Home & environment"), re-verified against
 * 178:8845's own "Life areas" sheet, which literally shows the short
 * form — this is a single shared registry, so the shorter label now
 * applies everywhere a sphere's label renders (the picker sheet, the area
 * dropdown, saved-intention recap chips, CompletionSummaryCard's spheres
 * row), not just one screen.
 */
export const SPHERES: Record<SphereId, SphereDef> = {
  health: { id: 'health', label: 'Health', icon: PersonArmsSpread },
  finances: { id: 'finances', label: 'Finances', icon: PiggyBank },
  romance: { id: 'romance', label: 'Romance', icon: Heart },
  funHobbies: { id: 'funHobbies', label: 'Fun & hobbies', icon: TennisBall },
  homeEnvironment: { id: 'homeEnvironment', label: 'Home', icon: HouseLine },
  family: { id: 'family', label: 'Family', icon: UsersFour },
  personalGrowth: { id: 'personalGrowth', label: 'Personal growth', icon: BookOpen },
  work: { id: 'work', label: 'Work', icon: TrendUp },
}

export type EnergyLevel = 'low' | 'medium' | 'high'

/**
 * Battery icon per energy level — verified against 109:4252 for `low`
 * only (BatteryVerticalLow, fill weight, `#E067A9`). Phosphor also ships
 * BatteryVerticalMedium/High as the natural counterparts, so those are
 * used for the other two levels, but neither their exact icon choice nor
 * `#E067A9` reused across all three is confirmed by Figma for anything
 * but `low` — flagged here rather than presented as verified.
 */
export const ENERGY_LEVEL_ICON: Record<EnergyLevel, Icon> = {
  low: BatteryVerticalLow,
  medium: BatteryVerticalMedium,
  high: BatteryVerticalHigh,
}

/** Only `low`'s tint (`#E067A9`) is confirmed by Figma — see the doc comment above. */
export const ENERGY_LEVEL_COLOR = '#E067A9'
