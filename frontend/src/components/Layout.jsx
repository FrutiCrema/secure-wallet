import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../auth/context'
import { ErrorMessage } from './ErrorMessage'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const initial = user.username.slice(0, 1).toUpperCase()

  async function handleLogout() {
    setError('')
    setLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
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
      </header>

      <main className="content">
        <ErrorMessage error={error} />
        <Outlet />
      </main>
    </div>
  )
}
