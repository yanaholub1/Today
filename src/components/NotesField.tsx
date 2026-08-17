import { useRef, useState } from 'react'
import { Microphone, Stop } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

/**
 * Minimal shape of the browser's native SpeechRecognition API — not part of
 * TypeScript's standard DOM lib (it's a non-standard/experimental Web API),
 * so there's no official type to import. Only the members this component
 * actually uses are declared.
 */
interface MinimalSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface NotesFieldProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * "Notes" section — verified against node 142:1885 for the overall shape
 * (title, 12px gap, 96px-min-height 20px-radius field bordered `#eddde6`
 * with "Add your thoughts" placeholder, medium 16px `#787d89`, 1.5 line-
 * height). Two explicit direct corrections from that node's own literal
 * text/size: the title is 16px (not the node's 18px), and reads just
 * "Notes" — the node's own " • Optional" suffix is dropped since the
 * Continue/Complete/Save button's own active state already communicates
 * that the field isn't required.
 * That node's own `pr-[32px]` (wider than its `pl-[12px]`) reserves room
 * for a trailing icon the static export doesn't render — filled here with
 * a mic button per the brief's own request to let the user "record a
 * message ... and the app should transcribe," flagged as inferred
 * placement since the node itself shows no icon.
 *
 * Voice input uses the browser's native SpeechRecognition API (Chrome/Edge
 * unprefixed; `webkitSpeechRecognition` for Safari, including iOS 14.5+ —
 * review fix, the doc comment here used to claim Safari doesn't support
 * this at all and the button hides there, which isn't accurate: Safari
 * has shipped the webkit-prefixed API for years, so `Ctor` above resolves
 * truthy there too and the button DOES render) — the only way to get REAL
 * speech-to-text transcription in a frontend-only app with no backend/AI
 * service to call. Genuinely unsupported browsers (older Firefox) still
 * hide the button entirely rather than showing a control that would
 * silently do nothing — typing remains the only input there.
 *
 * Review fix — `continuous` is now `false` (was `true`). Two reasons:
 * (1) this now matches the actual brief ("when the user finishes
 * speaking... the transcribed text is inserted" — recognition should
 * detect end-of-speech on its own, not require an explicit stop tap for
 * every use); (2) `continuous: true` has a longstanding, well-documented
 * WebKit bug specifically on iPhone/iPad — recognition never stops on its
 * own and no text is ever returned, i.e. exactly "tapping the mic does
 * nothing." Tapping the mic again while `recording` still works as an
 * explicit early-stop (`stopRecording` below, unchanged) for a longer
 * thought; `interimResults` stays `false`, unaffected by this — its own
 * WebKit bug (never-finalizing results) is specific to the
 * `continuous`+`interimResults` combination, which no longer applies.
 *
 * Review fix — `onerror` used to just reset `recording` with NO visible
 * feedback: confirmed live (mic permission blocked) that this reads as a
 * complete no-op from the outside — the icon quietly reverts to idle,
 * nothing in the note, nothing in the console. `error` below now shows a
 * short, specific message for the case actually likely to be hit in
 * practice (permission denied/blocked) and a generic fallback otherwise,
 * matching this app's existing small `text-warm` inline-error convention
 * (SignInScreen.tsx et al.) rather than inventing new error styling.
 * Cleared at the start of every new attempt, not just on success, so a
 * retry doesn't leave a stale message showing underneath a fresh
 * recording.
 *
 * Each finalized transcript is appended to whatever's already in the
 * field (not overwritten), so typing and recording can be mixed freely
 * in one note.
 */
export function NotesField({ value, onChange, className }: NotesFieldProps) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const Ctor = getSpeechRecognitionCtor()

  const stopRecording = () => {
    recognitionRef.current?.stop()
  }

  const startRecording = () => {
    if (!Ctor) return
    setError(null)
    const recognition = new Ctor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      transcript = transcript.trim()
      if (transcript) onChange(value ? `${value} ${transcript}` : transcript)
    }
    recognition.onend = () => setRecording(false)
    recognition.onerror = (event) => {
      setRecording(false)
      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access is blocked. Check your browser settings and try again.'
          : event.error === 'no-speech'
            ? "Didn't catch that — try again."
            : 'Voice input failed. Please try again or type instead.',
      )
    }
    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="font-sans text-base font-medium text-ink">Notes</p>
      <div className="focus-ring-field-shape relative flex min-h-[96px] w-full rounded-[20px] border border-solid border-[#eddde6] py-3 pl-3 pr-8">
        {/* No rounded-[20px] here (review fix, was matching the wrapper's own radius) — a border-radius on the textarea ITSELF clips its own text box at the corners, cutting off the first character(s) of the first line. The wrapper above still owns the field's real 20px-radius visible shape; `.focus-ring-field-shape`'s own glow/border-color already reads off the wrapper, not this element, so removing this radius doesn't affect the focus treatment. */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add your thoughts"
          rows={3}
          className="focus-ring-field w-full flex-1 resize-none bg-transparent font-sans text-base font-medium text-ink placeholder:text-[#787d89]"
        />
        {Ctor && (
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            aria-label={recording ? 'Stop recording' : 'Record a voice note'}
            aria-pressed={recording}
            className={cn(
              'focus-ring pressable absolute right-2 bottom-2 flex size-7 shrink-0 items-center justify-center rounded-full',
              recording ? 'bg-warm text-white' : 'text-ink/60',
            )}
          >
            {recording ? <Stop size={16} weight="fill" /> : <Microphone size={16} weight="fill" />}
          </button>
        )}
      </div>
      {error && <p className="font-sans text-sm text-warm">{error}</p>}
    </div>
  )
}
