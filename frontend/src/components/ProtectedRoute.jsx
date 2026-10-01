import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardPathForRole } from '../services/auth.js'


function ProtectedRoute({ allowedRole, children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== allowedRole) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />
  }

  return children
}


export default ProtectedRoute