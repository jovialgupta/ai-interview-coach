import axios from 'axios'
import type { AxiosInstance } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export const client: AxiosInstance = axios.create({ baseURL: BASE_URL })

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 from /api/auth/login means "wrong password" — the caller (LoginPage) needs
// to show that on the page, not have it redirect-clobbered. Every other 401 means
// the session is invalid/expired, so it's safe to clear the token and bounce to /login.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes('/api/auth/login')
    ) {
      clearToken()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object' && typeof detail.message === 'string') return detail.message
  }
  return fallback
}

/** Attempt-scoring errors may carry an attempt_id (see backend/app/routers/attempts.py)
 * so the caller can retry via rescoreAttempt instead of resubmitting the answer. */
export function parseAttemptError(err: unknown): { message: string; attemptId?: string } {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return { message: detail }
    if (detail && typeof detail === 'object') {
      const message = typeof detail.message === 'string' ? detail.message : 'Something went wrong.'
      const attemptId = typeof detail.attempt_id === 'string' ? detail.attempt_id : undefined
      return { message, attemptId }
    }
  }
  return { message: 'Something went wrong. Please try again.' }
}

// --- types (mirrors backend/app/schemas.py) ---

export type InterviewType = 'technical' | 'behavioural' | 'mixed'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionCount = 3 | 5 | 10
export type InputMode = 'typed' | 'spoken'

export interface MeResponse {
  id: string
  email: string
  has_resume: boolean
  resume_uploaded_at: string | null
  created_at: string
}

export interface ResumeResponse {
  resume_parsed: Record<string, unknown>
}

export interface QuestionOut {
  id: string
  text: string
  type: string
  targets: string | null
  order_index: number
}

export interface SessionOut {
  id: string
  role: string
  difficulty: string
  interview_type: string
  question_count: number
  created_at: string
  questions: QuestionOut[]
}

export interface SessionListItem {
  id: string
  role: string
  difficulty: string
  interview_type: string
  question_count: number
  created_at: string
}

export interface AttemptScoreResponse {
  attempt_id: string
  structure: number
  technical_depth: number
  specificity: number
  evidence: Record<string, string>
  feedback: string
  model: string
}

export interface HistoryItem {
  attempt_id: string
  session_id: string
  question_text: string
  question_type: string
  answer_text: string
  input_mode: string
  structure: number
  technical_depth: number
  specificity: number
  feedback: string | null
  scored_at: string
}

// --- auth ---

export async function signup(email: string, password: string): Promise<string> {
  const res = await client.post<{ access_token: string }>('/api/auth/signup', { email, password })
  return res.data.access_token
}

export async function login(email: string, password: string): Promise<string> {
  const res = await client.post<{ access_token: string }>('/api/auth/login', { email, password })
  return res.data.access_token
}

export async function getMe(): Promise<MeResponse> {
  const res = await client.get<MeResponse>('/api/me')
  return res.data
}

// --- resume ---

export async function pasteResume(contextText: string): Promise<ResumeResponse> {
  const res = await client.post<ResumeResponse>('/api/resume/paste', { context_text: contextText })
  return res.data
}

export async function uploadResume(file: File): Promise<ResumeResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await client.post<ResumeResponse>('/api/resume/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// --- sessions ---

export interface CreateSessionInput {
  role: string
  interview_type: InterviewType
  question_count: QuestionCount
  difficulty: Difficulty
}

export async function createSession(input: CreateSessionInput): Promise<SessionOut> {
  const res = await client.post<SessionOut>('/api/sessions', input)
  return res.data
}

export async function getSession(sessionId: string): Promise<SessionOut> {
  const res = await client.get<SessionOut>(`/api/sessions/${sessionId}`)
  return res.data
}

export async function listSessions(): Promise<SessionListItem[]> {
  const res = await client.get<SessionListItem[]>('/api/sessions')
  return res.data
}

// --- attempts ---

export async function createAttempt(
  questionId: string,
  answerText: string,
  inputMode: InputMode,
): Promise<AttemptScoreResponse> {
  const res = await client.post<AttemptScoreResponse>('/api/attempts', {
    question_id: questionId,
    answer_text: answerText,
    input_mode: inputMode,
  })
  return res.data
}

export async function rescoreAttempt(attemptId: string): Promise<AttemptScoreResponse> {
  const res = await client.post<AttemptScoreResponse>(`/api/attempts/${attemptId}/rescore`)
  return res.data
}

// --- history ---

export async function getHistory(): Promise<HistoryItem[]> {
  const res = await client.get<HistoryItem[]>('/api/history')
  return res.data
}

// --- derived dashboard/history data ---

export type DimensionKey = 'structure' | 'technical_depth' | 'specificity'

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  structure: 'Structure',
  technical_depth: 'Technical depth',
  specificity: 'Specificity',
}

const WEAKEST_DIMENSION_COPY: Record<DimensionKey, string> = {
  structure: 'Your answers often skip the outcome — lead with what changed, not just what you did.',
  technical_depth: 'Your answers name technologies but rarely explain why you chose them.',
  specificity: 'Your answers stay generic — add real numbers, names, and constraints.',
}

export interface DimensionInsight {
  weakest: DimensionKey
  sentence: string
  averages: Record<DimensionKey, number>
}

/** Averages every scored attempt across all sessions and names the single weakest
 * dimension, per the brief: an insight sentence, never a collapsed overall number. */
export function computeDimensionInsight(history: HistoryItem[]): DimensionInsight | null {
  if (history.length === 0) return null

  const totals: Record<DimensionKey, number> = { structure: 0, technical_depth: 0, specificity: 0 }
  for (const item of history) {
    totals.structure += item.structure
    totals.technical_depth += item.technical_depth
    totals.specificity += item.specificity
  }
  const averages: Record<DimensionKey, number> = {
    structure: totals.structure / history.length,
    technical_depth: totals.technical_depth / history.length,
    specificity: totals.specificity / history.length,
  }

  const weakest = (Object.keys(averages) as DimensionKey[]).reduce((a, b) =>
    averages[b] < averages[a] ? b : a,
  )

  return { weakest, sentence: WEAKEST_DIMENSION_COPY[weakest], averages }
}

export interface SessionAverages {
  structure: number
  technical_depth: number
  specificity: number
  scoredCount: number
}

/** Groups the flat history list by session_id and averages each dimension per
 * session, for the dashboard's past-sessions table. */
export function groupBySession(history: HistoryItem[]): Record<string, SessionAverages> {
  const totals: Record<string, { structure: number; technical_depth: number; specificity: number; count: number }> =
    {}
  for (const item of history) {
    const bucket = totals[item.session_id] ?? { structure: 0, technical_depth: 0, specificity: 0, count: 0 }
    bucket.structure += item.structure
    bucket.technical_depth += item.technical_depth
    bucket.specificity += item.specificity
    bucket.count += 1
    totals[item.session_id] = bucket
  }

  const result: Record<string, SessionAverages> = {}
  for (const [sessionId, bucket] of Object.entries(totals)) {
    result[sessionId] = {
      structure: bucket.structure / bucket.count,
      technical_depth: bucket.technical_depth / bucket.count,
      specificity: bucket.specificity / bucket.count,
      scoredCount: bucket.count,
    }
  }
  return result
}
