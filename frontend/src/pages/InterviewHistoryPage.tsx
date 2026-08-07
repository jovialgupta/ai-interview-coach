import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage, getHistory, groupBySession, listSessions } from '../api'
import type { HistoryItem, SessionListItem } from '../api'
import { Empty, ErrorBox, Loading } from '../components/StateViews'

export default function InterviewHistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null)
  const [history, setHistory] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listSessions(), getHistory()])
      .then(([s, h]) => {
        setSessions(s)
        setHistory(h)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your interview history.')))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!sessions || !history) return <Loading label="Loading interview history…" />

  const sessionAverages = groupBySession(history)

  return (
    <div className="page">
      <h2>Interview history</h2>
      <p className="page-subtitle">Every session you've run, with your average score per dimension.</p>

      {sessions.length === 0 ? (
        <Empty>
          <p>You haven't run a session yet — start one from the dashboard.</p>
        </Empty>
      ) : (
        <div className="table-wrap">
          <table className="record-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Type</th>
                <th>Difficulty</th>
                <th>Qs</th>
                <th>Date</th>
                <th>Structure</th>
                <th>Depth</th>
                <th>Specificity</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const avg = sessionAverages[s.id]
                return (
                  <tr key={s.id} onClick={() => navigate(`/session/${s.id}`)} className="record-row">
                    <td data-label="Role">{s.role}</td>
                    <td data-label="Type">{s.interview_type}</td>
                    <td data-label="Difficulty">{s.difficulty}</td>
                    <td data-label="Qs" className="num">
                      {s.question_count ?? 'In progress'}
                    </td>
                    <td data-label="Date" className="num">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td data-label="Structure" className="num">
                      {avg ? avg.structure.toFixed(1) : '—'}
                    </td>
                    <td data-label="Depth" className="num">
                      {avg ? avg.technical_depth.toFixed(1) : '—'}
                    </td>
                    <td data-label="Specificity" className="num">
                      {avg ? avg.specificity.toFixed(1) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
