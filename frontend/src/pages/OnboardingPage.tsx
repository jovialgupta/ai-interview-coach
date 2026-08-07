import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage, pasteResume, uploadResume } from '../api'
import type { ResumeResponse } from '../api'
import { ErrorBox } from '../components/StateViews'
import { useAuth } from '../auth'

interface ParsedResume {
  skills?: string[]
  projects?: { name: string; tech: string[]; what_it_does: string; notable_decisions: string | null }[]
  experience?: { org: string; role: string; work: string }[]
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<'upload' | 'paste' | null>(null)
  const [result, setResult] = useState<ResumeResponse | null>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  async function handlePasteSubmit(e: FormEvent) {
    e.preventDefault()
    await submit('paste', () => pasteResume(text))
  }

  async function handleUploadSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    await submit('upload', () => uploadResume(file))
  }

  async function submit(action: 'upload' | 'paste', run: () => Promise<ResumeResponse>) {
    setError(null)
    setActiveAction(action)
    try {
      const response = await run()
      setResult(response)
      await refreshUser()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not process your resume. Please try again.'))
    } finally {
      setActiveAction(null)
    }
  }

  const parsed = result?.resume_parsed as ParsedResume | undefined

  return (
    <div className="page">
      <h2>Your background</h2>
      <p className="page-subtitle">
        {user?.has_resume
          ? 'You already have a resume on file. Submitting either option below replaces it.'
          : 'Upload a PDF or paste your details — questions are generated from whichever you use.'}
      </p>

      <div className="onboarding-columns">
        <form className="panel" onSubmit={handleUploadSubmit}>
          <h3>Upload PDF</h3>
          <label>
            PDF file (max 5 MB)
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </label>
          <button type="submit" className="btn-primary" disabled={activeAction !== null || !file}>
            {activeAction === 'upload' ? 'Processing…' : 'Extract and save'}
          </button>
        </form>

        <form className="panel" onSubmit={handlePasteSubmit}>
          <h3>Paste your details</h3>
          <label>
            Resume text or a description of your skills and projects
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume text, or describe your skills, projects, and experience..."
            />
          </label>
          <button type="submit" className="btn-primary" disabled={activeAction !== null || !text.trim()}>
            {activeAction === 'paste' ? 'Processing…' : 'Extract and save'}
          </button>
        </form>
      </div>

      {error && <ErrorBox message={error} />}

      {parsed && (
        <div className="panel">
          <h3>Does this look right?</h3>
          <p className="page-subtitle">This is what we'll use to write your interview questions.</p>
          {parsed.skills && parsed.skills.length > 0 && (
            <>
              <h4>Skills</h4>
              <ul className="skill-list">
                {parsed.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </>
          )}
          {parsed.projects && parsed.projects.length > 0 && (
            <>
              <h4>Projects</h4>
              <ul className="plain-list">
                {parsed.projects.map((p, i) => (
                  <li key={i}>
                    <strong>{p.name}</strong> — {p.what_it_does}
                  </li>
                ))}
              </ul>
            </>
          )}
          {parsed.experience && parsed.experience.length > 0 && (
            <>
              <h4>Experience</h4>
              <ul className="plain-list">
                {parsed.experience.map((exp, i) => (
                  <li key={i}>
                    {exp.role} at {exp.org}
                  </li>
                ))}
              </ul>
            </>
          )}
          <button type="button" className="btn-primary" onClick={() => navigate('/dashboard')}>
            Looks right — continue
          </button>
        </div>
      )}
    </div>
  )
}
