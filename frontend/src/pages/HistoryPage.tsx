import { Fragment, useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiErrorMessage, getHistory } from '../api'
import type { HistoryItem } from '../api'
import EvidenceQuote from '../components/EvidenceQuote'
import { Empty, ErrorBox, Loading } from '../components/StateViews'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your history.')))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!history) return <Loading label="Loading history…" />

  if (history.length === 0) {
    return (
      <div className="page">
        <h2>History</h2>
        <Empty>
          <p>Run your first session to see your scores here.</p>
        </Empty>
      </div>
    )
  }

  const chartData = history.map((h, i) => ({
    index: i + 1,
    structure: h.structure,
    technical_depth: h.technical_depth,
    specificity: h.specificity,
  }))

  return (
    <div className="page">
      <h2>History</h2>

      <div className="panel">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--rule)" strokeDasharray="2 3" />
            <XAxis
              dataKey="index"
              stroke="var(--ink-soft)"
              label={{ value: 'Attempt #', position: 'insideBottom', offset: -5, fill: 'var(--ink-soft)' }}
            />
            <YAxis domain={[0, 5]} allowDecimals={false} stroke="var(--ink-soft)" />
            <Tooltip contentStyle={{ background: 'var(--paper)', border: '1px solid var(--rule)' }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="structure"
              name="Structure"
              stroke="var(--mark)"
              strokeDasharray="0"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="technical_depth"
              name="Technical depth"
              stroke="var(--ink)"
              strokeDasharray="6 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="specificity"
              name="Specificity"
              stroke="var(--ink-soft)"
              strokeDasharray="2 2"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrap">
        <table className="record-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Date</th>
              <th>Structure</th>
              <th>Depth</th>
              <th>Specificity</th>
            </tr>
          </thead>
          <tbody>
            {history
              .slice()
              .reverse()
              .map((h) => (
                <Fragment key={h.attempt_id}>
                  <tr
                    className="record-row"
                    onClick={() => setExpanded(expanded === h.attempt_id ? null : h.attempt_id)}
                  >
                    <td data-label="Question">{h.question_text}</td>
                    <td data-label="Date" className="num">
                      {new Date(h.scored_at).toLocaleDateString()}
                    </td>
                    <td data-label="Structure" className="num">
                      {h.structure}
                    </td>
                    <td data-label="Depth" className="num">
                      {h.technical_depth}
                    </td>
                    <td data-label="Specificity" className="num">
                      {h.specificity}
                    </td>
                  </tr>
                  {expanded === h.attempt_id && (
                    <tr className="record-row-detail">
                      <td colSpan={5}>
                        <p className="history-answer">{h.answer_text}</p>
                        {h.feedback && <EvidenceQuote text={h.feedback} label="Feedback" />}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
