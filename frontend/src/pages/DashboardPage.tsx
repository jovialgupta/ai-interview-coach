import { useEffect, useState } from 'react'
import { DIMENSION_LABELS, apiErrorMessage, computeDimensionInsight, computeStreak, getHistory } from '../api'
import type { HistoryItem } from '../api'
import { getInitial, useAuth } from '../auth'
import MarkScore from '../components/MarkScore'
import SkillsPanel from '../components/SkillsPanel'
import StartInterviewForm from '../components/StartInterviewForm'
import { ErrorBox, Loading } from '../components/StateViews'
import { IconBarChart, IconClock, IconHome, IconLayers, IconPlay, IconSliders, IconTrendingUp } from '../icons'

type DashboardTab = 'overview' | 'prep' | 'skills'

const TABS: { key: DashboardTab; label: string; Icon: typeof IconHome }[] = [
  { key: 'overview', label: 'Overview', Icon: IconHome },
  { key: 'prep', label: 'Interview Prep', Icon: IconPlay },
  { key: 'skills', label: 'Skills', Icon: IconSliders },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<DashboardTab>('overview')

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((err) => setLoadError(apiErrorMessage(err, 'Could not load your dashboard.')))
  }, [])

  if (loadError) return <ErrorBox message={loadError} />
  if (!history) return <Loading label="Loading dashboard…" />

  const sessionCount = new Set(history.map((h) => h.session_id)).size
  const overallAverage = history.length
    ? history.reduce((sum, h) => sum + h.structure + h.technical_depth + h.specificity, 0) /
      (history.length * 3)
    : null
  const streak = computeStreak(history)
  const insight = computeDimensionInsight(history)

  return (
    <div className="page">
      <section className="profile-header">
        <span className="profile-avatar">{getInitial(user)}</span>
        <div className="profile-info">
          <h2>{user?.name || user?.email}</h2>
          {user?.name && <p className="profile-email">{user?.email}</p>}
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-icon">
              <IconClock />
            </span>
            <div className="profile-stat-text">
              <span className="profile-stat-label">Sessions</span>
              <span className="profile-stat-value">{sessionCount}</span>
            </div>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon">
              <IconLayers />
            </span>
            <div className="profile-stat-text">
              <span className="profile-stat-label">Questions attempted</span>
              <span className="profile-stat-value">{history.length}</span>
            </div>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon">
              <IconBarChart />
            </span>
            <div className="profile-stat-text">
              <span className="profile-stat-label">Average score</span>
              <span className="profile-stat-value">
                {overallAverage !== null ? `${overallAverage.toFixed(1)}/5` : '—'}
              </span>
            </div>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon">
              <IconTrendingUp />
            </span>
            <div className="profile-stat-text">
              <span className="profile-stat-label">Streak</span>
              <span className="profile-stat-value">
                {streak} day{streak === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
        {history.length === 0 && (
          <p className="profile-hint">No sessions yet — start one from the sidebar to see where you stand.</p>
        )}
      </section>

      <nav className="dashboard-tabs">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={key === tab ? 'dashboard-tab active' : 'dashboard-tab'}
            onClick={() => setTab(key)}
          >
            <span className="dashboard-tab-icon-badge">
              <Icon />
            </span>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' &&
        (insight ? (
          <section className="insight-cards">
            <div className="insight-card insight-card-positive">
              <span className="insight-card-eyebrow">What's going well</span>
              <div className="insight-card-head">
                <h3>{DIMENSION_LABELS[insight.strongest]}</h3>
                <MarkScore value={insight.averages[insight.strongest]} label={DIMENSION_LABELS[insight.strongest]} />
              </div>
              <p>{insight.strongestSentence}</p>
            </div>
            <div className="insight-card insight-card-focus">
              <span className="insight-card-eyebrow">What to work on</span>
              <div className="insight-card-head">
                <h3>{DIMENSION_LABELS[insight.weakest]}</h3>
                <MarkScore value={insight.averages[insight.weakest]} label={DIMENSION_LABELS[insight.weakest]} />
              </div>
              <p>{insight.sentence}</p>
            </div>
          </section>
        ) : (
          <p className="page-subtitle">Complete a session to see your strengths and focus areas here.</p>
        ))}

      {tab === 'prep' && (
        <section className="panel">
          <h2>Start a session</h2>
          <StartInterviewForm />
        </section>
      )}

      {tab === 'skills' && (
        <section className="panel">
          <h2>Skills</h2>
          <SkillsPanel history={history} />
        </section>
      )}
    </div>
  )
}
