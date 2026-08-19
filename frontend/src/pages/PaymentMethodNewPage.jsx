import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getFieldErrors } from '../api/client'
import { createPaymentMethod } from '../api/paymentMethods'
import { ErrorMessage, FieldError } from '../components/ErrorMessage'

const EMPTY_FORM = {
  type: 'CARD',
  alias: '',
  institution: '',
  currency: 'MXN',
  identifier: '',
}

export function PaymentMethodNewPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
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

    const payload = { ...form }

    try {
      const created = await createPaymentMethod(payload)
      setForm(EMPTY_FORM)
      navigate(`/metodos/${created.id}`, { replace: true })
    } catch (err) {
      setError(err)
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
      setForm((current) => ({ ...current, identifier: '' }))
    }
  }

  return (
    <section>
      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
      <h1>Agregar método de pago</h1>
      <p className="lead">
        El identificador completo no se guarda ni se vuelve a mostrar. Solo
        verás los últimos 4 caracteres.
      </p>

      <ErrorMessage error={error} />

      <form className="card form" onSubmit={handleSubmit} autoComplete="off">
        <label>
          Tipo
          <select name="type" value={form.type} onChange={updateField} required>
            <option value="CARD">Tarjeta</option>
            <option value="BANK_ACCOUNT">Cuenta bancaria</option>
            <option value="CLABE">CLABE</option>
            <option value="OTHER">Otro</option>
          </select>
          <FieldError message={fieldErrors.type} />
        </label>

        <label>
          Alias
          <input
            name="alias"
            value={form.alias}
            onChange={updateField}
            required
          />
          <FieldError message={fieldErrors.alias} />
        </label>

        <label>
          Institución
          <input
            name="institution"
            value={form.institution}
            onChange={updateField}
            required
          />
          <FieldError message={fieldErrors.institution} />
        </label>

        <label>
          Moneda
          <input
            name="currency"
            value={form.currency}
            onChange={updateField}
            maxLength={3}
            required
          />
          <FieldError message={fieldErrors.currency} />
        </label>

        <label>
          Identificador
          <input
            name="identifier"
            type="password"
            value={form.identifier}
            onChange={updateField}
            autoComplete="off"
            required
          />
          <FieldError message={fieldErrors.identifier} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar método'}
        </button>
      </form>
    </section>
  )
}
