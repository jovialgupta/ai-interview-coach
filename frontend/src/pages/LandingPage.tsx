import { Link, Navigate } from 'react-router-dom'
import EvidenceQuote from '../components/EvidenceQuote'
import MarkScore from '../components/MarkScore'
import { useAuth } from '../auth'
import { IconBarChart, IconLayers, IconPlay, IconSparkle, IconStar } from '../icons'

const CATEGORIES = [
  { name: 'Technology & Engineering', className: 'category-tech' },
  { name: 'Business, Finance & Operations', className: 'category-business' },
  { name: 'Marketing, Sales & Client Success', className: 'category-marketing' },
  { name: 'Design & Product', className: 'category-design' },
  { name: 'Support & Customer Success', className: 'category-support' },
]

const STEPS = [
  {
    n: '01',
    title: 'Add your background',
    body: "Upload your resume, or paste your details if it's a scanned PDF — either works.",
  },
  {
    n: '02',
    title: 'Pick a role',
    body: 'Choose a role, interview type, difficulty, and how many questions you want.',
  },
  {
    n: '03',
    title: 'Answer one at a time',
    body: 'Questions reference your actual projects and skills — typed or spoken, your choice.',
  },
  {
    n: '04',
    title: 'See exactly where you stand',
    body: 'Structure, technical depth, and specificity — each with the evidence behind the mark.',
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="page landing">
      <section className="hero-band">
        <span className="hero-blob hero-blob-1" aria-hidden="true" />
        <span className="hero-blob hero-blob-2" aria-hidden="true" />
        <div className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <IconSparkle /> AI mock interviews
            </span>
            <h1>
              See exactly where your <span className="highlight">interview answers</span> fall
              short.
            </h1>
            <p className="hero-sub">
              Upload your resume, answer role-specific questions, and get scored on structure,
              technical depth, and specificity — with the evidence behind every mark, not just a
              number.
            </p>
            <p className="hero-trust">No fluff feedback — every score is backed by a quote from your own answer.</p>
          </div>
          <div className="hero-visual">
            <span className="sticker sticker-structure">
              <IconLayers /> Structure
            </span>
            <span className="sticker sticker-depth">
              <IconBarChart /> Technical depth
            </span>
            <span className="sticker sticker-star">
              <IconStar /> Evidence-backed
            </span>
            <div className="hero-card">
              <div className="score-dimension">
                <div className="score-dimension-head">
                  <span>Technical depth</span>
                  <MarkScore value={2} label="Technical depth" />
                </div>
                <EvidenceQuote text="I used Redis because it is fast." />
              </div>
              <p className="feedback">
                Naming Redis is a good start — add why it beat Postgres here, ideally with a
                number (latency, load, team size) to back it up.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-eyebrow">How it works</span>
          <h2>From resume to real feedback in four steps</h2>
        </div>
        <div className="steps">
          {STEPS.map((step) => (
            <div className="step" key={step.n}>
              <span className="step-n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-eyebrow">Practice by role</span>
          <h2>Mock interviews built for your field</h2>
        </div>
        <div className="category-rail">
          {CATEGORIES.map((category) => (
            <div className={`category-card ${category.className}`} key={category.name}>
              <span className="category-badge">
                <IconSparkle /> Interview Coach AI
              </span>
              <h3>{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div className="cta-band-copy">
            <h2>Experience the AI advantage firsthand</h2>
            <p>Upload your resume and get your first round of scored feedback in minutes.</p>
          </div>
          <Link to="/signup" className="btn-primary cta-band-btn">
            <IconPlay /> Start Practicing Free
          </Link>
        </div>
      </section>
    </div>
  )
}
