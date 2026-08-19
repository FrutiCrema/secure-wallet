import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { deletePaymentMethod, listPaymentMethods } from '../api/paymentMethods'
import { useAuth } from '../auth/context'
import { ErrorMessage } from '../components/ErrorMessage'
import { MaskedPan } from '../components/MaskedPan'
import { PAYMENT_TYPE_LABELS, STATUS_LABELS, maskedIdentifier } from './paymentLabels'

export function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await listPaymentMethods(page)
        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
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
  }, [page])

  async function handleDelete(method) {
    const confirmed = window.confirm(
      `¿Desactivar el método "${method.alias}" (${maskedIdentifier(method.last_four)})?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(method.id)
    setError(null)

    try {
      await deletePaymentMethod(method.id)
      const response = await listPaymentMethods(page)
      setData(response)
      if (response.results.length === 0 && page > 1) {
        setPage((current) => current - 1)
      }
    } catch (err) {
      setError(err)
    } finally {
      setDeletingId(null)
    }
  }

  const methods = data?.results ?? []
  const methodCount = data?.count ?? 0

  return (
    <section>
      <header className="page-header">
        <h1>Hola, {user.username}</h1>
        <p>{user.email}</p>
      </header>

      <div className="summary-row">
        <span className="chip">
          {methodCount} {methodCount === 1 ? 'método activo' : 'métodos activos'}
        </span>
      </div>

      <div className="section-header">
        <h2>Métodos de pago</h2>
        <Link className="button" to="/metodos/nuevo">
          Agregar método
        </Link>
      </div>

      <ErrorMessage error={error} />

      {loading ? <p className="status">Cargando métodos de pago…</p> : null}

      {!loading && methods.length === 0 ? (
        <div className="card empty-card">
          <p className="empty">
            No tienes métodos de pago activos. Agrega una tarjeta, cuenta o CLABE
            para comenzar.
          </p>
          <Link className="button" to="/metodos/nuevo">
            Agregar método
          </Link>
        </div>
      ) : null}

      <ul className="method-list">
        {methods.map((method) => (
          <li key={method.id} className="card method-card">
            <div className="method-card-main">
              <span className="type-badge">
                {PAYMENT_TYPE_LABELS[method.type] || method.type}
              </span>
              <div>
                <strong>{method.alias}</strong>
                <p className="method-meta">{method.institution}</p>
                <MaskedPan lastFour={method.last_four} />
              </div>
            </div>
            <div className="method-side">
              <div>{method.currency}</div>
              <div>{STATUS_LABELS[method.status] || method.status}</div>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate(`/metodos/${method.id}`)}
                >
                  Ver
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={deletingId === method.id}
                  onClick={() => handleDelete(method)}
                >
                  {deletingId === method.id ? 'Eliminando…' : 'Desactivar'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {data && data.count > methods.length ? (
        <div className="pagination">
          <button
            type="button"
            className="ghost"
            disabled={!data.previous || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            type="button"
            className="ghost"
            disabled={!data.next || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  )
}
