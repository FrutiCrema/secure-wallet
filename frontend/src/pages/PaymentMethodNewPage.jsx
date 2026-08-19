import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getFieldErrors } from '../api/client'
import { createPaymentMethod } from '../api/paymentMethods'
import { ErrorMessage } from '../components/ErrorMessage'
import { logAppError } from '../errors'

const BANKS = [
  'BBVA',
  'Santander',
  'Banorte',
  'HSBC',
  'Citibanamex',
  'Scotiabank',
  'Nu',
  'Otro',
]

const CURRENCIES = ['MXN', 'USD', 'EUR']

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

    setForm((current) => {
      if (name === 'type') {
        return {
          ...current,
          type: value,
          identifier: '',
        }
      }

      if (name === 'identifier' && current.type === 'CARD') {
        return { ...current, identifier: formatCardNumber(value) }
      }

      return { ...current, [name]: value }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    const payload = {
      type: form.type,
      alias: form.alias,
      institution: form.institution,
      currency: form.currency,
      identifier: form.identifier.replace(/\s/g, ''),
    }

    try {
      const created = await createPaymentMethod(payload)
      setForm(EMPTY_FORM)
      navigate(`/metodos/${created.id}`, { replace: true })
    } catch (err) {
      logAppError('Error al guardar método de pago', err)
      setError(err)
      setFieldErrors(getFieldErrors(err))
    } finally {
      setSubmitting(false)
      setForm((current) => ({ ...current, identifier: '' }))
    }
  }

  return (
    <section className="method-new">
      <div className="method-new-card">
        <Link className="method-new-back" to="/">
          ← Volver al inicio
        </Link>

        <h1>Agregar método de pago</h1>
        <p className="lead">Completa los datos para registrar un método de forma segura.</p>

        <form className="form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-grid">
            <label htmlFor="method-type">
              Tipo de tarjeta
              <select
                id="method-type"
                name="type"
                value={form.type}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.type)}
                aria-describedby={fieldErrors.type ? 'method-form-alert' : undefined}
                required
              >
                <option value="CARD">Tarjeta</option>
                <option value="BANK_ACCOUNT">Cuenta bancaria</option>
                <option value="CLABE">CLABE</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>

            <label htmlFor="method-alias">
              Alias
              <input
                id="method-alias"
                name="alias"
                value={form.alias}
                onChange={updateField}
                placeholder="Ej. Tarjeta principal"
                aria-invalid={Boolean(fieldErrors.alias)}
                aria-describedby={fieldErrors.alias ? 'method-form-alert' : undefined}
                required
              />
            </label>

            <label htmlFor="method-institution">
              Banco
              <select
                id="method-institution"
                name="institution"
                value={form.institution}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.institution)}
                aria-describedby={
                  fieldErrors.institution ? 'method-form-alert' : undefined
                }
                required
              >
                <option value="" disabled>
                  Selecciona un banco
                </option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="method-currency">
              Moneda
              <select
                id="method-currency"
                name="currency"
                value={form.currency}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.currency)}
                aria-describedby={
                  fieldErrors.currency ? 'method-form-alert' : undefined
                }
                required
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label className="full" htmlFor="method-identifier">
              {identifierLabel(form.type)}
              <input
                id="method-identifier"
                name="identifier"
                type="text"
                inputMode={form.type === 'OTHER' ? 'text' : 'numeric'}
                value={form.identifier}
                onChange={updateField}
                placeholder={identifierPlaceholder(form.type)}
                autoComplete="off"
                spellCheck="false"
                aria-invalid={Boolean(fieldErrors.identifier)}
                aria-describedby={
                  fieldErrors.identifier
                    ? 'method-form-alert method-identifier-hint'
                    : 'method-identifier-hint'
                }
                required
              />
              <span id="method-identifier-hint" className="method-new-hint">
                El número completo no se almacena. Solo se guardan los últimos 4
                caracteres.
              </span>
            </label>
          </div>

          <ErrorMessage
            id="method-form-alert"
            error={error}
            fieldErrors={fieldErrors}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar método'}
          </button>
        </form>
      </div>
    </section>
  )
}

function identifierLabel(type) {
  if (type === 'CLABE') {
    return 'CLABE'
  }

  if (type === 'BANK_ACCOUNT') {
    return 'Número de cuenta'
  }

  if (type === 'OTHER') {
    return 'Identificador'
  }

  return 'Número de tarjeta'
}

function identifierPlaceholder(type) {
  if (type === 'CLABE') {
    return '18 dígitos'
  }

  if (type === 'BANK_ACCOUNT') {
    return 'Número de cuenta'
  }

  if (type === 'OTHER') {
    return 'Identificador'
  }

  return '•••• •••• •••• ••••'
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}
