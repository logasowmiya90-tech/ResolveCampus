import { Link } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatStatus, statusClass } from '../utils/grievanceFormat.js'


const DEMO_GRIEVANCES = [
  {
    case_id: 'RC-2026-0038',
    title: 'Scholarship renewal not reflected',
    category: 'Scholarship',
    status: 'IN_PROGRESS',
    created_at: '2026-09-25T10:30:00Z',
    is_overdue: true,
  },
  {
    case_id: 'RC-2026-0041',
    title: 'Examination fee receipt correction',
    category: 'Examination',
    status: 'SUBMITTED',
    created_at: '2026-09-28T09:15:00Z',
    is_overdue: false,
  },
  {
    case_id: 'RC-2026-0040',
    title: 'Name correction on course certificate',
    category: 'Certificates/Documents',
    status: 'RESOLVED',
    created_at: '2026-09-27T13:45:00Z',
    is_overdue: false,
  },
  {
    case_id: 'RC-2026-0035',
    title: 'Hostel room maintenance request',
    category: 'Hostel',
    status: 'CLOSED',
    created_at: '2026-09-20T08:20:00Z',
    is_overdue: false,
  },
  {
    case_id: 'RC-2026-0042',
    title: 'Tuition payment status update',
    category: 'Fees',
    status: 'ASSIGNED',
    created_at: '2026-09-29T11:05:00Z',
    is_overdue: false,
  },
]

const QUICK_CATEGORIES = [
  ['Scholarships', 'message'],
  ['Examinations', 'activity'],
  ['Certificates', 'check'],
  ['Fees', 'chart'],
  ['Hostel', 'shield'],
  ['Other', 'route'],
]

function formatSubmittedDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}


function StudentOverview() {
  const { user } = useAuth()
  const activeCount = DEMO_GRIEVANCES.filter((item) => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status)).length
  const resolvedCount = DEMO_GRIEVANCES.filter((item) => ['RESOLVED', 'CLOSED'].includes(item.status)).length
  const overdueCount = DEMO_GRIEVANCES.filter((item) => item.is_overdue).length
  const recentGrievances = [...DEMO_GRIEVANCES]
    .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
    .slice(0, 4)

  return (
    <div className="overview-content">
      <section aria-labelledby="welcome-title" className="student-welcome">
        <div>
          <div className="student-welcome-kicker">
            <span className="dashboard-eyebrow">YOUR STUDENT SPACE</span>
            <span className="demo-data-badge">DEMO DATA</span>
          </div>
          <h2 id="welcome-title">Welcome back, {user.name}</h2>
          <p>Keep track of your concerns, the office handling them, and what happens next.</p>
        </div>
        <span aria-hidden="true" className="welcome-mark"><LineIcon name="shield" /></span>
      </section>

      <section aria-label="Grievance summary" className="overview-stats">
        <article className="overview-stat">
          <span className="overview-stat-icon"><LineIcon name="message" /></span>
          <span className="overview-stat-label">Total Grievances</span>
          <strong>{DEMO_GRIEVANCES.length}</strong>
        </article>
        <article className="overview-stat">
          <span className="overview-stat-icon is-active"><LineIcon name="clock" /></span>
          <span className="overview-stat-label">Active Cases</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="overview-stat">
          <span className="overview-stat-icon is-resolved"><LineIcon name="check" /></span>
          <span className="overview-stat-label">Resolved Cases</span>
          <strong>{resolvedCount}</strong>
        </article>
        <article className="overview-stat">
          <span className="overview-stat-icon is-overdue"><LineIcon name="calendar" /></span>
          <span className="overview-stat-label">Overdue Cases</span>
          <strong>{overdueCount}</strong>
        </article>
      </section>

      <section aria-labelledby="recent-cases-title" className="dashboard-section overview-recent">
        <div className="dashboard-section-heading">
          <div>
            <div className="overview-section-kicker">
              <span className="dashboard-eyebrow">CASE ACTIVITY</span>
              <span className="demo-data-badge">SAMPLE CASES</span>
            </div>
            <h2 id="recent-cases-title">Recent grievances</h2>
          </div>
          <Link className="button button-secondary dashboard-action" to="/student/submit">Submit a Grievance</Link>
        </div>

        <div className="student-recent-table-wrap">
          <table className="student-recent-table">
            <thead>
              <tr>
                <th scope="col">Case ID</th>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Submitted Date</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {recentGrievances.map((grievance) => (
                <tr key={grievance.case_id}>
                  <td data-label="Case ID"><strong className="student-case-id">{grievance.case_id}</strong></td>
                  <td className="student-case-title" data-label="Title">{grievance.title}</td>
                  <td data-label="Category">{grievance.category}</td>
                  <td data-label="Status"><span className={`status-badge status-${statusClass(grievance.status)}`}>{formatStatus(grievance.status)}</span></td>
                  <td data-label="Submitted Date">{formatSubmittedDate(grievance.created_at)}</td>
                  <td data-label="Action"><Link aria-label={`View ${grievance.case_id}`} className="student-case-view" to={`/student/grievances/${encodeURIComponent(grievance.case_id)}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="quick-categories-title" className="dashboard-section quick-categories-section">
        <div className="dashboard-section-heading quick-categories-heading">
          <div>
            <span className="dashboard-eyebrow">COMMON TOPICS</span>
            <h2 id="quick-categories-title">Quick categories</h2>
          </div>
          <Link className="text-link" to="/student/submit">Choose a category <LineIcon name="arrowRight" /></Link>
        </div>
        <div className="quick-category-grid">
          {QUICK_CATEGORIES.map(([category, icon]) => (
            <div className="quick-category-card" key={category}>
              <span aria-hidden="true"><LineIcon name={icon} /></span>
              <strong>{category}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


export default StudentOverview