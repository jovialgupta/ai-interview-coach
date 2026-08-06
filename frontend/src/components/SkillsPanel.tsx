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

  return (
    <div className="skills-grid">
      {rows.map((row) => (
        <div className="skill-row" key={row.name}>
          <span className="skill-name">{row.name}</span>
          {row.average !== null ? (
            <MarkScore value={row.average} label={row.name} />
          ) : (
            <span className="skill-untested">Not tested yet</span>
          )}
        </div>
      ))}
    </div>
  )
}
