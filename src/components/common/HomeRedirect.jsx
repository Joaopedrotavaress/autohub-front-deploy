import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { getDefaultRouteForUser } from '../../utils/accessControl'

export function HomeRedirect() {
  const { user } = useAppContext()
  return <Navigate to={getDefaultRouteForUser(user)} replace />
}

export default HomeRedirect