import { Link } from 'react-router-dom'
import { IconBarChart, IconLayers, IconPlay, IconStar } from '../icons'

const DIMENSIONS = [
  {
    icon: IconLayers,
    title: 'Structure',
    body: 'Is the answer organized — a clear setup, what you did, and the result — or does it wander?',
  },
  {
    icon: IconBarChart,
    title: 'Technical depth',
    body: 'Does the answer show real understanding of the tools and tradeoffs, not just naming them?',
  },
  {
    icon: IconStar,
    title: 'Specificity',
    body: 'Concrete details — numbers, names, decisions — instead of vague, general statements.',
  },
]

export default function AboutPage() {
  return (
    <div className="page landing">
      <section className="section">
        <div className="section-head">
          <span className="section-eyebrow">About</span>
          <h2>What this is</h2>
          <p>
            AI Interview Coach turns your resume into a set of interview questions about your own
            projects and experience, then scores how you answer them. You can type or speak your
            answers; each one is graded and logged.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-eyebrow">Scoring</span>
          <h2>How scoring works</h2>
          <p>
            Each answer is scored 1–5 on three separate dimensions, tracked separately over time —
            there's no single averaged score, because structure and specificity don't improve at
            the same rate. Every score comes with the exact quote from your answer that produced
            it, so the reasoning is visible instead of a bare number.
          </p>
        </div>
        <div className="dimension-scroll">
          {DIMENSIONS.map((dimension) => (
            <div className="dimension-bubble" key={dimension.title}>
              <span className="feature-icon">
                <dimension.icon />
              </span>
              <h3>{dimension.title}</h3>
              <p>{dimension.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div className="cta-band-copy">
            <h2>Experience the AI advantage firsthand</h2>
            <p>Upload your resume and get scored feedback in minutes.</p>
          </div>
          <Link to="/signup" className="btn-primary cta-band-btn">
            <IconPlay /> Start Practicing Free
          </Link>
        </div>
      </section>
    </div>
  )
}
