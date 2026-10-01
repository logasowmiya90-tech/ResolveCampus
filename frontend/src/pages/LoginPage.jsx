import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardPathForRole } from '../services/auth.js'
import './AuthPages.css'


function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await login(normalizedEmail, password)
      const rolePath = dashboardPathForRole(user.role)
      const destination = location.state?.from
      navigate(destination === rolePath ? destination : rolePath, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign in failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section aria-label="ResolveCampus sign in" className="auth-layout">
        <div className="auth-intro">
          <Link aria-label="ResolveCampus home" className="brand auth-brand" to="/">
            <span aria-hidden="true" className="brand-mark">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
              </svg>
            </span>
            <span>ResolveCampus</span>
          </Link>
          <div className="auth-intro-copy">
            <span className="auth-overline">Student support, with follow-through</span>
            <h1>A clearer way to raise, track, and resolve student concerns.</h1>
            <p>One place to stay informed as a concern moves toward resolution.</p>
          </div>
          <div aria-hidden="true" className="auth-visual">
            <div className="auth-visual-topline">
              <span>CASE PROGRESS</span>
              <span className="auth-visual-live"><i /> ON TRACK</span>
            </div>
            <div className="auth-visual-route">
              <div className="auth-route-step is-done"><span><LineIcon name="check" /></span><b>Submitted</b></div>
              <div className="auth-route-connector is-done" />
              <div className="auth-route-step is-active"><span><LineIcon name="clock" /></span><b>In review</b></div>
              <div className="auth-route-connector" />
              <div className="auth-route-step"><span /> <b>Resolution</b></div>
            </div>
            <div className="auth-visual-foot">
              <LineIcon name="shield" />
              <span>Clear status. Accountable next steps.</span>
            </div>
          </div>
          <p className="auth-intro-foot">Built to make every case easier to follow.</p>
        </div>

        <div className="auth-form-side">
          <div className="login-card">
            <Link className="back-home" to="/">
              <span aria-hidden="true">←</span> Back to Home
            </Link>
            <div className="login-card-heading">
              <span className="login-card-kicker">Your account</span>
              <h2>Welcome back</h2>
              <p>Sign in to access your ResolveCampus account.</p>
            </div>

            <form className="login-form" noValidate onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="login-email">Email</label>
                <input
                  aria-describedby="login-feedback"
                  aria-invalid={Boolean(error)}
                  autoComplete="username"
                  autoFocus
                  id="login-email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </div>
              <div className="form-field">
                <label htmlFor="login-password">Password</label>
                <input
                  aria-describedby="login-feedback"
                  aria-invalid={Boolean(error)}
                  autoComplete="current-password"
                  id="login-password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </div>
              <div aria-live="polite" className={`login-message${error ? ' is-error' : ''}`} id="login-feedback">
                {error}
              </div>
              <button className="button button-primary login-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing in…' : 'Sign In'}
                {!isSubmitting && <LineIcon name="arrowRight" />}
              </button>
            </form>
            <p className="login-security-note"><LineIcon name="shield" />Your account is protected with secure sign-in.</p>
          </div>
          <p className="auth-side-foot">ResolveCampus <span aria-hidden="true">·</span> Student grievance management</p>
        </div>
      </section>
    </main>
  )
}


export default LoginPage