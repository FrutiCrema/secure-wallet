import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../auth/context'
import { ErrorMessage } from './ErrorMessage'
import { logAppError } from '../errors'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const initial = user.username.slice(0, 1).toUpperCase()

  async function handleLogout() {
    setError(null)
    setLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      logAppError('Error al cerrar sesión', err)
      setError(err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-main">
          <NavLink to="/" className="brand">
            Secure Wallet
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/metodos/nuevo">Agregar método</NavLink>
            <span className="nav-user">
              <span className="avatar" aria-hidden="true">
                {initial}
              </span>
              {user.username}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
            </button>
          </nav>
        </div>
        <ErrorMessage error={error} />
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
