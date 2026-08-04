import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DIMENSION_LABELS,
  apiErrorMessage,
  createAttempt,
  getSession,
  parseAttemptError,
  rescoreAttempt,
} from '../api'
import type { AttemptScoreResponse, InputMode, SessionOut } from '../api'
import EvidenceQuote from '../components/EvidenceQuote'
import MarkScore from '../components/MarkScore'
import { ErrorBox, Loading } from '../components/StateViews'

interface QuestionState {
  answer: string
  inputMode: InputMode
  status: 'idle' | 'submitting' | 'scored' | 'error'
  score?: AttemptScoreResponse
  errorMessage?: string
  attemptId?: string
}

function initialState(): QuestionState {
  return { answer: '', inputMode: 'typed', status: 'idle' }
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionOut | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, QuestionState>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionDone, setSessionDone] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then((s) => {
        setSession(s)
        setAnswers(Object.fromEntries(s.questions.map((q) => [q.id, initialState()])))
      })
      .catch((err) => setLoadError(apiErrorMessage(err, 'Could not load this session.')))
  }, [sessionId])

  function updateAnswer(questionId: string, patch: Partial<QuestionState>) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }))
  }

  async function handleSubmit(questionId: string) {
    const current = answers[questionId]
    if (!current || !current.answer.trim()) return
    updateAnswer(questionId, { status: 'submitting', errorMessage: undefined })
    try {
      const score = await createAttempt(questionId, current.answer, current.inputMode)
      updateAnswer(questionId, { status: 'scored', score, attemptId: score.attempt_id })
    } catch (err) {
      const { message, attemptId } = parseAttemptError(err)
      updateAnswer(questionId, { status: 'error', errorMessage: message, attemptId })
    }
  }

  async function handleRetryScoring(questionId: string) {
    const current = answers[questionId]
    if (!current?.attemptId) return
    updateAnswer(questionId, { status: 'submitting', errorMessage: undefined })
    try {
      const score = await rescoreAttempt(current.attemptId)
      updateAnswer(questionId, { status: 'scored', score })
    } catch (err) {
      const { message, attemptId } = parseAttemptError(err)
      updateAnswer(questionId, { status: 'error', errorMessage: message, attemptId: attemptId ?? current.attemptId })
    }
  }

  if (loadError) return <ErrorBox message={loadError} />
  if (!session) return <Loading label="Loading session…" />

  if (sessionDone) {
    const scored = session.questions
      .map((q) => answers[q.id])
      .filter((a): a is QuestionState & { score: AttemptScoreResponse } => a.status === 'scored' && !!a.score)

    const dimensionKeys = Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]
    const averages = Object.fromEntries(
      dimensionKeys.map((key) => [
        key,
        scored.length === 0 ? 0 : scored.reduce((sum, a) => sum + a.score[key], 0) / scored.length,
      ]),
    ) as Record<keyof typeof DIMENSION_LABELS, number>

    return (
      <div className="page">
        <div className="session-header">
          <h2>{session.role}</h2>
          <span className="session-header-meta">
            {session.interview_type} · {session.difficulty}
          </span>
        </div>

        <section className="panel">
          <h3>Session summary</h3>
          <p className="page-subtitle">
            Average across {scored.length} of {session.questions.length} answered questions.
          </p>
          <div className="insight-marks">
            {dimensionKeys.map((key) => (
              <div className="insight-mark" key={key}>
                <span className="insight-mark-label">{DIMENSION_LABELS[key]}</span>
                <MarkScore value={averages[key]} label={DIMENSION_LABELS[key]} />
              </div>
            ))}
          </div>
        </section>

        {session.questions.map((q, i) => {
          const a = answers[q.id]
          if (a?.status !== 'scored' || !a.score) return null
          return (
            <section className="panel" key={q.id}>
              <h3>
                Q{i + 1}. {q.text}
              </h3>
              <div className="score-reveal">
                {dimensionKeys.map((key) => (
                  <div className="score-dimension" key={key}>
                    <div className="score-dimension-head">
                      <span>{DIMENSION_LABELS[key]}</span>
                      <MarkScore value={a.score![key]} label={DIMENSION_LABELS[key]} />
                    </div>
                    <EvidenceQuote text={a.score!.evidence[key]} />
                  </div>
                ))}
                <p className="feedback">{a.score.feedback}</p>
              </div>
            </section>
          )
        })}

        <section className="panel">
          <div className="input-mode-row">
            <Link to="/history" className="btn-primary">
              View history
            </Link>
            <Link to="/dashboard" className="btn-link">
              Back to dashboard
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const question = session.questions[currentIndex]
  const state = answers[question.id] ?? initialState()
  const disabled = state.status === 'submitting' || state.status === 'scored'
  const isLast = currentIndex === session.questions.length - 1

  return (
    <div className="page">
      <div className="session-header">
        <h2>{session.role}</h2>
        <span className="session-header-meta">
          {session.interview_type} · {session.difficulty}
        </span>
        <span className="session-counter">
          Question {currentIndex + 1} / {session.questions.length}
        </span>
      </div>

      <div className="panel question-panel">
        <h3>{question.text}</h3>
        {question.targets && <p className="question-targets">Targets: {question.targets}</p>}

        <textarea
          rows={6}
          value={state.answer}
          disabled={disabled}
          onChange={(e) => updateAnswer(question.id, { answer: e.target.value })}
          placeholder="Type your answer here..."
        />

        <div className="input-mode-row">
          <label className="radio-label">
            <input
              type="radio"
              name={`mode-${question.id}`}
              checked={state.inputMode === 'typed'}
              disabled={disabled}
              onChange={() => updateAnswer(question.id, { inputMode: 'typed' })}
            />
            Typed
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name={`mode-${question.id}`}
              checked={state.inputMode === 'spoken'}
              disabled={disabled}
              onChange={() => updateAnswer(question.id, { inputMode: 'spoken' })}
            />
            Spoken (transcript)
          </label>
        </div>

        {state.status !== 'scored' && (
          <button
            type="button"
            className="btn-primary"
            disabled={disabled || !state.answer.trim()}
            onClick={() => handleSubmit(question.id)}
          >
            {state.status === 'submitting' ? 'Scoring…' : 'Submit answer'}
          </button>
        )}

        {state.status === 'error' && (
          <div>
            <ErrorBox message={state.errorMessage ?? 'Something went wrong.'} />
            {state.attemptId && (
              <button type="button" className="btn-link" onClick={() => handleRetryScoring(question.id)}>
                Retry scoring
              </button>
            )}
          </div>
        )}

        {state.status === 'scored' && state.score && (
          <div className="score-reveal">
            {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map((key) => (
              <div className="score-dimension" key={key}>
                <div className="score-dimension-head">
                  <span>{DIMENSION_LABELS[key]}</span>
                  <MarkScore value={state.score![key]} label={DIMENSION_LABELS[key]} />
                </div>
                <EvidenceQuote text={state.score!.evidence[key]} />
              </div>
            ))}
            <p className="feedback">{state.score.feedback}</p>

            {isLast ? (
              <button type="button" className="btn-primary" onClick={() => setSessionDone(true)}>
                Finish session
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setCurrentIndex((i) => i + 1)}>
                Next question
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
