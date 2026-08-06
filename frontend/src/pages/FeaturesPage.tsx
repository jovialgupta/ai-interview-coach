import { Link } from 'react-router-dom'
import {
  IconBarChart,
  IconClock,
  IconDocument,
  IconMic,
  IconPlay,
  IconSliders,
  IconStar,
  IconTrendingUp,
  IconWaveform,
} from '../icons'

const FEATURES = [
  {
    icon: IconDocument,
    title: 'Resume-aware questions',
    body: 'Every question is generated from your actual resume — your named projects, skills, and experience — not a generic question bank.',
  },
  {
    icon: IconMic,
    title: 'Type or speak your answers',
    body: 'Answer by typing or talking. Live speech-to-text captures spoken answers, with a fallback when your browser can’t support voice input.',
  },
  {
    icon: IconStar,
    title: 'Evidence-backed scoring',
    body: 'Every score comes with the exact quote from your answer that earned it — not just a number with no explanation.',
  },
  {
    icon: IconWaveform,
    title: 'Delivery feedback',
    body: 'Spoken answers get pacing (words per minute) and filler-word counts, so you can see how you sounded, not just what you said.',
  },
  {
    icon: IconSliders,
    title: 'Role, type & difficulty control',
    body: 'Pick a role, choose technical, behavioural, or mixed, set the difficulty, and how many questions you want to answer.',
  },
  {
    icon: IconBarChart,
    title: 'Per-session summaries',
    body: 'Every session ends with average scores per dimension and a full breakdown of each answer, feedback, and evidence.',
  },
  {
    icon: IconTrendingUp,
    title: 'Progress over time',
    body: 'A learning journey chart tracks structure, technical depth, and specificity across every attempt, so you can see yourself improving.',
  },
  {
    icon: IconClock,
    title: 'Full interview history',
    body: 'Every past session is saved with its scores, so you can revisit old answers and feedback whenever you need to.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="page landing">
      <section className="section">
        <div className="section-head">
          <span className="section-eyebrow">Features</span>
          <h2>Everything you need to practice smarter</h2>
          <p>Real feedback grounded in your own resume and your own answers — not generic tips.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <span className="feature-icon">
                <feature.icon />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
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
