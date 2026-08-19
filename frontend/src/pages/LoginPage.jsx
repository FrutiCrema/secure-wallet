import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { getFieldErrors } from '../api/client'
import { useAuth } from '../auth/context'
import { ErrorMessage, FieldError } from '../components/ErrorMessage'

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
      setError(err)
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Iniciar sesión</h1>
      <p className="lead">Entra para ver y administrar tu wallet.</p>

      {notice ? <div className="banner banner-success">{notice}</div> : null}
      <ErrorMessage error={error} />

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Usuario
          <input
            name="username"
            value={form.username}
            onChange={updateField}
            autoComplete="username"
            required
          />
          <FieldError message={fieldErrors.username} />
        </label>

        <label>
          Contraseña
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="current-password"
            required
          />
          <FieldError message={fieldErrors.password} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  )
}
