import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getFieldErrors } from '../api/client'
import { useAuth } from '../auth/context'
import { ErrorMessage, FieldError } from '../components/ErrorMessage'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
      await register(form)
      navigate('/login', {
        replace: true,
        state: { notice: 'Cuenta creada. Inicia sesión para continuar.' },
      })
    } catch (err) {
      setError(err)
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Crear cuenta</h1>
      <p className="lead">Regístrate para administrar tus métodos de pago.</p>

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
          Correo electrónico
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            required
          />
          <FieldError message={fieldErrors.email} />
        </label>

        <label>
          Contraseña
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            required
          />
          <FieldError message={fieldErrors.password} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>

      <p>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}
