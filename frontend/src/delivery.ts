/** Filler interjections only — deliberately excludes phrases like "sort of" or
 * "kind of" that double as legitimate technical language ("this kind of
 * architecture"), which would make the count noisy rather than useful. */
const FILLER_PATTERN = /\b(um+|uh+|erm+|hm+|you know|i mean)\b/gi

const MIN_SPEAKING_SECONDS = 3

export interface DeliveryStats {
  wpm: number
  fillerCount: number
}

/** Derived from the transcript and total recording time — not a scored
 * dimension, just informational context for spoken answers. Returns null
 * when there isn't enough signal (too short a recording) to be meaningful. */
export function computeDeliveryStats(text: string, speakingSeconds: number): DeliveryStats | null {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0 || speakingSeconds < MIN_SPEAKING_SECONDS) return null

  const wpm = Math.round((words.length / speakingSeconds) * 60)
  const fillerCount = (text.match(FILLER_PATTERN) ?? []).length
  return { wpm, fillerCount }
}
