import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deletePaymentMethod, getPaymentMethod } from '../api/paymentMethods'
import { ErrorMessage } from '../components/ErrorMessage'
import {
  PAYMENT_TYPE_LABELS,
  STATUS_LABELS,
  maskedIdentifier,
} from './paymentLabels'

export function PaymentMethodDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [method, setMethod] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await getPaymentMethod(id)
        if (!cancelled) {
          setMethod(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setMethod(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Desactivar el método "${method.alias}"? Dejará de aparecer en tu listado.`,
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await deletePaymentMethod(method.id)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err)
      setDeleting(false)
    }
  }

  return (
    <section>
      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
      <h1>Detalle del método</h1>

      <ErrorMessage error={error} />

      {loading ? <p className="status">Cargando detalle…</p> : null}

      {!loading && method ? (
        <div className="card">
          <p>
            <strong>Alias:</strong> {method.alias}
          </p>
          <p>
            <strong>Tipo:</strong>{' '}
            {PAYMENT_TYPE_LABELS[method.type] || method.type}
          </p>
          <p>
            <strong>Institución:</strong> {method.institution}
          </p>
          <p>
            <strong>Moneda:</strong> {method.currency}
          </p>
          <p>
            <strong>Identificador:</strong>{' '}
            <span className="masked">{maskedIdentifier(method.last_four)}</span>
          </p>
          <p>
            <strong>Estatus:</strong>{' '}
            {STATUS_LABELS[method.status] || method.status}
          </p>
          <div className="actions">
            <button
              type="button"
              className="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Desactivando…' : 'Desactivar método'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
