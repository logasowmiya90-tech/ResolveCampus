import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './OfficerPages.css'


function OfficerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const title = location.pathname.startsWith('/officer/grievances/') ? 'Case Review' : 'Assigned Cases'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="officer-app-shell">
      <aside aria-label="Officer workspace" className="officer-sidebar">
        <NavLink aria-label="ResolveCampus home" className="brand officer-brand" to="/">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
            </svg>
          </span>
          <span>ResolveCampus</span>
        </NavLink>
        <p className="officer-sidebar-label">OFFICER WORKSPACE</p>
        <nav aria-label="Officer navigation" className="officer-nav">
          <NavLink className={({ isActive }) => `officer-nav-link${isActive ? ' is-active' : ''}`} end to="/officer">
            <LineIcon name="activity" />Assigned Cases
          </NavLink>
        </nav>
        <div className="officer-sidebar-bottom">
          <div className="officer-user">
            <span aria-hidden="true" className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span><strong>{user.name}</strong><small>Officer</small></span>
          </div>
          <button className="logout-button" onClick={handleLogout} type="button">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="officer-main">
        <header className="officer-topbar">
          <div>
            <span className="officer-breadcrumb">Officer workspace <span aria-hidden="true">/</span> {title}</span>
            <h1>{title}</h1>
          </div>
          <div className="officer-top-user">
            <span aria-hidden="true" className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span>{user.name}</span>
            <button className="officer-top-logout" onClick={handleLogout} type="button">Logout</button>
          </div>
        </header>
        <div className="officer-content"><Outlet /></div>
      </main>
    </div>
  )
}


export default OfficerLayout