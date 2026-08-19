import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { getFieldErrors } from '../api/client'
import { useAuth } from '../auth/context'
import { AuthShell } from '../components/AuthShell'
import { ErrorMessage } from '../components/ErrorMessage'
import { logAppError } from '../errors'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    username: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const notice = location.state?.notice
  const from = location.state?.from?.pathname || '/'

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      logAppError('Error al iniciar sesión', err)
      setError(err)
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="Entra para ver y administrar tu wallet.">
      {notice ? <div className="banner banner-success">{notice}</div> : null}

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="login-username">
          Usuario
          <input
            id="login-username"
            name="username"
            value={form.username}
            onChange={updateField}
            autoComplete="username"
            placeholder="Tu usuario"
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'login-form-alert' : undefined}
            required
          />
        </label>

        <label htmlFor="login-password">
          Contraseña
          <input
            id="login-password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'login-form-alert' : undefined}
            required
          />
        </label>

        <ErrorMessage id="login-form-alert" error={error} fieldErrors={fieldErrors} />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="auth-footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </AuthShell>
  )
}
