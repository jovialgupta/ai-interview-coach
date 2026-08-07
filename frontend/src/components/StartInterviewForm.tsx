import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage, createSession } from '../api'
import type { Difficulty, InterviewType } from '../api'
import { ErrorBox } from './StateViews'

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

export default function StartInterviewForm() {
  const navigate = useNavigate()
  const [role, setRole] = useState(ROLE_OPTIONS[0])
  const [customRole, setCustomRole] = useState('')
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      })
      navigate(`/session/${session.id}`)
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not generate questions. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <>
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
    </>
  )
}
