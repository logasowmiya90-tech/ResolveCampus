import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime, formatPriority, formatStatus, statusClass } from '../utils/grievanceFormat.js'
import { getOfficerDashboard } from '../services/officer.js'


const STATUS_OPTIONS = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH']
const CATEGORY_OPTIONS = ['Scholarship', 'Examination', 'Certificates/Documents', 'Fees', 'Hostel', 'Other']


function OfficerDashboard() {
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' })
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    setError('')
    getOfficerDashboard(accessToken, filters)
      .then((result) => {
        if (isCurrent) setDashboard(result)
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
  }, [accessToken, filters, logout, navigate])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function submitSearch(event) {
    event.preventDefault()
    setFilters((current) => ({ ...current, search: searchInput.trim() }))
  }

  function clearFilters() {
    setSearchInput('')
    setFilters({ status: '', priority: '', category: '', search: '' })
  }

  const counts = dashboard?.counts

  return (
    <div className="officer-dashboard-page">
      <section className="officer-welcome">
        <div>
          <span className="officer-eyebrow">ASSIGNED OFFICE</span>
          <h2>{dashboard?.office_name || 'Office assignment required'}</h2>
          <p>Review cases routed to your office and keep each next step documented.</p>
        </div>
        <span aria-hidden="true" className="officer-welcome-icon"><LineIcon name="shield" /></span>
      </section>

      <section aria-label="Office case totals" className="officer-stats-grid">
        {[
          ['Total assigned', counts?.total_assigned_cases, 'activity'],
          ['Submitted', counts?.submitted_cases, 'message'],
          ['In progress', counts?.in_progress_cases, 'clock'],
          ['Resolved', counts?.resolved_cases, 'check'],
          ['Overdue', counts?.overdue_cases, 'calendar'],
        ].map(([label, value, icon]) => (
          <article className={`officer-stat-card${label === 'Overdue' ? ' is-overdue' : ''}`} key={label}>
            <span className="officer-stat-icon"><LineIcon name={icon} /></span>
            <span className="officer-stat-label">{label}</span>
            <strong>{isLoading ? '—' : value ?? 0}</strong>
          </article>
        ))}
      </section>

      <section aria-labelledby="assigned-cases-title" className="officer-case-section">
        <div className="officer-list-heading">
          <div>
            <span className="officer-eyebrow">CASE QUEUE</span>
            <h2 id="assigned-cases-title">Assigned cases</h2>
          </div>
          {dashboard && <span className="officer-results-count">{dashboard.grievances.length} cases</span>}
        </div>

        <div className="officer-filters">
          <label>
            <span>Status</span>
            <select name="status" onChange={updateFilter} value={filters.status}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select name="priority" onChange={updateFilter} value={filters.priority}>
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{formatPriority(priority)}</option>)}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select name="category" onChange={updateFilter} value={filters.category}>
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <form className="officer-search" onSubmit={submitSearch}>
            <label htmlFor="officer-case-search">Search cases</label>
            <div>
              <input
                id="officer-case-search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Case ID or title"
                type="search"
                value={searchInput}
              />
              <button aria-label="Search cases" type="submit"><LineIcon name="search" /></button>
            </div>
          </form>
          <button className="officer-clear-filters" onClick={clearFilters} type="button">Clear filters</button>
        </div>

        {isLoading && <div aria-live="polite" className="officer-state">Loading assigned cases…</div>}
        {!isLoading && error && <div className="officer-state is-error" role="alert">{error}</div>}
        {!isLoading && !error && dashboard?.grievances.length === 0 && (
          <div className="officer-empty-state">
            <span aria-hidden="true"><LineIcon name="check" /></span>
            <h3>{Object.values(filters).some(Boolean) ? 'No matching cases' : 'No assigned cases yet'}</h3>
            <p>{Object.values(filters).some(Boolean) ? 'Try adjusting the filters or search terms.' : 'New cases routed to your office will appear here.'}</p>
          </div>
        )}
        {!isLoading && !error && dashboard?.grievances.length > 0 && (
          <div className="officer-table-wrap">
            <table className="officer-case-table">
              <thead>
                <tr>
                  <th scope="col">Case ID</th>
                  <th scope="col">Category</th>
                  <th scope="col">Title</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Deadline</th>
                  <th scope="col"><span className="officer-sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {dashboard.grievances.map((grievance) => (
                  <tr key={grievance.case_id}>
                    <td data-label="Case ID"><strong className="officer-case-id">{grievance.case_id}</strong></td>
                    <td data-label="Category">{grievance.category}</td>
                    <td className="officer-title-cell" data-label="Title">{grievance.title}</td>
                    <td data-label="Priority"><span className={`priority-badge priority-${grievance.priority.toLowerCase()}`}>{formatPriority(grievance.priority)}</span></td>
                    <td data-label="Status"><span className={`status-badge status-${statusClass(grievance.status)}`}>{formatStatus(grievance.status)}</span></td>
                    <td data-label="Created">{formatDateTime(grievance.created_at)}</td>
                    <td data-label="Deadline">
                      <span className={grievance.is_overdue ? 'officer-deadline is-overdue' : ''}>
                        {formatDateTime(grievance.deadline)}{grievance.is_overdue ? ' · Overdue' : ''}
                      </span>
                    </td>
                    <td data-label="Action"><Link className="officer-view-link" to={`/officer/grievances/${encodeURIComponent(grievance.case_id)}`}>Review case <LineIcon name="arrowRight" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}


export default OfficerDashboard