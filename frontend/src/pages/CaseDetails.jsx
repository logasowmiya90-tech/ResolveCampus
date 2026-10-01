import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CaseTimeline from '../components/CaseTimeline.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getGrievance, getGrievanceTimeline } from '../services/grievances.js'
import { formatDateTime, formatPriority, formatStatus, statusClass } from '../utils/grievanceFormat.js'


function CaseDetails() {
  const { caseId } = useParams()
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [grievance, setGrievance] = useState(null)
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    Promise.all([
      getGrievance(accessToken, caseId),
      getGrievanceTimeline(accessToken, caseId),
    ])
      .then(([caseData, timeline]) => {
        if (!isCurrent) return
        setGrievance(caseData)
        setEvents(timeline)
      })
      .catch((requestError) => {
        if (!isCurrent) return
        if (requestError.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => { isCurrent = false }
  }, [accessToken, caseId, logout, navigate])

  if (isLoading) {
    return <div aria-live="polite" className="dashboard-state">Loading case details…</div>
  }

  if (error) {
    return (
      <section className="case-load-error" role="alert">
        <h2>We could not load this case</h2>
        <p>{error}</p>
        <Link className="button button-secondary" to="/student/grievances">Back to My Grievances</Link>
      </section>
    )
  }

  if (!grievance) return null

  return (
    <div className="grievance-page-content case-details-page">
      <div className="case-details-heading">
        <div>
          <Link className="back-to-cases" to="/student/grievances">← My Grievances</Link>
          <span className="dashboard-eyebrow">CASE DETAILS</span>
          <h2>{grievance.title}</h2>
          <p className="case-details-id">{grievance.case_id} <span aria-hidden="true">·</span> {grievance.category}</p>
        </div>
        <span className={`status-badge status-${statusClass(grievance.status)}`}>{formatStatus(grievance.status)}</span>
      </div>

      <section aria-labelledby="case-summary-title" className="case-summary-panel">
        <div className="case-summary-header">
          <div>
            <span className="dashboard-eyebrow">CASE SUMMARY</span>
            <h3 id="case-summary-title">What to know</h3>
          </div>
          <span className={`priority-badge priority-${grievance.priority.toLowerCase()}`}>
            {formatPriority(grievance.priority)} priority
          </span>
        </div>

        <dl className="case-details-grid">
          <div className="case-detail-field case-detail-wide">
            <dt>Description</dt>
            <dd className="case-description">{grievance.description}</dd>
          </div>
          <div className="case-detail-field">
            <dt>Category</dt>
            <dd>{grievance.category}</dd>
          </div>
          <div className="case-detail-field">
            <dt>Confidentiality</dt>
            <dd>{formatStatus(grievance.confidentiality)}</dd>
          </div>
          <div className="case-detail-field">
            <dt>Assigned office</dt>
            <dd>{grievance.assigned_office}</dd>
          </div>
          <div className="case-detail-field">
            <dt>Resolution deadline</dt>
            <dd>{formatDateTime(grievance.deadline)}</dd>
          </div>
          <div className="case-detail-field">
            <dt>Submitted</dt>
            <dd>{formatDateTime(grievance.created_at)}</dd>
          </div>
          <div className="case-detail-field">
            <dt>Last updated</dt>
            <dd>{formatDateTime(grievance.updated_at)}</dd>
          </div>
        </dl>
      </section>

      <CaseTimeline events={events} />
    </div>
  )
}


export default CaseDetails