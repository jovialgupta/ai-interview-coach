import { Link, Navigate } from 'react-router-dom'
import EvidenceQuote from '../components/EvidenceQuote'
import MarkScore from '../components/MarkScore'
import { useAuth } from '../auth'
import {
  IconBarChart,
  IconClock,
  IconDocument,
  IconLayers,
  IconMic,
  IconPlay,
  IconSliders,
  IconSparkle,
  IconStar,
  IconTrendingUp,
  IconWaveform,
} from '../icons'

const PILLARS = [
  {
    icon: IconSparkle,
    title: 'Open access',
    body: "Free to use while we're in beta — no credit card required to start practicing.",
  },
  {
    icon: IconDocument,
    title: 'Grounded in your background',
    body: 'Every question is generated from your actual resume, not a generic interview question bank.',
  },
  {
    icon: IconStar,
    title: 'Honest feedback',
    body: 'Every score comes with the exact quote from your answer that earned it — not a black-box number.',
  },
  {
    icon: IconTrendingUp,
    title: 'Built in the open',
    body: "We're actively building this out and shipping improvements based on feedback from people using it.",
  },
]

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

const CATEGORIES = [
  { name: 'Technology & Engineering', className: 'category-tech' },
  { name: 'Business, Finance & Operations', className: 'category-business' },
  { name: 'Marketing, Sales & Client Success', className: 'category-marketing' },
  { name: 'Design & Product', className: 'category-design' },
  { name: 'Support & Customer Success', className: 'category-support' },
]

const FAQS = [
  {
    q: 'Is Interview Coach free to use?',
    a: "Yes — it's free to use while we're in beta. There's no paid tier right now.",
  },
  {
    q: 'What do I need to get started?',
    a: 'Just your resume (a PDF, or pasted text if it’s a scanned copy) and a few minutes.',
  },
  {
    q: 'Do I have to speak my answers out loud?',
    a: 'No — every question can be answered by typing. Speaking is optional, and unlocks pacing and filler-word feedback.',
  },
  {
    q: 'How is my answer scored?',
    a: 'Each answer is scored 1–5 on structure, technical depth, and specificity, with the exact quote from your answer behind every mark.',
  },
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

      <section className="section" id="about">
        <div className="section-head">
          <span className="section-eyebrow">About us</span>
          <h2>Interview Coach is your personal AI interview coach</h2>
          <p>
            Most interview prep is guesswork — generic questions and a gut feeling about how you
            did. We built Interview Coach to make practice concrete: questions about your real
            projects and skills, and scores backed by evidence from your own answers, so you know
            exactly what to fix before the interview that matters.
          </p>
        </div>
        <div className="feature-grid">
          {PILLARS.map((pillar) => (
            <div className="feature-card" key={pillar.title}>
              <span className="feature-icon">
                <pillar.icon />
              </span>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-eyebrow">Why Interview Coach</span>
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

      <section className="section" id="faq">
        <div className="section-head">
          <span className="section-eyebrow">FAQ</span>
          <h2>Questions people actually ask</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((faq) => (
            <details className="faq-item" key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section" id="support">
        <div className="section-head">
          <span className="section-eyebrow">Support</span>
          <h2>Stuck, or something not working?</h2>
          <p>
            We're actively building this out and read every bit of feedback. Reach out and we'll
            help however we can.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div className="cta-band-copy">
            <h2>Experience the AI advantage firsthand</h2>
            <p>Join thousands of candidates landing their dream jobs.</p>
          </div>
          <Link to="/signup" className="btn-primary cta-band-btn">
            <IconPlay /> Start Practicing Free
          </Link>
        </div>
      </section>
    </div>
  )
}
