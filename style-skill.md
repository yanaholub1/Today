# Skill: Tiny Apps — Soft Wellness UI

## Purpose

This skill helps AI tools generate and implement new UI in the same visual style as the "Today" section of the Tiny Apps Figma file (22 mobile screens — journaling / mood / wellness micro-app concepts).

Use this skill when working in:

- Figma Make
- Claude Code
- Codex
- Cursor
- VS Code AI tools
- Lovable
- Replit
- other AI builders

## Source & Confidence

### Source

Figma design file "Tiny apps", section "Today" (node 109:2862, file `wrEkyAK0ls2W719lDz5J2v`), containing 22 iPhone 16 mobile screens. Analyzed via Figma MCP: `get_metadata` (full node tree), `get_design_context` (extracted React+Tailwind code with real values) on two representative screens — the intention/mood hero screen (109:4148) and the emotion-picker screen (109:3408) — plus a full-section screenshot and two per-screen screenshots at higher resolution. `get_variable_defs` returned no bound Figma Variables (the file uses hard-coded values, not tokens).

### Confidence

High for the two screens pulled via `get_design_context` (exact hex values, exact font names, exact radii and shadows came from generated code, not visual estimation). Medium for the other 20 screens, judged only from the mosaic screenshot — they clearly share the same visual language (rose/pink surfaces, rounded cards, serif headlines) but exact values on those screens are unconfirmed.

### Limitations

Only 2 of 22 screens were inspected at the code level. Component states (hover/focus/error/disabled) are not visible in a static Figma file — only default and one "selected" state (seen on chips) were confirmed. No Figma Variables exist, so there is no semantic token layer to inherit — all values below are literal.

## Style DNA Summary

A soft, editorial wellness aesthetic: candy-pink and blush surfaces paired with a classic serif display face for emotional, human headlines, set against small-caps-free sans-serif UI text. Every card, pill, and chip has an inset "glassy" highlight (a light-catching sheen built from stacked inset box-shadows) that makes flat pink shapes read as gently embossed, almost like soap or ceramic — not flat Material/SaaS design and not a hard neumorphic style either. Density is spacious and centered for hero/action screens, compact and grid-based for choice/selection screens.

## Design Principles

- Serif headlines carry emotional weight: every screen title or hero label ("Set intention," "Mood check-in," "Which emotion fits best?") is set in Young Serif, while all supporting UI text (buttons, chips, labels, status bar) stays in a plain sans (Figtree for product UI, Inter reserved for the iOS status bar chrome).
- Surfaces get a manufactured sheen, not a flat fill: nearly every card, pill, and chip carries 3–4 stacked `inset` box-shadows (soft white glow on left/right edges, a darker inset near the bottom, a bright inset near the top) that fake curved, light-catching material on top of a flat color fill.
- Color communicates energy, not hierarchy: warm pink/rose (`#f83b7d` → `#a7668b` family) marks "hot"/high-energy or primary/selected states; a cool lavender-blue (`#d9e7fc`) marks calm/low-energy states; both sit on the same neutral blush background family, so hue itself is the signal, not saturation or size.
- Pills over rectangles for choices: single-select and filter controls (emotion filters, energy pills) use fully or near-fully rounded shapes (12px cards, 400px pill filters) rather than square chips.
- Two-tier corner rounding on hero cards: large action cards round only the outer edge that touches the screen edge (e.g., bottom card rounds only its top corners, top card rounds only its bottom corners), so two stacked hero cards read as one continuous rounded surface split by a hairline gap.
- Dark, desaturated navy for all body copy: text is never pure black — it's `#2f374a`, a soft blue-charcoal that stays legible on both pink and white without the harshness of `#000`.
- Thin, tinted borders instead of drop shadows for card definition: nearly every card/chip has a 1–2px border in a lighter tint of its own fill family, not a drop shadow, which keeps the UI feeling flat/paper-like at the silhouette level even though the sheen shadows add interior depth.

## Signature Style Elements

1. Young Serif display headlines (28px on hero screens, 20px on list/picker screens), regular weight, tight tracking (-0.16 to -0.28px), always centered or left-aligned to a simple icon.
2. "Glassy sheen" inset shadow recipe on every filled surface (see Shadows & Elevation).
3. Two-tone hero action cards: a saturated pink card stacked directly on a pale blush card, split by rounded corners only on the outer edges (24px radius).
4. Pill-shaped segmented filters (400px radius) that overlap by -28px margin so they visually fuse into one continuous capsule row, with the active segment given a solid fill and the rest given a flat off-white fill.
5. Dual-color choice grid: identical pill/card components repeated in a 2-column grid, color-coded pink-family for "hot" options and blue-family (`#d9e7fc`) for "cool" options — no third neutral color is used for unselected default state within a scale.
6. Rating/intensity slider as a large rounded capsule track (44px radius) with a pink gradient fill, dot markers, and pill-shaped active ticks — not a standard native slider.
7. Consistent 12px corner radius for small choice cards/chips, 24px for hero/section cards, ~400–44px ("pill") for filters and sliders — three tiers, no in-between radius values observed.
8. Flat icon-in-circle pattern: 40×40px tap targets with a centered 24px line icon (Phosphor-style icon set — PersonArmsSpread, PiggyBank, HouseLine, ArrowLeft, MagnifyingGlass, etc.), no background fill on the icon button itself.
9. iOS status bar (9:41, signal, 5G, battery) and home indicator reproduced pixel-accurately in Inter Semibold 15px — a strong signal these are meant to be read/prototyped as real native-feeling screens, not marketing mockups.

## Evidence Map

### Extracted

- Fonts: `Young Serif` (Regular) for headlines/titles; `Figtree` (Medium / SemiBold) for body, labels, buttons, chip text; `Inter` (Semibold) for iOS status bar text only.
- Colors: hero pink fill `#f83b7d`, hero border `#ed6393`; pale blush card fill `#fcdaec`/`#fbdaec`; body/heading text `#2f374a`; selected pink chip fill `#a7668b` (white text) with border `#debed0`; unselected pink chip fill `#f8edf3`; unselected blue chip fill `#d9e7fc` with border `#e7eef8`; filter pill fills `#f8edf3` (active) / `#fbf8fa` (inactive) with borders `#e9cedd` / `#ddd4da`; slider track gradient `#fbbee0` → `#fbdbed` with border `#ffd6ed`; page background/section divider `#fdebe2`.
- Radii: 24px (hero cards), 12px (choice cards/chips), 400px (filter pills), 44px (slider track), 100px (home indicator pill).
- Borders: 1–2px solid, always a lighter tint of the fill.
- Shadow recipe (hero card): `inset -16px 0 40px rgba(255,255,255,.32), inset 16px 0 40.9px rgba(255,255,255,.32), inset 0 -12px 16px rgba(193,64,135,.3), inset 0 20px 40px rgba(255,255,255,.24)`.
- Shadow recipe (choice chip): `inset -8px 0 20px rgba(255,255,255,.32), inset 8px 0 20px rgba(255,255,255,.32), inset 0 -1px 5px rgba(73,38,57,.57), inset 0 16px 20px rgba(255,255,255,.2)`.
- Text sizes: 28px headline (hero), 20px headline (picker screens), 18px section label, 16px body/button/chip, 15px status bar.
- Layout: 393px iPhone 16 frame, 20px horizontal screen padding, 24px top content offset below status bar, 24px gap between stacked hero cards.

### Inferred

- The remaining 20 unopened screens (visible only in the mosaic screenshot) follow the same rose/blush palette, serif-headline + sans-body pairing, and rounded-card language — some substitute a dark navy card (top-right thumbnail) for the pink hero, suggesting a dark/alternate hero variant exists but its exact values are unconfirmed.
- Overall density: hero/action screens are sparse and centered (1–2 focal elements); list/picker screens are dense grids — this rhythm likely repeats across the other screens based on the mosaic.
- Icon set is Phosphor-style regular-weight line icons based on visual match (PersonArmsSpread, PiggyBank, Heart, TennisBall, HouseLine, UsersFour, BookOpen, ArrowLeft, MagnifyingGlass, LightningSlash, CloudLightning, Sparkle, MoonStars) — library not confirmed from source, only visual style.

### Suggested

- Semantic token names for implementation: `color-surface-hero`, `color-surface-hero-border`, `color-surface-card`, `color-text-primary`, `color-state-warm-selected`, `color-state-warm-default`, `color-state-cool-default`, `radius-hero` (24px), `radius-card` (12px), `radius-pill` (400px/44px).
- Component naming: `HeroActionCard`, `ChoiceChip` (warm/cool variant, selected/default state), `SegmentedFilterPill`, `IntensitySlider`, `IconTapTarget`.
- Additional states to design before implementation: hover/pressed, focus-visible, disabled, loading, and empty states — none are present in the source file.

### Unresolved

- No Figma Variables/tokens exist in the file — all values are hard-coded per layer, so there is no confirmed semantic naming from source.
- Exact icon library/version is not confirmed (only visual style matched to Phosphor).
- Motion/transition behavior — the file is static; no animation data available.
- Full detail on the other 20 screens (only the mosaic thumbnail was reviewed for those).
- Dark-mode/alternate hero variant seen faintly in the mosaic was not opened for exact values.

## Visual Foundations

### Color System

- Primary "warm" accent: `#f83b7d` (hero fill) with `#ed6393` border — used for the single most important action per screen (hero card, selected/active chip).
- Warm mid-tone: `#a7668b` — selected state for a warm-family chip, paired with white text.
- Warm pale surfaces: `#fcdaec` / `#fbdaec` / `#f8edf3` — default/unselected surfaces in the warm family, paired with `#2f374a` text.
- Cool accent (secondary energy state): `#d9e7fc` fill with `#e7eef8` border — used only as the "calm/low-energy" counterpart to warm chips, never as a primary action color.
- Neutral off-white: `#fbf8fa` — inactive filter pill fill.
- Text: `#2f374a` for all body/heading text on light surfaces; pure white for text on the saturated `#f83b7d`/`#a7668b` surfaces.
- Page/system: white page background, `#fdebe2` hairline divider under status bar area.
- Usage rule: warm pink = primary/active/hot; cool blue = secondary/calm state within the same control type; never mix warm and cool as two options in a binary primary/secondary button pair — the warm/cool split is reserved for content-meaning (energy level), not UI hierarchy.

### Typography System

- Display/headline: Young Serif, Regular, 20–28px, tight tracking (-0.16 to -0.28px), used only for screen titles and hero labels — never for body copy or buttons.
- UI/body: Figtree, Medium/SemiBold, 16–18px, used for all buttons, chip labels, section labels, and helper text.
- System chrome only: Inter, Semibold, 15px — reserved for the iOS status bar (time, network, battery); do not use Inter for product UI.
- Exact font weights beyond Regular/Medium/SemiBold/Semi Bold are unresolved — no Light, Bold, or Black weights were observed in the two inspected screens.

### Spacing & Layout Rhythm

- Screen padding: 20px horizontal.
- Top content offset: 24–58px below the status bar depending on screen type (hero screens sit content lower/centered; list screens start content near the top).
- Stacked hero cards: 24px gap between the two cards, each card `flex: 1 0 0` (equal height split).
- Chip/pill grids: 8px gap between chips, 12px gap between stacked filter rows.
- Card internal padding: ~12px vertical for choice chips.

### Radius, Borders & Dividers

- Three-tier radius system only: 12px (small cards/chips), 24px (hero/section cards, applied asymmetrically — only the outward-facing corners), 44–400px (pills: sliders and filters).
- Every filled surface has a 1–2px solid border in a lighter tint of its own fill — borders define silhouette; shadows define interior depth. No plain drop shadows were observed anywhere in the source.

### Shadows & Elevation

- The UI is flat in silhouette (thin tinted borders, no external drop shadow) but glassy/dimensional inside each shape via 3–4 stacked `inset` box-shadows per surface: a soft white glow hugging the left and right inner edges, a colored inset near the bottom (using a darkened tint of the surface's own hue) for weight, and a bright white inset near the top for a light-source highlight. This recipe should be treated as a single reusable "sheen" effect, applied to hero cards, chips, pills, and the slider track alike — only the color values inside the shadow change per surface color family.

### Iconography

- Style: regular-weight outline icons, roughly 24px, centered inside 40px circular tap targets with no background fill on the button itself (icon-only, no chip around individual icon buttons like back/search).
- Visual match to Phosphor Icons' "regular" style — not confirmed as the actual library.
- Icon + label pairing (in choice lists like "Life area"): icon sits left, label sits to its right at a fixed 45px offset, both vertically centered.

## Layout System

- Base frame: iPhone 16, 393×852 (or 393×874/1123 for taller/scrollable screens).
- Two dominant screen archetypes: (1) Hero/action screen — one or two full-bleed rounded cards stacked vertically, each centered content, minimal text, single icon + serif label; (2) Picker/list screen — top nav row (back arrow, serif title, search icon) followed by a scrollable stack of grouped choice grids and a bottom slider or CTA.
- Bottom of every screen: iOS home indicator (134×5px pill, `rgba(23,23,28,0.9)`, 100px radius), consistently 21px from the bottom edge.

## Component Style Rules

### HeroActionCard

#### Purpose
Full-width, large tap target that represents the single primary action on a screen (e.g., "Set intention," "Mood check-in").

#### Anatomy
Icon or illustration (centered), serif label below it, full "sheen" shadow treatment, asymmetric outer-corner rounding.

#### Visual Style
24px radius on outward-facing corners only; 2px border in a lighter tint of the fill; fill is either the saturated warm accent (`#f83b7d`) or a pale surface (`#fcdaec`); text is white on saturated fill, `#2f374a` on pale fill; Young Serif 28px label with 16px gap above/below.

#### Variants
Saturated/primary (used once per screen, at most) and pale/secondary — confirmed via the two-card stack in the hero screen.

#### States
Default only confirmed. Suggested: pressed (scale/opacity dip), disabled (desaturate fill, drop border to neutral gray).

#### Behavior
Tap navigates to or launches the associated flow (intention-setting, mood check-in, etc.).

#### Implementation Notes
Build the sheen as a single reusable CSS `box-shadow` mixin/utility parameterized by the surface's base hue, not hand-authored per component.

### ChoiceChip

#### Purpose
Single- or multi-select option in a grid of choices (emotion, energy level, activity, etc.).

#### Anatomy
Rounded rectangle container, centered Figtree Medium 16px label, optional leading icon in list-style variants.

#### Visual Style
12px radius; 1px border in a lighter tint; warm family (`#a7668b` selected / `#f8edf3` default) or cool family (`#d9e7fc`, one state only observed) fill; same inset-sheen shadow recipe scaled down.

#### Variants
Warm-selected, warm-default, cool-default (no cool-selected state was present in source — mark as Unresolved/Suggested if needed).

#### States
Default and selected confirmed. Suggested: hover, focus-visible, disabled.

#### Behavior
Tap toggles selected state within a single-select or multi-select group; selected state swaps fill to the saturated tone and text to white (warm family only).

#### Implementation Notes
Keep warm/cool as a fixed "family" prop, not a runtime-computed color, since the two families use different border and shadow tint values, not just different fills.

### SegmentedFilterPill

#### Purpose
Horizontal row of icon-only quick filters plus a "See all" text action.

#### Anatomy
Row of pill segments that overlap by -28px margin to fuse into one continuous capsule, each containing a centered 28px icon; trailing "See all" label outside the group.

#### Visual Style
400px radius per segment; active segment gets the pale-pink fill (`#f8edf3`) and a subtle inset shadow; inactive segments use off-white (`#fbf8fa`) with a neutral border (`#ddd4da`); z-index stacking (`z-4` down to `z-1`) keeps the leading (active) segment's border visible above the others.

#### Variants
Active (first segment in source) vs. inactive — only one active state per row was observed.

#### States
Default/active only. Suggested: pressed, focus-visible.

#### Behavior
Tapping a segment filters the list below; "See all" presumably opens an expanded picker (behavior not visible in a static file).

#### Implementation Notes
The -28px overlapping margin is a specific fusion technique — replicate with negative margin or a shared border-radius mask, not by drawing one shape with dividers.

### IntensitySlider ("Rating bar")

#### Purpose
Lets the user set a strength/intensity value on a Low–Medium–High scale.

#### Anatomy
Wide rounded track, gradient fill, 8 evenly spaced tick marks (mix of small dots and larger pill ticks), a larger drag handle/thumb, and a 3-label row (Low / Medium / High) beneath.

#### Visual Style
44px track radius; pink gradient `#fbbee0` → `#fbdbed` with `#ffd6ed` border; sheen shadow scaled to the track; ticks are 6px circles except three pill-shaped 8×20px accent ticks at even intervals.

#### Variants
Only one (pink/warm) variant observed.

#### States
Default only. Suggested: dragging/active thumb state, value-change feedback.

#### Behavior
Presumed drag-to-set interaction along the horizontal track; exact interaction model (drag vs. tap-to-set) is unresolved from a static file.

#### Implementation Notes
Implement as a custom slider component (not a native `<input type="range">` styled directly) since the tick/thumb visuals are bespoke.

### IconTapTarget

#### Purpose
Icon-only button for navigation/utility actions (back, search, close).

#### Anatomy
40×40px hit area, 24px centered line icon, no visible background or border.

#### Visual Style
No fill; icon color matches surrounding text color (`#2f374a` on light screens, white on the pink hero card via the "X" close icon).

#### Variants
None beyond icon swap.

#### States
Default only confirmed. Suggested: pressed (opacity dip), focus-visible (ring).

#### Behavior
Standard tap-to-navigate/close.

#### Implementation Notes
Keep the 40px hit target even though the icon itself is 24px — preserves consistent touch-target sizing across the file.

## Interaction & Behavior Patterns

- Primary actions are always full-width hero cards, not small buttons — the whole card is the tap target.
- Selection controls (chips, filter pills) use fill-color swap plus text-color swap as the sole selected-state signal — no checkmarks or borders-only indicators were observed.
- Screens follow a "set up → confirm/rate" pattern: pick a category or emotion, then rate its intensity on a slider — this two-step rhythm repeats across the picker screens seen in the mosaic.
- No loading, error, or empty states are present in the source; these must be designed fresh, in the same visual language (Suggested, not Extracted).

## Content & Microcopy Style

- Short, second-person, present-tense prompts framed as questions or gentle instructions: "What matters most today?", "Which emotion fits best?", "How strong is it?"
- Field placeholders are plain and literal: "Type your focus for today."
- Section labels are short nouns/noun phrases: "Life area," "Today," "July."
- No exclamation points, no emoji observed in the two inspected screens.

## Accessibility Rules

- Text-on-saturated-fill uses white on `#f83b7d`/`#a7668b`; verify contrast ratio when reusing at smaller sizes (16px chip labels on `#a7668b` should be checked against WCAG AA).
- Warm vs. cool state is currently color-only (pink vs. blue fill) — recommend adding a secondary non-color indicator (icon or label change) for colorblind accessibility since this is a Style Loss Risk area not addressed in source.
- Icon-only tap targets (back, search, close) have no visible text label — ensure `aria-label`/accessible name is added in implementation since the source is visual-only.
- Focus states are entirely unresolved from source; must be added without breaking the established sheen/border visual language (e.g., a colored outline ring rather than a fill change).

## Design-to-Code Mapping

- Suggested component boundaries: `HeroActionCard`, `ChoiceChip`, `SegmentedFilterPill`, `IntensitySlider`, `IconTapTarget`, plus a shared `SheenSurface` wrapper/mixin that any of the above can compose for the inset-shadow treatment.
- Suggested CSS variables: `--radius-hero: 24px; --radius-card: 12px; --radius-pill: 400px; --color-warm-strong: #f83b7d; --color-warm-mid: #a7668b; --color-warm-pale: #f8edf3; --color-cool-pale: #d9e7fc; --color-text: #2f374a;`
- Do not hard-code the sheen shadow per component — extract it into one shared shadow utility/mixin parameterized by base hue, since the same 4-layer recipe repeats (with different opacity/color per surface) across hero cards, chips, pills, and the slider track.
- Font loading: Young Serif and Figtree must both be loaded (Google Fonts hosts both); Inter is only needed if reproducing native status-bar chrome for prototyping purposes and can be dropped in a real product build.

## Figma Make Usage Rules

Do:
- Generate new screens using the same two-archetype structure (hero/action screen vs. picker/list screen).
- Preserve the serif-headline + sans-body pairing exactly — never substitute a sans-serif display font.
- Reuse the sheen shadow recipe on any new filled surface (cards, chips, pills, sliders).
- Keep the warm/cool color split reserved for content-meaning (energy/mood), not generic primary/secondary UI hierarchy.
- Match the 393px mobile frame, 20px screen padding, and three-tier radius system (12/24/pill).

Do not:
- Introduce a generic SaaS blue as a primary action color.
- Replace inset "sheen" shadows with flat drop shadows or Material-style elevation.
- Use square/sharp-cornered buttons or cards.
- Mix warm and cool fills as a plain primary/secondary button pair — that split is reserved for the energy/mood axis.

## Codex / Claude Code / Cursor Usage Rules

Do:
- Inspect the target project's existing styling system (CSS variables, Tailwind config, styled-components, etc.) before adding new values, and map the tokens above onto it.
- Build the sheen effect as one shared, reusable shadow utility rather than inlining the 3–4 layer box-shadow on every component.
- Implement missing states (hover, focus, disabled, loading, error) using the same color/radius/shadow language, clearly documenting them as additions beyond the source.
- Preserve the asymmetric hero-card corner rounding (only outward-facing corners rounded) when stacking two cards.

Do not:
- Replace Young Serif with a generic serif or a sans-serif "for simplicity."
- Flatten the sheen shadows into a single drop shadow.
- Introduce a neutral gray as the default/unselected chip color — the source always uses a pale tint of the chip's own hue family, never gray.
- Invent exact values for the 20 unopened screens; treat their styling as Inferred/Suggested only and pull real values via `get_design_context` before shipping pixel-accurate code for them.

## Style Loss Risks

- Swapping Young Serif for a generic sans-serif headline would immediately kill the "editorial wellness" feel that anchors this style.
- Dropping the inset sheen shadows in favor of flat fills or standard drop shadows makes the UI look like generic Material/SaaS design.
- Using a neutral gray for unselected/default chip states instead of a pale tint of the chip's own color family breaks the warm/cool content-coding system.
- Squaring off any corner (cards, chips, pills, or the slider track) breaks the soft, rounded silhouette that's consistent across every screen in the source.
- Using pure black (`#000`) for text instead of the soft `#2f374a` charcoal makes the UI feel harsher than the source intends.

## Do / Don't Style Rules

### Do
- Pair Young Serif headlines with Figtree body/UI text on every new screen.
- Apply the 4-layer inset sheen shadow to every new filled surface.
- Keep radius values to exactly 12px, 24px, or pill (400px/44px) — no other radius values.
- Reserve saturated pink (`#f83b7d`/`#a7668b`) for the single primary action or the "warm/hot" state per screen.

### Don't
- Don't introduce drop shadows, hard elevation, or flat Material-style cards.
- Don't use more than three border-radius values across a screen.
- Don't use color as the only differentiator for accessibility-critical states — pair warm/cool with a secondary cue.
- Don't substitute Inter or Figtree for headline text, or Young Serif for body/button text.

## Missing / Unresolved System Areas

- Exact icon library/version (visually matches Phosphor "regular," unconfirmed).
- Full style data for 20 of 22 screens (only reviewed via mosaic screenshot).
- Motion/transition timing and easing (static file, no motion data).
- Hover, focus-visible, disabled, loading, empty, and error states for every component.
- Whether a dark/navy hero variant (glimpsed in the mosaic, top-right thumbnail) is an intentional alternate mode or an outlier.
- Accessible contrast ratios for text-on-saturated-fill combinations.

## Recommended Next Source

To improve accuracy: run `get_design_context` on the remaining 20 screens (especially the dark-navy variant and the taller 1123px-height screens) to confirm whether they represent intentional style modes (e.g., a "focus/dark" mode) or are simply more instances of the same system; and check whether the file's parent pages contain a Figma Variables collection that wasn't scoped to this particular section.
