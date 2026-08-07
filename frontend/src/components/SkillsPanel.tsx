import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiErrorMessage, getResume } from '../api'
import type { HistoryItem } from '../api'
import MarkScore from './MarkScore'
import { ErrorBox, Loading } from './StateViews'

interface SkillsPanelProps {
  history: HistoryItem[]
}

interface SkillRow {
  name: string
  average: number | null
  attempts: number
}

/** A skill counts as "tested" if it shows up in a question's text or its
 * targets note — the same signal the interviewer prompt uses to probe it. */
function buildSkillRows(skills: string[], history: HistoryItem[]): SkillRow[] {
  return skills.map((name) => {
    const needle = name.toLowerCase()
    const matches = history.filter(
      (h) =>
        h.question_text.toLowerCase().includes(needle) ||
        (h.question_targets ?? '').toLowerCase().includes(needle),
    )
    if (matches.length === 0) return { name, average: null, attempts: 0 }
    const average =
      matches.reduce((sum, h) => sum + h.structure + h.technical_depth + h.specificity, 0) / (matches.length * 3)
    return { name, average, attempts: matches.length }
  })
}

/** The session behind the most recently scored answer — used as "the position
 * of the last interview you took" since we have no separate role tracking. */
function mostRecentSessionId(history: HistoryItem[]): string | null {
  if (history.length === 0) return null
  return history.reduce((latest, item) => (item.scored_at > latest.scored_at ? item : latest)).session_id
}

const STRONG_THRESHOLD = 3.5

export default function SkillsPanel({ history }: SkillsPanelProps) {
  const [skills, setSkills] = useState<string[] | null>(null)
  const [hasResume, setHasResume] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    getResume()
      .then((res) => {
        const parsedSkills = res.resume_parsed.skills
        setSkills(Array.isArray(parsedSkills) ? (parsedSkills as string[]) : [])
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setHasResume(false)
        } else {
          setLoadError(apiErrorMessage(err, 'Could not load your skills.'))
        }
      })
  }, [])

  if (loadError) return <ErrorBox message={loadError} />

  if (!hasResume) {
    return (
      <p className="page-subtitle">
        Upload your resume to see your skills here. <Link to="/onboarding">Add it now</Link>.
      </p>
    )
  }

  if (skills === null) return <Loading label="Loading skills…" />

  if (skills.length === 0) {
    return <p className="page-subtitle">We couldn't find any named skills on your resume.</p>
  }

  const rows = buildSkillRows(skills, history)
  const tested = rows.filter((row) => row.average !== null) as (SkillRow & { average: number })[]
  const topSkills = tested.filter((row) => row.average >= STRONG_THRESHOLD).sort((a, b) => b.average - a.average)
  const needsDevelopment = tested
    .filter((row) => row.average < STRONG_THRESHOLD)
    .sort((a, b) => a.average - b.average)

  const recentSessionId = mostRecentSessionId(history)
  const recentHistory = recentSessionId ? history.filter((h) => h.session_id === recentSessionId) : []
  const focusedSkills = skills.filter((name) => {
    const needle = name.toLowerCase()
    return recentHistory.some(
      (h) => h.question_text.toLowerCase().includes(needle) || (h.question_targets ?? '').toLowerCase().includes(needle),
    )
  })

  return (
    <div className="skills-panel">
      {focusedSkills.length > 0 && (
        <div className="skills-focused">
          <span className="skills-focused-label">Focused skills</span>
          <div className="skills-focused-chips">
            {focusedSkills.map((name) => (
              <span className="skill-chip" key={name}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="skills-columns">
        <div className="skills-column skills-column-positive">
          <h3>My top skills</h3>
          {topSkills.length > 0 ? (
            <div className="skills-grid">
              {topSkills.map((row) => (
                <div className="skill-row" key={row.name}>
                  <span className="skill-name">{row.name}</span>
                  <MarkScore value={row.average} label={row.name} />
                </div>
              ))}
            </div>
          ) : (
            <p className="skills-empty">
              Will appear here once you've answered enough questions to score a skill above {STRONG_THRESHOLD}/5.
            </p>
          )}
        </div>
        <div className="skills-column skills-column-focus">
          <h3>Needs development</h3>
          {needsDevelopment.length > 0 ? (
            <div className="skills-grid">
              {needsDevelopment.map((row) => (
                <div className="skill-row" key={row.name}>
                  <span className="skill-name">{row.name}</span>
                  <MarkScore value={row.average} label={row.name} />
                </div>
              ))}
            </div>
          ) : (
            <p className="skills-empty">Will appear here once a tested skill scores below {STRONG_THRESHOLD}/5.</p>
          )}
        </div>
      </div>
    </div>
  )
}
