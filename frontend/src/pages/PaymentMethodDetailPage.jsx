import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deletePaymentMethod, getPaymentMethod } from '../api/paymentMethods'
import { ErrorMessage } from '../components/ErrorMessage'
import { logAppError } from '../errors'
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
          logAppError('Error al cargar el método de pago', err)
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
      logAppError('Error al desactivar el método de pago', err)
      setError(err)
      setDeleting(false)
    }
  }

  return (
    <section className="method-new">
      <div className="method-new-card">
        <Link className="method-new-back" to="/">
          ← Volver al inicio
        </Link>

        <h1>Detalle del método</h1>
        <p className="lead">Consulta la información de este método de pago.</p>

        {loading ? <p className="status">Cargando detalle…</p> : null}

        {!loading && !method ? (
          <ErrorMessage error={error} />
        ) : null}

        {!loading && method ? (
          <div className="form">
            <div className="form-grid">
              <div className="method-detail-field">
                <span>Tipo</span>
                <p>{PAYMENT_TYPE_LABELS[method.type] || method.type}</p>
              </div>

              <div className="method-detail-field">
                <span>Alias</span>
                <p>{method.alias}</p>
              </div>

              <div className="method-detail-field">
                <span>Institución</span>
                <p>{method.institution}</p>
              </div>

              <div className="method-detail-field">
                <span>Moneda</span>
                <p>{method.currency}</p>
              </div>

              <div className="method-detail-field full">
                <span>Identificador</span>
                <MaskedPan lastFour={method.last_four} className="masked method-detail-value" />
              </div>

              <div className="method-detail-field full">
                <span>Estatus</span>
                <p>{STATUS_LABELS[method.status] || method.status}</p>
              </div>
            </div>

            <ErrorMessage error={error} />

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
      </div>
    </section>
  )
}
