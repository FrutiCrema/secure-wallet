import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getFieldErrors } from '../api/client'
import { useAuth } from '../auth/context'
import { AuthShell } from '../components/AuthShell'
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
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate para administrar tus métodos de pago."
    >
      <ErrorMessage error={error} />

      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="register-username">
          Usuario
          <input
            id="register-username"
            name="username"
            value={form.username}
            onChange={updateField}
            autoComplete="username"
            placeholder="Elige un usuario"
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
            required
          />
          <FieldError id="register-username-error" message={fieldErrors.username} />
        </label>

        <label htmlFor="register-email">
          Correo electrónico
          <input
            id="register-email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            required
          />
          <FieldError id="register-email-error" message={fieldErrors.email} />
        </label>

        <label htmlFor="register-password">
          Contraseña
          <input
            id="register-password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
            required
          />
          <FieldError id="register-password-error" message={fieldErrors.password} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthShell>
  )
}
