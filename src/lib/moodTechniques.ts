import type { MoodQuadrantId } from './moodCategories'

/**
 * 8 emotion words per quadrant, 32 total — NOT sourced from Figma (no node
 * was given for this screen, and none was fetched). Grounded in the Yale
 * Mood Meter's well-known high/low-energy × pleasant/unpleasant emotion
 * clusters rather than invented from scratch, but still flagged as
 * inferred content pending a real design source.
 */
export const QUADRANT_EMOTIONS: Record<MoodQuadrantId, string[]> = {
  'high-unpleasant': ['Enraged', 'Panicked', 'Stressed', 'Jittery', 'Shocked', 'Furious', 'Anxious', 'Frustrated'],
  'high-pleasant': ['Surprised', 'Upbeat', 'Festive', 'Exhilarated', 'Ecstatic', 'Motivated', 'Inspired', 'Elated'],
  'low-unpleasant': ['Sad', 'Lonely', 'Disappointed', 'Down', 'Exhausted', 'Fatigued', 'Bored', 'Tired'],
  'low-pleasant': ['Relaxed', 'Calm', 'Content', 'Serene', 'Peaceful', 'Secure', 'Satisfied', 'Grateful'],
}

/** Flattened for the quadrant-screen's search shortcut, which searches across all 4 quadrants at once, not just one. */
export const ALL_EMOTIONS: { emotion: string; quadrant: MoodQuadrantId }[] = (
  Object.entries(QUADRANT_EMOTIONS) as [MoodQuadrantId, string[]][]
).flatMap(([quadrant, emotions]) => emotions.map((emotion) => ({ emotion, quadrant })))

export type TechniqueTag = 'Breathing' | 'Grounding' | 'Reflection' | 'Body' | 'Connection'

export interface TechniqueDef {
  id: string
  label: string
  tag: TechniqueTag
  /**
   * Minutes shown on the card's "{tag} • {N} min" label (node 111:5610/
   * 111:5677). Only `expressive-writing`'s 5 min is Figma-confirmed —
   * it's the literal example content on 111:5677 ("Reflection • 5 min",
   * "Expressive writing"). The other 6 durations are inferred, not
   * sourced.
   */
  durationMinutes: number
  /** Description shown only on the SELECTED card (111:5677) — the unselected card (111:5610) doesn't render it at all. Also reused as the execution screen's instruction copy. Brief-inferred, not Figma-verified. */
  instructions: string
}

/** The brief's own tag→technique table, verbatim. */
export const TECHNIQUES: TechniqueDef[] = [
  { id: 'paced-breathing', label: 'Paced Breathing', tag: 'Breathing', durationMinutes: 2, instructions: 'Breathe in for 4 counts, hold for 4, then breathe out for 6. Repeat for a few rounds, letting your shoulders drop a little more each time.' },
  { id: 'focused-attention', label: 'Focused Attention', tag: 'Grounding', durationMinutes: 3, instructions: 'Pick one object nearby and study it for a minute — its color, texture, edges. Let your attention rest there instead of on your thoughts.' },
  { id: 'nature-pause', label: 'Nature Pause', tag: 'Grounding', durationMinutes: 2, instructions: 'Step outside or find a window. Spend a minute just noticing the sky, air, or anything green nearby.' },
  { id: 'expressive-writing', label: 'Expressive Writing', tag: 'Reflection', durationMinutes: 5, instructions: "Write freely for a few minutes about what you're feeling and why, without worrying about how it sounds." },
  { id: 'gratitude-note', label: 'Gratitude Note', tag: 'Reflection', durationMinutes: 3, instructions: "Write down one small thing you're grateful for right now, and why it matters to you." },
  { id: 'progressive-muscle-relaxation', label: 'Progressive Muscle Relaxation', tag: 'Body', durationMinutes: 5, instructions: 'Starting at your feet, tense each muscle group for 5 seconds, then release. Work your way up to your shoulders and face.' },
  { id: 'loving-kindness', label: 'Loving-Kindness', tag: 'Connection', durationMinutes: 3, instructions: 'Silently offer yourself a kind phrase, like "may I be at ease." Then extend the same phrase to someone you care about.' },
]

/** The brief's own quadrant→tag table, verbatim. */
const QUADRANT_TAGS: Record<MoodQuadrantId, TechniqueTag[]> = {
  'high-unpleasant': ['Breathing', 'Body'],
  'low-unpleasant': ['Connection', 'Reflection'],
  'high-pleasant': ['Reflection'],
  'low-pleasant': ['Grounding'],
}

const MAX_SUGGESTED_TECHNIQUES = 3

/**
 * Up to 3 techniques whose tag matches the quadrant's mapped tag(s). Only
 * `low-unpleasant` (Connection + Reflection = 3 techniques) reaches the
 * full 3 — the other 3 quadrants map to just 1-2 tags in the brief's own
 * table, so they surface only 2 suggestions each:
 *  - high-unpleasant (Breathing, Body): 2 available
 *  - high-pleasant (Reflection only): 2 available
 *  - low-pleasant (Grounding only): 2 available
 * This is an inherent shortfall in the brief's own mapping, not a bug —
 * nothing is padded or invented to force a count of 3.
 */
export function techniquesForQuadrant(quadrant: MoodQuadrantId): TechniqueDef[] {
  const tags = QUADRANT_TAGS[quadrant]
  return TECHNIQUES.filter((t) => tags.includes(t.tag)).slice(0, MAX_SUGGESTED_TECHNIQUES)
}
