import { Link } from 'react-router-dom'
import './AuthPages.css'


function RolePlaceholder({ role }) {
  return (
    <main className="role-placeholder-page">
      <Link aria-label="ResolveCampus home" className="brand" to="/">
        <span aria-hidden="true" className="brand-mark">
          <svg fill="none" viewBox="0 0 24 24">
            <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
          </svg>
        </span>
        <span>ResolveCampus</span>
      </Link>
      <div className="role-placeholder-message">
        <span className="role-placeholder-kicker">More workspace features are on the way</span>
        <h1>{role} Dashboard — Coming Next</h1>
        <Link className="button button-secondary" to="/">Back to Home</Link>
      </div>
    </main>
  )
}


export default RolePlaceholder