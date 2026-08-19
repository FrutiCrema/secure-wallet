import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="status">Cargando sesión…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="status">Cargando sesión…</p>
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
