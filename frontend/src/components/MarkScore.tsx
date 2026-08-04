interface MarkScoreProps {
  value: number
  max?: number
  label?: string
}

/** The signature element: a score rendered as an examiner circling a mark on a
 * row of numerals, rather than a progress bar or star rating. */
export default function MarkScore({ value, max = 5, label }: MarkScoreProps) {
  const marked = Math.min(max, Math.max(1, Math.round(value)))
  const numerals = Array.from({ length: max }, (_, i) => i + 1)
  const displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1)

  return (
    <span className="mark-score">
      <span className="mark-score-row" aria-hidden="true">
        {numerals.map((n) => (
          <span key={n} className={n === marked ? 'mark-score-cell marked' : 'mark-score-cell'}>
            {n === marked && (
              <svg className="mark-score-circle" viewBox="0 0 32 32">
                <ellipse cx="16" cy="16" rx="13" ry="10" />
              </svg>
            )}
            <span className="mark-score-num">{n}</span>
          </span>
        ))}
      </span>
      {!Number.isInteger(value) && (
        <span className="mark-score-value" aria-hidden="true">
          {displayValue}/{max}
        </span>
      )}
      <span className="visually-hidden">
        {label ? `${label}: ` : ''}
        {displayValue} out of {max}
      </span>
    </span>
  )
}
