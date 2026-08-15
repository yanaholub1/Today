/**
 * Short, plain-language explanations of what each of the 32 emotions
 * means, for the self-regulation/awareness card on the mood check-in flow.
 * No Figma node specifies this content (both fetched examples — "Enraged"
 * and "Tired" — show only placeholder copy: "Explanation of what the
 * feeling means" / "Explanation of what 'tired' is"), so every string here
 * is original copy written for this app, not sourced or verified against
 * any design. Flagged as inferred content, same as the emotion word list
 * itself (lib/moodTechniques.ts).
 */
export const EMOTION_EXPLANATIONS: Record<string, string> = {
  // High energy, unpleasant
  Enraged: 'Intense anger that can feel overwhelming and hard to control, often a signal that a boundary or value has been crossed.',
  Panicked: 'A sudden surge of fear that can make it hard to think clearly, often a sign your body senses danger even if you’re safe.',
  Stressed: 'Pressure from feeling like demands are outpacing your resources — a cue to pause and see what can be lightened.',
  Jittery: 'A restless, on-edge feeling in the body, often from excess energy or anticipation that hasn’t found an outlet.',
  Shocked: 'A jolt of surprise that temporarily overwhelms your ability to process what’s happening.',
  Furious: 'A powerful surge of anger, often protecting something you care about that feels threatened.',
  Anxious: 'A sense of unease about what might happen next, often your mind trying to prepare for uncertainty.',
  Frustrated: 'The friction of being blocked from something you want, often a sign to adjust your approach or ask for help.',

  // High energy, pleasant
  Surprised: 'A quick jolt of unexpected information — pleasant surprises often open us up to new possibilities.',
  Upbeat: 'A light, energized positivity that makes things feel easier and more possible.',
  Festive: 'A shared sense of celebration and lightness, often tied to connection with others.',
  Exhilarated: 'A rush of excitement and aliveness, often after taking a risk or achieving something.',
  Ecstatic: 'An intense wave of joy that can feel almost overwhelming in the best way.',
  Motivated: 'A pull toward action, fueled by a clear sense of purpose or desire.',
  Inspired: 'A spark of new ideas or possibility, often triggered by something you’ve seen or experienced.',
  Elated: 'A buoyant, uplifted joy that makes you want to share the moment.',

  // Low energy, unpleasant
  Sad: 'A natural response to loss or letdown, often asking for comfort or time to process.',
  Lonely: 'A signal that you’re missing connection, even if people are around you.',
  Disappointed: 'The gap between what you hoped for and what happened — a normal part of caring about outcomes.',
  Down: 'A low, heavy mood that can settle in without one clear cause.',
  Exhausted: 'Deep depletion, often a sign your body and mind need real rest, not just a short break.',
  Fatigued: 'A persistent tiredness that lingers even after resting, worth paying attention to.',
  Bored: 'A restless lack of stimulation, often a nudge to find something more engaging or meaningful.',
  Tired: 'A basic signal that your energy is running low and rest would help.',

  // Low energy, pleasant
  Relaxed: 'A loosening of tension in the body and mind, often a sign you feel safe enough to unwind.',
  Calm: 'A settled, steady state where reactions feel easier to manage.',
  Content: 'A quiet sense that things are enough as they are right now.',
  Serene: 'A deep, still peacefulness, often felt in quiet or unhurried moments.',
  Peaceful: 'An absence of inner conflict, where things feel resolved or accepted.',
  Secure: 'A steady sense of safety, often from trust in yourself or your circumstances.',
  Satisfied: 'A sense of fulfillment from meeting a need or completing something meaningful.',
  Grateful: 'A warm recognition of something good, often turning attention toward what you have rather than what’s missing.',
}
