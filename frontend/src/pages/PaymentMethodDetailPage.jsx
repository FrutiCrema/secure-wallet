import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deletePaymentMethod, getPaymentMethod } from '../api/paymentMethods'
import { ErrorMessage } from '../components/ErrorMessage'
import { MaskedPan } from '../components/MaskedPan'
import {
  PAYMENT_TYPE_LABELS,
  STATUS_LABELS,
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
          <div className="detail-hero">
            <div>
              <span className="type-badge">
                {PAYMENT_TYPE_LABELS[method.type] || method.type}
              </span>
              <h2>{method.alias}</h2>
              <MaskedPan lastFour={method.last_four} />
            </div>
          </div>

          <div className="detail-list">
            <div className="detail-row">
              <span>Institución</span>
              <strong>{method.institution}</strong>
            </div>
            <div className="detail-row">
              <span>Moneda</span>
              <strong>{method.currency}</strong>
            </div>
            <div className="detail-row">
              <span>Estatus</span>
              <strong>{STATUS_LABELS[method.status] || method.status}</strong>
            </div>
          </div>

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
