import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LineIcon from './LineIcon.jsx'

function GrievanceLink({ className, children, onClick }) {
  const { isAuthenticated, user } = useAuth()
  const destination = isAuthenticated && user?.role === 'STUDENT' ? '/student/submit' : '/login'

  return (
    <Link className={className} onClick={onClick} to={destination}>
      {children}
    </Link>
  )
}

function Brand() {
  return (
    <a className="brand" href="#home" aria-label="ResolveCampus home">
      <span className="brand-mark" aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
        </svg>
      </span>
      <span>ResolveCampus</span>
    </a>
  )
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header" id="home">
      <div className="nav-wrap">
        <Brand />
        <button
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <LineIcon name={menuOpen ? 'close' : 'menu'} />
        </button>
        <div className={`mobile-panel${menuOpen ? ' is-open' : ''}`}>
          <nav aria-label="Main navigation" className="primary-nav" id="primary-navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            <a href="#features" onClick={closeMenu}>Features</a>
          </nav>
          <div className="nav-actions">
            <Link className="login-link" to="/login" onClick={closeMenu}>Login</Link>
            <GrievanceLink className="button button-primary" onClick={closeMenu}>Submit a Grievance</GrievanceLink>
          </div>
        </div>
      </div>
    </header>
  )
}

function SampleCaseCard() {
  return (
    <article aria-label="Sample grievance case overview" className="sample-case-card">
      <span className="sample-banner">SAMPLE DATA</span>
      <div className="case-card-heading">
        <div>
          <p className="case-reference">CASE #RC-2026-0012</p>
          <h2>Scholarship Issue</h2>
        </div>
        <span className="status-pill"><span aria-hidden="true" />In Progress</span>
      </div>
      <div aria-hidden="true" className="case-card-rule" />
      <div className="case-card-details">
        <div className="case-card-detail">
          <span className="detail-label">Assigned office</span>
          <span className="detail-value">Scholarship Office</span>
        </div>
        <div className="case-card-detail">
          <span className="detail-label">Resolution target</span>
          <span className="detail-value">07 Oct 2026</span>
        </div>
      </div>
      <div aria-label="Two of four workflow steps complete" className="case-card-progress">
        <span /><span /><span /><span />
      </div>
    </article>
  )
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="hero-section">
      <div className="hero-wrap">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" />A clearer path to resolution</span>
          <h1 id="hero-title">Resolve. Track. <span>Account.</span></h1>
          <p className="hero-description">
            ResolveCampus helps students submit grievances, track progress, and stay informed while giving institutions a structured way to manage cases.
          </p>
          <div className="hero-actions">
            <GrievanceLink className="button button-primary">
              Submit a Grievance <LineIcon name="arrowRight" />
            </GrievanceLink>
            <a className="button button-secondary" href="#case-tracking">Track a Case</a>
          </div>
          <p className="hero-note"><LineIcon name="shield" />Clear ownership. Transparent progress.</p>
        </div>
        <div className="hero-visual">
          <SampleCaseCard />
          <div aria-hidden="true" className="visual-stamp">
            <LineIcon name="activity" />
            Case<br />in view
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const principles = ['Clear ownership', 'Transparent status', 'Deadline accountability']

  return (
    <section aria-labelledby="problem-title" className="problem-section">
      <div className="section-wrap problem-layout">
        <div className="section-heading">
          <span className="section-kicker">A better way to follow through</span>
          <h2 id="problem-title">Student concerns should not disappear after submission.</h2>
        </div>
        <div>
          <p className="problem-description">
            ResolveCampus gives every case a clear next step, a visible status, and an accountable path toward resolution.
          </p>
          <div className="principle-list">
            {principles.map((principle, index) => (
              <div className="principle" key={principle}>
                <span className="principle-number">0{index + 1}</span>
                <strong>{principle}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    ['Submit', 'Students describe the issue and provide relevant information.'],
    ['Route', 'The case is directed to the appropriate office.'],
    ['Resolve', 'Authorized staff review and act on the case.'],
    ['Track', 'Students can follow the case timeline until resolution.'],
  ]

  return (
    <section aria-labelledby="steps-title" className="steps-section" id="how-it-works">
      <div className="section-wrap">
        <div className="section-heading centered-heading">
          <span className="section-kicker">A clear process</span>
          <h2 id="steps-title">From concern to resolution</h2>
          <p>Every case follows a straightforward, visible path.</p>
        </div>
        <div className="steps-grid">
          {steps.map(([title, description], index) => (
            <article className="step-card" key={title}>
              <span className="step-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <article className="feature-card">
      <span className="feature-icon"><LineIcon name={icon} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

function FeaturesSection() {
  const features = [
    ['route', 'Smart Routing', 'Direct cases to the appropriate institutional office.'],
    ['activity', 'Case Tracking', 'Students can see the current status and timeline.'],
    ['clock', 'Deadline Accountability', 'Track expected resolution dates and overdue cases.'],
    ['shield', 'Confidential Handling', 'Restrict sensitive case information to authorized users.'],
    ['message', 'Resolution Feedback', 'Allow students to provide feedback after resolution.'],
    ['chart', 'Institutional Insights', 'Help administrators identify recurring issues and bottlenecks.'],
  ]

  return (
    <section aria-labelledby="features-title" className="features-section" id="features">
      <div className="section-wrap">
        <div className="section-heading">
          <span className="section-kicker">Designed for follow-through</span>
          <h2 id="features-title">Everything needed for accountable grievance handling.</h2>
        </div>
        <div className="features-grid">
          {features.map(([icon, title, description]) => (
            <FeatureCard description={description} icon={icon} key={title} title={title} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CaseTimeline() {
  const events = [
    { title: 'Grievance submitted', time: '30 Sep 2026, 10:30 AM', state: 'complete' },
    { title: 'Assigned to Scholarship Office', time: '30 Sep 2026, 10:31 AM', state: 'complete' },
    { title: 'Officer reviewing', time: '30 Sep 2026, 2:10 PM', state: 'current' },
    { title: 'Resolution pending', time: '', state: 'pending' },
  ]

  return (
    <section aria-labelledby="tracking-title" className="tracking-section" id="case-tracking">
      <div className="section-wrap">
        <div className="section-heading centered-heading">
          <span className="section-kicker">A clear view at every step</span>
          <h2 id="tracking-title">Know where your case stands.</h2>
          <p>A sample view of the case details and timeline a student can follow.</p>
        </div>
        <div className="tracking-panel">
          <div className="tracking-summary">
            <div className="tracking-summary-top">
              <span className="sample-banner">SAMPLE / DEMO DATA</span>
              <span className="tracking-status">In Progress</span>
            </div>
            <p className="case-reference tracking-id-label">CASE ID</p>
            <h3>RC-2026-0012</h3>
            <div className="tracking-meta">
              <div className="tracking-meta-item">
                <span className="meta-label">Category</span>
                <span className="tracking-meta-value">Scholarship</span>
              </div>
              <div className="tracking-meta-item">
                <span className="meta-label">Status</span>
                <span className="tracking-meta-value">In Progress</span>
              </div>
            </div>
            <div className="target-date">
              <span className="target-date-icon"><LineIcon name="calendar" /></span>
              <div>
                <span>Resolution target</span>
                <strong>07 Oct 2026</strong>
              </div>
            </div>
          </div>
          <div className="timeline-column">
            <h3 className="timeline-heading">Case timeline</h3>
            <ol aria-label="Sample case timeline" className="timeline-list">
              {events.map((event) => (
                <li className={`timeline-item is-${event.state}`} key={event.title}>
                  <span aria-hidden="true" className="timeline-marker">
                    {event.state === 'complete' ? '✓' : ''}
                  </span>
                  <div className="timeline-copy">
                    <strong>{event.title}</strong>
                    {event.time && <time>{event.time}</time>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section aria-labelledby="cta-title" className="cta-section" id="get-started">
      <div className="section-wrap cta-layout">
        <div className="cta-copy">
          <h2 id="cta-title">Make every grievance accountable.</h2>
          <p>Give students clarity and institutions a structured way to act.</p>
        </div>
        <GrievanceLink className="button button-light">
          Get Started <LineIcon name="arrowRight" />
        </GrievanceLink>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-wrap">
        <div className="footer-brand-block">
          <Brand />
          <p>Student grievance management, built for transparency and accountability.</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <Link className="footer-login" to="/login">Login</Link>
        </nav>
      </div>
    </footer>
  )
}

export {
  CTASection,
  CaseTimeline,
  FeatureCard,
  FeaturesSection,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  ProblemSection,
  SampleCaseCard,
}