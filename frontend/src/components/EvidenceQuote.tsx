interface EvidenceQuoteProps {
  text: string
  label?: string
}

/** A margin annotation next to a MarkScore — the quoted evidence that makes the
 * mark credible rather than arbitrary. Reused for written feedback too. */
export default function EvidenceQuote({ text, label = 'Evidence' }: EvidenceQuoteProps) {
  return (
    <div className="evidence-quote">
      <span className="evidence-label">{label}</span>
      <p className="evidence-text">&ldquo;{text}&rdquo;</p>
    </div>
  )
}
