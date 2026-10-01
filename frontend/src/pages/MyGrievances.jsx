import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyGrievances } from '../services/grievances.js'
import { formatDateTime, formatPriority, formatStatus, statusClass } from '../utils/grievanceFormat.js'


function MyGrievances() {
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [grievances, setGrievances] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    getMyGrievances(accessToken)
      .then((items) => {
        if (isCurrent) setGrievances(items)
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
  }, [accessToken, logout, navigate])

  return (
    <section aria-labelledby="my-grievances-title" className="grievance-page-content">
      <div className="grievance-page-heading">
        <div>
          <span className="dashboard-eyebrow">YOUR CASES</span>
          <h2 id="my-grievances-title">My Grievances</h2>
          <p>Review case ownership, status, and expected resolution dates.</p>
        </div>
        <Link className="button button-primary" to="/student/submit">Submit Grievance</Link>
      </div>

      {isLoading && <div aria-live="polite" className="dashboard-state">Loading your grievances…</div>}
      {!isLoading && error && <div className="dashboard-state is-error" role="alert">{error}</div>}
      {!isLoading && !error && grievances.length === 0 && (
        <div className="dashboard-empty-state grievance-empty-state">
          <span aria-hidden="true" className="empty-state-icon"><LineIcon name="message" /></span>
          <h3>No grievances to show yet</h3>
          <p>Once you submit a grievance, its case status and timeline will appear here.</p>
          <Link className="button button-primary" to="/student/submit">Submit your first grievance</Link>
        </div>
      )}
      {!isLoading && !error && grievances.length > 0 && (
        <div className="grievance-table-wrap">
          <table className="grievance-table">
            <thead>
              <tr>
                <th scope="col">Case</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Assigned office</th>
                <th scope="col">Deadline</th>
                <th scope="col">Created</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {grievances.map((grievance) => (
                <tr key={grievance.case_id}>
                  <td data-label="Case">
                    <Link className="case-table-link" to={`/student/grievances/${encodeURIComponent(grievance.case_id)}`}>
                      <strong>{grievance.case_id}</strong>
                      <span>{grievance.title}</span>
                    </Link>
                  </td>
                  <td data-label="Status"><span className={`status-badge status-${statusClass(grievance.status)}`}>{formatStatus(grievance.status)}</span></td>
                  <td data-label="Priority"><span className={`priority-badge priority-${grievance.priority.toLowerCase()}`}>{formatPriority(grievance.priority)}</span></td>
                  <td data-label="Assigned office">{grievance.assigned_office}</td>
                  <td data-label="Deadline">{formatDateTime(grievance.deadline)}</td>
                  <td data-label="Created">{formatDateTime(grievance.created_at)}</td>
                  <td data-label="Actions">
                    <Link aria-label={`View case ${grievance.case_id}`} className="case-view-link" to={`/student/grievances/${encodeURIComponent(grievance.case_id)}`}>
                      View Case <LineIcon name="arrowRight" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}


export default MyGrievances