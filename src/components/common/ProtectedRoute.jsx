import { Navigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { getAllowedRolesForPath, getDefaultRouteForUser, getUserRole, hasRoleAccess, ROLES } from '../../utils/accessControl'

export function ProtectedRoute({ children, allowedRoles, guestOnly = false, fallbackPath }) {
  const { user, authLoading } = useAppContext()
  const location = useLocation()
  const currentRole = getUserRole(user)
  const routeAllowedRoles = allowedRoles || getAllowedRolesForPath(location.pathname)

  if (authLoading) {
    return null
  }

  if (guestOnly) {
    if (currentRole !== ROLES.VISITANTE) {
      return <Navigate to={getDefaultRouteForUser(user)} replace />
    }

    return children
  }

  if (!user) {
    if (routeAllowedRoles?.includes(ROLES.VISITANTE)) {
      return children
    }

    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (routeAllowedRoles && !hasRoleAccess(user, routeAllowedRoles)) {
    const destination = fallbackPath || getDefaultRouteForUser(user)
    return <Navigate to={destination} replace />
  }

  return children
}

export default ProtectedRoute