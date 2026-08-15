# Today — Mood & Intention App — Brief

(Renamed from working title "Arclight.")

## The Problem
People move through their days reactively — no morning intention, and evening reflection (when it happens) produces guilt, not insight. Even apps that prompt reflection don't help people learn their own patterns: they log feelings and get a history chart back, never an understanding of what actually helps or blocks them.

## Positioning Shift (locked)
Today is not about getting things done. It's about making one thing in the day feel good.

The core promise: help people feel good about at least one thing today. One focus. One feeling. Every day counts for something.

This changes the evening question. Not "did it happen." Instead: **"Glad about how this went?"** — chosen over "did it feel good" because that phrasing breaks down for intentions that aren't inherently pleasurable in the moment (e.g. "avoid sugar" — the process isn't pleasant, but you can still be glad about how it went). "Glad about how this went" holds up for both doing and not-doing intentions. Yes / Not really.

The tags stay the same. They still explain what helped or blocked the feeling, not whether a task was completed.

### Why this fits the research
- **Daily uplifts matter more than big wins.** Kanner and Lazarus found small daily positive moments predict wellbeing better than major life events.
- **One good thing beats many.** Self-determination theory says wellbeing comes from feeling capable, in control, and connected. This works best through one chosen thing done well, not many things juggled.
- **Noticing amplifies feeling good.** Savoring research shows that reflecting on a good moment makes the positive effect stronger. That's exactly what the evening check-in does.

So this is not just a nicer feeling. It's a more research-aligned frame than a pure productivity one.

## The Fix
Structure the data at the two moments that matter — obstacles and helpers — so patterns become visible over time, without turning the app into a logging chore. Cap daily intentions low enough that focus, not scatter, is the default.

---

## Locked Decisions (v1)

- **Max 2 intentions per day** (1 required, 1 optional "stretch" add). Grounded in multiple-goal-pursuit research: competing goals draw on the same limited executive resources and develop inhibitory connections with each other, and unfinished goals occupy working memory rather than sitting passively — so keeping the count low protects follow-through rather than being an arbitrary simplicity choice. No "third intention" path exists.
- **Obstacle/helper categories: fixed list, not user-editable** (protects clean pattern-matching, avoids tagging bloat).
- **Obstacle/helper tags are grounded in the COM-B behavior-change model** (Michie, Atkins & West, 2011), covering all six sub-components: physical + psychological capability, physical + social opportunity, and reflective + automatic motivation — plus a planning dimension from Gollwitzer's implementation-intentions research, one of the most robustly evidenced predictors of follow-through in the literature.
- **Category labels (capability/opportunity/motivation) are never shown to the user.** The COM-B structure is a backend organizing scaffold only — the UI shows one flat row of plain-language chips, no headers, no grouping visible.
- Life spheres: **fixed list, one tag per intention, no sub-categories, not user-editable.** Lightweight tag only — not the full 12-Week Year structure. That deeper seasonal-goal mechanism stays parked as its own separate project (**One Focus**).
  - ⚠️ **Open question:** the sphere label set itself is currently unconfirmed — see Open Questions below.
- Sphere tagging method: user manually picks the sphere for their freeform intention (no AI needed for v1 — simpler, no dependency, fully predictable).
- Journaling: **not a standalone tab.** Notes are optional and attached directly to a check-in (evening reflection or mood check-in) — there is no freestanding journal entry point. Past notes are visible through the Entries history, tied to whichever check-in they were written on.
- Emotion picker: expanded from a flat 8-emotion list to a **four-quadrant model** (adapted from How We Feel) — high/low energy × pleasant/unpleasant, ~8 emotions per quadrant (32 total). Users can browse by quadrant filter or search by name. Quadrant labels are shown in the UI (unlike COM-B categories, which stay hidden) since the quadrant itself is meant to build the user's emotional vocabulary over time.
- History: a dedicated **Entries** tab shows a mixed, reverse-chronological feed of past intention check-ins and mood check-ins, each with its attached note if one exists. Filterable by All / Intentions / Moods.

## Obstacle / Helper Tag Set (final, 9 + 9, one-to-one mirrored)

| What got in the way | What helped | COM-B root |
|---|---|---|
| Low energy | Had energy | Capability |
| No plan | Had a plan | Planning (implementation intentions) |
| Unrealistic plan | Realistic plan | Planning (implementation intentions) |
| Unexpected changes | Adapted to changes | Physical opportunity |
| No one checked in | Accountability to someone | Social opportunity |
| No deadline | Had a deadline | Opportunity / urgency |
| Distractions | Removed distractions | Automatic motivation |
| Not a priority | Made it a priority | Reflective motivation |
| Forgot about it | Checked in with myself | Attention / self-monitoring |

"No plan" and "Unrealistic plan" are kept as separate pills rather than merged — they're genuinely different failure modes (never made a plan at all, vs. made one that couldn't realistically work), so collapsing them would lose signal on which one is actually recurring for a given person. Each pair mirrors cleanly, so "what helped" on a good day and "what got in the way" on a bad day are always asking about the same underlying factor — that symmetry is what makes the Patterns view legible later.

## Why low energy earns its place despite not being "fixable" in the moment
It doesn't get solved same-day — it gets absorbed into smarter intention-setting going forward: a smaller version of the same intention, a nudge to shift timing to when energy is naturally higher, or simply reflecting the pattern back without prescribing anything. The tag's value is in feeding the Patterns view over time, not in producing an in-app fix.

---

## Home Screen & Navigation (new this session)

**Home screen (Check-in tab, idle state):**
- Two large buttons, stacked: **Intention** (contextual — see below) and **Mood check-in** (static, always the same).
- Intention button is contextual and state-aware:
  - No intention set yet today → "Set your intention"
  - Set, evening not yet arrived → quiet "set for today" confirmation state, not a live flow
  - Evening arrived, not yet reflected → "Reflect on your day"
  - Reflected → "All done for today" (checkmark state)
- Mood check-in is deliberately **not** contextual or gated by the intention flow's state — it's need-based, not scheduled, and should never feel "used up."
- A time-based greeting ("Good morning" / "Good evening") sits above the two buttons — personalizes the screen without needing a profile system, and reinforces why the intention button currently reads what it does.
- Optional, low-priority: a small streak indicator (e.g. "3 days in a row") near the greeting — deliberately tiny so it never competes with the two hero buttons.
- **No hamburger menu.** A 3-tab bottom nav already covers full app navigation; a second nav system would be redundant and would bury things behind an icon people have to guess is tappable.
- **No profile icon in v1's original UX framing** — but see the Supabase decision below, which reopens a light need for an account-related entry point (handled via the settings gear, not a profile icon).
- **Quiet settings gear**, small, top corner: houses the morning/evening cutoff time, and (once backend is added) log out.

**Navigation architecture:**
- 3 tabs total: **Check-in** / **Entries** / **Patterns** — replacing the earlier 5-tab structure (Morning / Evening / Mood / Entries / Patterns).
- Tab bar is visible on the Check-in home screen (the two-button chooser) and on Entries/Patterns.
- Tapping either home-screen button opens a temporarily full-screen task flow (the intention card, or the mood flow) — tab bar recedes during this focused task, the same pattern as a modal "sheet" flow (e.g. Apple's own pattern, or a checkout flow). This is intentional, not a navigation gap: short, linear, bounded tasks don't need mid-task access to Patterns or Entries.
- On completion (or cancel), the tab bar returns and the user lands back on the Check-in home screen.
- ⚠️ **To design before build:** the entry-flow screens currently have no visible exit/back affordance in the Figma draft. Needs a small X or back arrow so someone can bail out of "Set intention" or "Mood check-in" without finishing it.

---

## Backend & Auth (new this session — full-stack direction)

Decision: build this as a genuine full-stack case study using **Supabase**, mirroring the approach already used for Afterparty (consistent portfolio story, not a one-off).

**Schema:**
```
day_logs
  id, user_id, date, energy (Low/Steady/High), created_at

intentions
  id, day_log_id (FK), text, sphere, position (1 or 2),
  glad (bool, null until evening), tag (text, obstacle or helper),
  note (text, optional), reflected_at (timestamp, null until done)

mood_checkins
  id, user_id, created_at, emotion, quadrant, intensity (1-5),
  technique, better (bool), liked (bool), note (text, optional)
```
Auth handled via Supabase's built-in `auth.users` — no custom users table needed unless extra profile fields (display name, custom morning/evening cutoff time) are wanted, which would live in a small `profiles` table keyed to `auth.users.id`.

**MVP**
- Supabase Auth via **magic link** (passwordless email) — no password-reset flow to build, lowest friction for a solo-user personal app.
- The three tables above.
- **Row Level Security policies** scoping every table to `auth.uid()` — worth calling out explicitly in the case study as a signal of real backend thinking, not just "added a database."
- Logout entry lives in the settings gear.

**Nice-to-have**
- Google sign-in alongside magic link.
- Editable morning/evening cutoff time (stored in `profiles`).

**Out of scope for now**
- Password-based auth / reset flows (avoided entirely via magic link).
- Account deletion, data export, multi-factor auth.
- Push notification reminders (separate infra, bigger scope on its own).

**Known constraint carried over from Afterparty:** Supabase free-tier projects auto-pause after 7 days of inactivity — plan around this when demoing.

**Important scope note:** the HTML prototype (`mood_intention_prototype.html` / to be renamed) stays a UI/UX demo with dummy, session-only data — it does not make real Supabase calls. The schema and auth flow above are documented engineering scope for the real build, designed here but not wired into the artifact.

---

## Mood Picker — Fun Interaction (new this session)

Inspired by How We Feel's tap-to-expand emotion shapes, without copying the shape system itself. Direction chosen: **glow/flame** — each emotion is a small point of light with its own color and flicker behavior (steady glow for calm, quick flicker for anxious, dim ember for tired, bright flare for excited). Tapping it blooms outward, brightening and expanding to reveal the label and meaning.

Glow was chosen specifically because it ties into the product name — the interaction becomes a literal expression of the brand rather than a decorative choice.

⚠️ **Open question, raised by the rename:** the glow concept's strongest justification was the "Arclight" name tie-in. Now that the app is called **Today**, worth deciding: keep glow anyway (it still works well as a design language on its own), or shift to a metaphor that ties more directly to "Today" — e.g. a sun-arc / day-cycle motif (dawn → noon → dusk → night mapped to emotional tone). Flagging rather than deciding, since this is a naming-driven design choice.

**Quadrant filter tab icons:** weather metaphor, sourced from Phosphor (already used elsewhere in the app for sphere icons — no new icon library needed):
- High energy + pleasant → Sun / Sparkle
- Low energy + pleasant → Moon / MoonStars
- High energy + unpleasant → CloudLightning
- Low energy + unpleasant → CloudRain

Rationale: weather-as-mood is a near-universal, instantly legible metaphor, and using it at the quick-scanning tab level (rather than on the individual emotions, where glow lives) keeps fast category recognition separate from the slower, more delightful per-emotion moment.

---

## Practice / Technique Tags (new this session)

| Technique | Tag |
|---|---|
| Paced Breathing | Breathing |
| Focused Attention | Grounding |
| Expressive Writing | Reflection |
| Progressive Muscle Relaxation | Body |
| Loving-Kindness | Connection |
| Nature Pause | Grounding |
| Gratitude Note | Reflection |

Five categories: **Breathing** (physiological down-regulation), **Body** (physical release/tension), **Grounding** (sensory, present-moment attention), **Reflection** (cognitive processing through writing), **Connection** (other-directed, social).

⚠️ **Pending decision:** the current `EMOTION_MAP` in the prototype only maps techniques to the old flat 8-emotion list and is stale now that the emotion picker covers 32 emotions across 4 quadrants. Proposed replacement: match by **quadrant → tag** instead of by individual emotion —
- High energy, unpleasant → Breathing, Body
- Low energy, unpleasant → Connection, Reflection
- High energy, pleasant → Reflection (savoring research: naming/writing about a good feeling extends it)
- Low energy, pleasant → Grounding (sustains the state rather than snapping out of it)

Not yet implemented in the prototype — tags above are documented, quadrant-matching logic is proposed but awaiting confirmation.

---

## Parked for v2 (not in this version, but worth remembering)
- **Sub-categories within each sphere** (e.g. Health → eating / sports; Career → CV / networking / applying / manager conversations). Genuinely valuable for deeper insight, but adds a second layer of tracking complexity that doesn't fit a v1 "tiny app" scope. Revisit once you've actually lived with v1 for a while.
- AI-based auto-tagging of intentions into spheres (skipped for v1 in favor of manual pick, but still cheap/feasible if wanted later — roughly $1–3/year at personal-use volume).
- User-editable/custom sphere or sub-category lists.

---

## Core Flows

### Morning (inside the Intention flow, opened from Check-in home)
1. Type intention (freeform text) → manually pick which life sphere it belongs to.
2. Optionally add a second intention (same steps) — no third option offered.
3. Tap energy level.

### Evening (inside the Intention flow, opened from Check-in home)
Shown one intention at a time (progress dots if 2 were set), each as its own card:
1. See today's intention.
2. Tap yes / no — **"Glad about how this went?"**
3. If not really → pick one obstacle from the 9-tag set above (+ optional note).
4. If yes → pick one helper from the mirrored 9-tag set above (+ optional note).
5. Last card's button reads "Save reflection." Each entry (with its note, if any) is added to the Entries history.

### Anytime: Mood Check-In (opened from Check-in home)
1. Pick emotion (browse by quadrant or search — see emotion picker note above) → pick intensity.
2. App suggests 3 techniques (see technique tags above) → user picks one → does it.
3. Check back: better / not better, liked / didn't like, + optional note.
4. Entry (with note, if any) is added to the Entries history.

### Anytime: Entries (history)
Mixed, reverse-chronological feed of past intention and mood check-ins. Filter chips: All / Intentions / Moods. Each entry shows what it was, the tag or technique result, and its attached note if one was written.

### Anytime: Patterns
Aggregate insight view built on top of the Entries history — energy trends, most common obstacles/helpers, mood/intensity patterns, most-used and most-effective techniques, completion rate by sphere.

---

## What's Trackable
Energy trends, intention completion rate, most common obstacles, most common helpers (mapped 1:1 so trends are directly comparable), mood/intensity patterns over time, most-used techniques, which techniques actually help (better/liked), completion rate by life sphere.

## What's Explicitly Parked (not in this app / not in v1)
- 12-Week Year / seasonal goal structure → lives in One Focus, separate project.
- Sub-categories within spheres → named v2 direction, see above.
- AI auto-tagging → possible v2 addition, not needed for v1.

---

## Open Questions (as of this brief)
1. **Life sphere label set** — Figma draft shows Health, Finances, Romance, Fun & hobbies, Home & environment, Family, Personal growth, Work; the brief previously had Career, Health, Relationships, Growth, Finances, Fun, Environment, Reflection. Which is final?
2. **Mood picker naming tie-in** — keep glow despite the Arclight → Today rename, or move to a metaphor tied to "Today" (e.g. day-cycle arc)?
3. **Technique-to-quadrant auto-matching** — implement now (replacing the stale `EMOTION_MAP`), or later?
4. **Exit/back affordance** on the intention-entry and mood-entry screens — not yet designed, needed before build.

---

## Prototype Status
`mood_intention_prototype.html` — title and visible brand text updated from Arclight to Today. Still reflects the 3-tab-equivalent screen set (Morning/Evening/Mood/Entries/Patterns) from before this session's home-screen and navigation restructure; the new 2-button Check-in home screen, 3-tab nav, technique tags, and quadrant-based matching are documented above but **not yet built into the HTML file** — pending your confirmation on the open questions above. JS syntax validated via `node --check` after every edit made so far.
