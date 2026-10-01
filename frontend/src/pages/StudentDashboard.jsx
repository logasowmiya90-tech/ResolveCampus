import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './StudentDashboard.css'


function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = location.pathname.startsWith('/student/submit')
    ? 'Submit Grievance'
    : location.pathname.startsWith('/student/grievances/')
      ? 'Case Details'
      : location.pathname.startsWith('/student/grievances')
        ? 'My Grievances'
        : 'Overview'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="student-app-shell">
      <aside aria-label="Student workspace" className="student-sidebar">
        <NavLink aria-label="ResolveCampus home" className="brand dashboard-brand" to="/">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
            </svg>
          </span>
          <span>ResolveCampus</span>
        </NavLink>
        <p className="sidebar-label">STUDENT WORKSPACE</p>
        <nav aria-label="Student navigation" className="student-nav">
          <NavLink className={({ isActive }) => `student-nav-link${isActive ? ' is-active' : ''}`} end to="/student">
            <LineIcon name="activity" />Overview
          </NavLink>
          <NavLink className={({ isActive }) => `student-nav-link${isActive ? ' is-active' : ''}`} to="/student/grievances">
            <LineIcon name="message" />My Grievances
          </NavLink>
          <NavLink className={({ isActive }) => `student-nav-link${isActive ? ' is-active' : ''}`} to="/student/submit">
            <LineIcon name="route" />Submit Grievance
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span aria-hidden="true" className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span className="sidebar-user-copy"><strong>{user.name}</strong><small>Student</small></span>
          </div>
          <button className="logout-button" onClick={handleLogout} type="button">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="student-main">
        <header className="student-topbar">
          <div>
            <span className="dashboard-breadcrumb">Student workspace <span aria-hidden="true">/</span> {pageTitle}</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="student-top-user">
            <span aria-hidden="true" className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span>{user.name}</span>
            <button className="topbar-logout" onClick={handleLogout} type="button">Logout</button>
          </div>
        </header>

        <div className="student-content" id="student-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


export default StudentDashboard