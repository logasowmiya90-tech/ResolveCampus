import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminPages.css'


function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const title = location.pathname.startsWith('/admin/grievances/') ? 'Case Review' : 'Institutional Overview'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-app-shell">
      <aside aria-label="Admin workspace" className="admin-sidebar">
        <NavLink aria-label="ResolveCampus home" className="brand admin-brand" to="/">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
            </svg>
          </span>
          <span>ResolveCampus</span>
        </NavLink>
        <p className="admin-sidebar-label">ADMIN WORKSPACE</p>
        <nav aria-label="Admin navigation" className="admin-nav">
          <NavLink className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`} end to="/admin">
            <LineIcon name="chart" />Institutional overview
          </NavLink>
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <span aria-hidden="true" className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span><strong>{user.name}</strong><small>Administrator</small></span>
          </div>
          <button className="logout-button" onClick={handleLogout} type="button">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">Admin workspace <span aria-hidden="true">/</span> {title}</span>
            <h1>{title}</h1>
          </div>
          <div className="admin-top-user">
            <span aria-hidden="true" className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
            <span>{user.name}</span>
            <button className="admin-top-logout" onClick={handleLogout} type="button">Logout</button>
          </div>
        </header>
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  )
}


export default AdminLayout