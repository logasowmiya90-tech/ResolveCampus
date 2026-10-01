import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CaseTimeline from '../components/CaseTimeline.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime, formatPriority, formatStatus, statusClass } from '../utils/grievanceFormat.js'
import { getAdminCase } from '../services/admin.js'


function AdminCaseDetails() {
  const { caseId } = useParams()
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    getAdminCase(accessToken, caseId)
      .then((result) => {
        if (isCurrent) setCaseData(result)
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

  if (isLoading) return <div aria-live="polite" className="admin-state">Loading authorized case details…</div>
  if (error) {
    return (
      <section className="admin-state is-error" role="alert">
        <h2>Case unavailable</h2>
        <p>{error}</p>
        <Link className="button button-secondary" to="/admin">Back to overview</Link>
      </section>
    )
  }
  if (!caseData) return null

  return (
    <div className="admin-case-page">
      <div className="admin-case-heading">
        <div>
          <Link className="admin-back-link" to="/admin">← Institutional overview</Link>
          <span className="admin-eyebrow">AUTHORIZED CASE VIEW</span>
          <h2>{caseData.case_id}</h2>
          <p>{caseData.category}</p>
        </div>
        <span className={`status-badge status-${statusClass(caseData.status)}`}>{formatStatus(caseData.status)}</span>
      </div>

      <section aria-labelledby="admin-case-information-title" className="admin-case-panel">
        <div className="admin-case-panel-heading">
          <div>
            <span className="admin-eyebrow">CASE INFORMATION</span>
            <h3 id="admin-case-information-title">{caseData.title}</h3>
          </div>
          <span className={`priority-badge priority-${caseData.priority.toLowerCase()}`}>{formatPriority(caseData.priority)} priority</span>
        </div>
        <dl className="admin-case-details-grid">
          <div className="admin-case-detail-wide">
            <dt>Description</dt>
            <dd className="admin-case-description">{caseData.description}</dd>
          </div>
          <div><dt>Student reference</dt><dd>{caseData.student_reference}</dd></div>
          <div><dt>Confidentiality</dt><dd>{formatStatus(caseData.confidentiality)}</dd></div>
          <div><dt>Assigned office</dt><dd>{caseData.assigned_office}</dd></div>
          <div><dt>Created</dt><dd>{formatDateTime(caseData.created_at)}</dd></div>
          <div><dt>Deadline</dt><dd>{formatDateTime(caseData.deadline)}</dd></div>
          <div><dt>Resolved</dt><dd>{formatDateTime(caseData.resolved_at)}</dd></div>
        </dl>
      </section>

      <CaseTimeline events={caseData.timeline} showVisibility />
    </div>
  )
}


export default AdminCaseDetails