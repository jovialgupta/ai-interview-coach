import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DIMENSION_LABELS,
  apiErrorMessage,
  computeDimensionInsight,
  createSession,
  groupBySession,
  listSessions,
  getHistory,
} from '../api'
import type { Difficulty, HistoryItem, InterviewType, QuestionCount, SessionListItem } from '../api'
import MarkScore from '../components/MarkScore'
import { Empty, ErrorBox, Loading } from '../components/StateViews'

const ROLE_OPTIONS = [
  'Backend Engineer',
  'Frontend Engineer',
  'Full Stack Engineer',
  'Data Analyst',
  'Data Scientist',
  'DevOps Engineer',
  'QA Engineer',
  'Mobile App Developer',
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null)
  const [history, setHistory] = useState<HistoryItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [role, setRole] = useState(ROLE_OPTIONS[0])
  const [customRole, setCustomRole] = useState('')
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([listSessions(), getHistory()])
      .then(([s, h]) => {
        setSessions(s)
        setHistory(h)
      })
      .catch((err) => setLoadError(apiErrorMessage(err, 'Could not load your dashboard.')))
  }, [])

  async function handleCreateSession(e: FormEvent) {
    e.preventDefault()
    const resolvedRole = role === 'Other' ? customRole.trim() : role
    if (!resolvedRole) {
      setFormError('Enter a role.')
      return
    }
    setFormError(null)
    setSubmitting(true)
    try {
      const session = await createSession({
        role: resolvedRole,
        interview_type: interviewType,
        difficulty,
        question_count: questionCount,
      })
      navigate(`/session/${session.id}`)
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not generate questions. Please try again.'))
      setSubmitting(false)
    }
  }

  if (loadError) return <ErrorBox message={loadError} />
  if (!sessions || !history) return <Loading label="Loading dashboard…" />

  const insight = computeDimensionInsight(history)
  const sessionAverages = groupBySession(history)

  return (
    <div className="page">
      {insight ? (
        <section className="insight-block">
          <p className="insight-label">Weakest so far: {DIMENSION_LABELS[insight.weakest]}</p>
          <p className="insight-sentence">{insight.sentence}</p>
          <div className="insight-marks">
            {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map((key) => (
              <div className="insight-mark" key={key}>
                <span className="insight-mark-label">{DIMENSION_LABELS[key]}</span>
                <MarkScore value={insight.averages[key]} label={DIMENSION_LABELS[key]} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Empty>
          <p>No sessions yet — start one below to see where you stand.</p>
        </Empty>
      )}

      <section className="panel">
        <h2>Start a session</h2>
        <form className="inline-form" onSubmit={handleCreateSession}>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </label>
          {role === 'Other' && (
            <label>
              Custom role
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Site Reliability Engineer"
              />
            </label>
          )}
          <label>
            Interview type
            <select value={interviewType} onChange={(e) => setInterviewType(e.target.value as InterviewType)}>
              <option value="mixed">Mixed</option>
              <option value="technical">Technical</option>
              <option value="behavioural">Behavioural</option>
            </select>
          </label>
          <label>
            Questions
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value) as QuestionCount)}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </label>
          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Generating…' : 'Start session'}
          </button>
        </form>
        {formError && <ErrorBox message={formError} />}
      </section>

      <section className="panel">
        <h2>Past sessions</h2>
        {sessions.length === 0 ? (
          <Empty>
            <p>You haven't run a session yet.</p>
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
                        {s.question_count}
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
      </section>
    </div>
  )
}
