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
  onerror: (() => void) | null
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
 * Voice input uses the browser's native SpeechRecognition API (Chrome/Edge;
 * `webkitSpeechRecognition` fallback for older Chromium) — the only way to
 * get REAL speech-to-text transcription in a frontend-only app with no
 * backend/AI service to call. Not polyfilled or faked: on unsupported
 * browsers (Safari, Firefox) the mic button simply doesn't render, rather
 * than showing a control that would silently do nothing — typing remains
 * the only input there. `interimResults: false` — only finalized phrases
 * get appended to the note, avoiding the flicker of a live partial
 * transcript being rewritten mid-sentence. Each finalized chunk is
 * appended to whatever's already in the field (not overwritten), so typing
 * and recording can be mixed freely in one note.
 */
export function NotesField({ value, onChange, className }: NotesFieldProps) {
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)
  const Ctor = getSpeechRecognitionCtor()

  const stopRecording = () => {
    recognitionRef.current?.stop()
  }

  const startRecording = () => {
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.continuous = true
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
    recognition.onerror = () => setRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="font-sans text-base font-medium text-ink">Notes</p>
      <div className="relative flex min-h-[96px] w-full rounded-[20px] border border-solid border-[#eddde6] py-3 pl-3 pr-8">
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
    </div>
  )
}
