/** Thin wrapper around the browser's native Web Speech API (SpeechRecognition).
 * Not in TS's DOM lib (still a non-standard/webkit-prefixed API in most browsers),
 * so the shape used here is declared locally rather than relying on ambient types. */

interface MinimalSpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

interface MinimalSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null
}

export interface SpeechController {
  start: () => void
  stop: () => void
}

/** Starts continuous speech recognition. Calls onFinalText once per recognized
 * phrase (not per interim guess), and onEnd when recognition stops for any reason
 * (manual stop, silence timeout, or a recognition error). */
export function createSpeechRecognition(
  onFinalText: (text: string) => void,
  onEnd: () => void,
): SpeechController | null {
  const Ctor = getSpeechRecognitionConstructor()
  if (!Ctor) return null

  const recognition = new Ctor()
  recognition.continuous = true
  recognition.interimResults = false
  recognition.lang = 'en-IN'

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        onFinalText(result[0].transcript.trim())
      }
    }
  }
  recognition.onerror = () => onEnd()
  recognition.onend = () => onEnd()

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  }
}
