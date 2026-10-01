import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime, formatPriority, formatStatus, statusClass } from '../utils/grievanceFormat.js'
import {
  getAdminCategories,
  getAdminOffices,
  getAdminOverdue,
  getAdminRecurring,
  getAdminStatuses,
  getAdminSummary,
} from '../services/admin.js'


function formatDuration(seconds) {
  if (seconds == null) return 'Not available'
  const days = seconds / 86400
  if (days >= 1) return `${days.toFixed(1)} days`
  return `${(seconds / 3600).toFixed(1)} hours`
}


function AdminDashboard() {
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      getAdminSummary(accessToken),
      getAdminCategories(accessToken),
      getAdminStatuses(accessToken),
      getAdminOffices(accessToken),
      getAdminOverdue(accessToken),
      getAdminRecurring(accessToken),
    ])
      .then(([summary, categories, statuses, offices, overdue, recurring]) => {
        if (!isCurrent) return
        setData({ summary, categories, statuses, offices, overdue, recurring })
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

  if (isLoading) {
    return <div aria-live="polite" className="admin-state">Loading institutional metrics…</div>
  }

  if (error) {
    return <div className="admin-state is-error" role="alert">{error}</div>
  }

  const { summary, categories, statuses, offices, overdue, recurring } = data
  const maxCategoryCount = Math.max(1, ...categories.map((item) => item.total_cases))

  return (
    <div className="admin-dashboard-page">
      <section className="admin-intro">
        <div>
          <span className="admin-eyebrow">INSTITUTIONAL ACCOUNTABILITY</span>
          <h2>Grievance performance</h2>
          <p>Aggregate workload, resolution, and deadline metrics across grievance cases.</p>
        </div>
        <span aria-hidden="true" className="admin-intro-icon"><LineIcon name="chart" /></span>
      </section>

      <section aria-label="Grievance performance summary" className="admin-summary-grid">
        {[
          ['Total grievances', summary.total_grievances, 'activity', ''],
          ['Open grievances', summary.open_grievances, 'message', ''],
          ['In progress', summary.in_progress, 'clock', ''],
          ['Resolved', summary.resolved, 'check', 'is-resolved'],
          ['Overdue', summary.overdue, 'calendar', 'is-overdue'],
          ['Average resolution', formatDuration(summary.average_resolution_seconds), 'chart', 'is-wide'],
        ].map(([label, value, icon, modifier]) => (
          <article className={`admin-summary-card ${modifier}`} key={label}>
            <span className="admin-summary-icon"><LineIcon name={icon} /></span>
            <span className="admin-summary-label">{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section aria-label="Resolution timing" className="resolution-metrics">
        <div>
          <span>Resolved within deadline</span>
          <strong>{summary.resolved_within_deadline}</strong>
        </div>
        <div>
          <span>Resolved after deadline</span>
          <strong>{summary.resolved_after_deadline}</strong>
        </div>
        <p>Resolution time is calculated from creation to <code>resolved_at</code> for cases with a recorded resolution timestamp.</p>
      </section>

      <div className="admin-analytics-grid">
        <section aria-labelledby="admin-categories-title" className="admin-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-eyebrow">SUBMISSION MIX</span><h2 id="admin-categories-title">Cases by category</h2></div>
          </div>
          {categories.length === 0 ? (
            <div className="admin-empty-state">No category data available.</div>
          ) : (
            <div className="category-bars">
              {categories.map((item) => (
                <div className="category-bar-row" key={item.category}>
                  <span>{item.category}</span>
                  <div aria-label={`${item.total_cases} cases`} className="category-bar-track">
                    <span style={{ width: `${(item.total_cases / maxCategoryCount) * 100}%` }} />
                  </div>
                  <strong>{item.total_cases}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="admin-status-title" className="admin-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-eyebrow">WORKFLOW</span><h2 id="admin-status-title">Cases by status</h2></div>
          </div>
          <div className="admin-status-list">
            {statuses.map((item) => (
              <div className="admin-status-row" key={item.status}>
                <span className={`status-badge status-${statusClass(item.status)}`}>{formatStatus(item.status)}</span>
                <strong>{item.total_cases}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="admin-offices-title" className="admin-panel office-performance-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-eyebrow">DISTRIBUTION</span><h2 id="admin-offices-title">Office performance</h2></div>
          <span className="admin-factual-note">Case volume and deadlines; no ranking</span>
        </div>
        {offices.length === 0 ? (
          <div className="admin-empty-state">No office data available.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Office</th>
                  <th scope="col">Total cases</th>
                  <th scope="col">Open</th>
                  <th scope="col">Resolved</th>
                  <th scope="col">Overdue</th>
                  <th scope="col">Average resolution</th>
                </tr>
              </thead>
              <tbody>
                {offices.map((office) => (
                  <tr key={office.office}>
                    <th scope="row">{office.office}</th>
                    <td>{office.total_cases}</td>
                    <td>{office.open_cases}</td>
                    <td>{office.resolved_cases}</td>
                    <td>{office.overdue_cases}</td>
                    <td>{formatDuration(office.average_resolution_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="admin-analytics-grid admin-lower-grid">
        <section aria-labelledby="recurring-categories-title" className="admin-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-eyebrow">RECURRING ISSUES</span><h2 id="recurring-categories-title">Categories with most submissions</h2></div>
          </div>
          <div className="recurring-list">
            {recurring.most_frequent_categories.map((item) => (
              <div key={item.category}><span>{item.category}</span><strong>{item.total_cases}</strong></div>
            ))}
          </div>
        </section>
        <section aria-labelledby="overdue-category-title" className="admin-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-eyebrow">DEADLINE SIGNAL</span><h2 id="overdue-category-title">Overdue by category</h2></div>
          </div>
          <div className="recurring-list">
            {recurring.categories_with_most_overdue.map((item) => (
              <div key={item.category}><span>{item.category}</span><strong>{item.total_cases}</strong></div>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="admin-overdue-title" className="admin-panel overdue-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-eyebrow">FOLLOW-UP REQUIRED</span><h2 id="admin-overdue-title">Overdue cases</h2></div>
          <span className="admin-factual-note">No complaint text shown</span>
        </div>
        {overdue.length === 0 ? (
          <div className="admin-empty-state">No overdue cases in the authorized reporting scope.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table overdue-table">
              <thead>
                <tr>
                  <th scope="col">Case ID</th>
                  <th scope="col">Category</th>
                  <th scope="col">Assigned office</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Deadline</th>
                  <th scope="col">Days overdue</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((item) => (
                  <tr key={item.case_id}>
                    <td><Link className="admin-case-link" to={`/admin/grievances/${encodeURIComponent(item.case_id)}`}>{item.case_id}</Link></td>
                    <td>{item.category}</td>
                    <td>{item.assigned_office}</td>
                    <td><span className={`priority-badge priority-${item.priority.toLowerCase()}`}>{formatPriority(item.priority)}</span></td>
                    <td><span className={`status-badge status-${statusClass(item.status)}`}>{formatStatus(item.status)}</span></td>
                    <td>{formatDateTime(item.deadline)}</td>
                    <td><strong className="days-overdue">{item.days_overdue}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="admin-scope-note">Metrics include only grievances visible to this admin account under its confidential-access permission.</p>
    </div>
  )
}


export default AdminDashboard