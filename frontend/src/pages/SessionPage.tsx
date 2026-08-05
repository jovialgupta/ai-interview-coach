import { useEffect, useRef, useState } from 'react'
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
import { computeDeliveryStats } from '../delivery'
import EvidenceQuote from '../components/EvidenceQuote'
import MarkScore from '../components/MarkScore'
import { ErrorBox, Loading } from '../components/StateViews'
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../speech'
import type { SpeechController } from '../speech'

interface QuestionState {
  answer: string
  inputMode: InputMode
  status: 'idle' | 'submitting' | 'scored' | 'error'
  score?: AttemptScoreResponse
  errorMessage?: string
  attemptId?: string
  speakingSeconds: number
}

function initialState(): QuestionState {
  return { answer: '', inputMode: 'typed', status: 'idle', speakingSeconds: 0 }
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionOut | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, QuestionState>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionDone, setSessionDone] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const speechRef = useRef<SpeechController | null>(null)
  const recordingStartedAtRef = useRef<number | null>(null)
  const speechSupported = isSpeechRecognitionSupported()

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then((s) => {
        setSession(s)
        setAnswers(
          Object.fromEntries(
            s.questions.map((q) => [
              q.id,
              q.attempt
                ? {
                    answer: '',
                    inputMode: 'typed' as InputMode,
                    status: 'scored' as const,
                    score: q.attempt,
                    attemptId: q.attempt.attempt_id,
                    speakingSeconds: 0,
                  }
                : initialState(),
            ]),
          ),
        )
        const firstUnanswered = s.questions.findIndex((q) => !q.attempt)
        if (firstUnanswered === -1) {
          setSessionDone(true)
        } else {
          setCurrentIndex(firstUnanswered)
        }
      })
      .catch((err) => setLoadError(apiErrorMessage(err, 'Could not load this session.')))
  }, [sessionId])

  function updateAnswer(questionId: string, patch: Partial<QuestionState>) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }))
  }

  function appendTranscript(questionId: string, text: string) {
    if (!text) return
    setAnswers((prev) => {
      const current = prev[questionId] ?? initialState()
      const separator = current.answer && !current.answer.endsWith(' ') ? ' ' : ''
      return { ...prev, [questionId]: { ...current, answer: current.answer + separator + text } }
    })
  }

  // Recorded once here (rather than in both stopRecording and this onEnd
  // callback) so a manual stop and the recognizer's own auto-end can't both
  // add the same elapsed time — onEnd always fires exactly once per session,
  // regardless of what triggered it.
  function finishRecording(questionId: string) {
    const startedAt = recordingStartedAtRef.current
    recordingStartedAtRef.current = null
    speechRef.current = null
    setIsRecording(false)
    if (startedAt === null) return
    const elapsedSeconds = (Date.now() - startedAt) / 1000
    setAnswers((prev) => {
      const current = prev[questionId] ?? initialState()
      return { ...prev, [questionId]: { ...current, speakingSeconds: current.speakingSeconds + elapsedSeconds } }
    })
  }

  function stopRecording() {
    speechRef.current?.stop()
  }

  function startRecording(questionId: string) {
    if (!speechSupported || speechRef.current) return
    const controller = createSpeechRecognition(
      (text) => appendTranscript(questionId, text),
      () => finishRecording(questionId),
    )
    if (!controller) return
    speechRef.current = controller
    recordingStartedAtRef.current = Date.now()
    setIsRecording(true)
    controller.start()
  }

  // Stop any in-progress recording when leaving the current question (next
  // question, session finished, or navigating away entirely).
  useEffect(() => {
    return () => stopRecording()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, sessionDone])

  function advance(fromIndex: number) {
    if (!session) return
    if (fromIndex >= session.questions.length - 1) {
      setSessionDone(true)
    } else {
      setCurrentIndex(fromIndex + 1)
    }
  }

  async function handleSubmit(questionId: string) {
    const current = answers[questionId]
    if (!current || !current.answer.trim()) return
    const submittedIndex = currentIndex
    updateAnswer(questionId, { status: 'submitting', errorMessage: undefined })
    try {
      const score = await createAttempt(questionId, current.answer, current.inputMode)
      updateAnswer(questionId, { status: 'scored', score, attemptId: score.attempt_id })
      advance(submittedIndex)
    } catch (err) {
      const { message, attemptId } = parseAttemptError(err)
      updateAnswer(questionId, { status: 'error', errorMessage: message, attemptId })
    }
  }

  async function handleRetryScoring(questionId: string) {
    const current = answers[questionId]
    if (!current?.attemptId) return
    const submittedIndex = currentIndex
    updateAnswer(questionId, { status: 'submitting', errorMessage: undefined })
    try {
      const score = await rescoreAttempt(current.attemptId)
      updateAnswer(questionId, { status: 'scored', score })
      advance(submittedIndex)
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
          const delivery = a.inputMode === 'spoken' ? computeDeliveryStats(a.answer, a.speakingSeconds) : null
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
                {delivery && (
                  <p className="delivery-note">
                    {delivery.wpm} wpm · ~{delivery.fillerCount} filler word{delivery.fillerCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </section>
          )
        })}

        <section className="panel">
          <div className="input-mode-row">
            <Link to="/learning-journey" className="btn-primary">
              View progress
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

        {state.inputMode === 'spoken' && (
          <div className="recording-row">
            {speechSupported ? (
              <>
                <button
                  type="button"
                  className={isRecording ? 'btn-primary recording' : 'btn-primary'}
                  disabled={disabled}
                  onClick={() => (isRecording ? stopRecording() : startRecording(question.id))}
                >
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </button>
                {isRecording && <span className="recording-indicator">Listening…</span>}
              </>
            ) : (
              <p className="page-subtitle">
                Voice input isn't supported in this browser — you can still type your answer.
              </p>
            )}
          </div>
        )}

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
      </div>
    </div>
  )
}
