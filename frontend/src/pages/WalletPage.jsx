import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { deletePaymentMethod, listPaymentMethods } from '../api/paymentMethods'
import { useAuth } from '../auth/context'
import { ErrorMessage } from '../components/ErrorMessage'
import { logAppError } from '../errors'
import { PAYMENT_TYPE_LABELS, maskedIdentifier } from './paymentLabels'

const CARDS_PER_SLIDE = 3
const SLIDE_MS = 5200

export function WalletPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [slide, setSlide] = useState(0)

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
          logAppError('Error al cargar métodos de pago', err)
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
      logAppError('Error al desactivar método de pago', err)
      setError(err)
    } finally {
      setDeletingId(null)
    }
  }

  const methods = data?.results ?? []
  const methodCount = data?.count ?? 0
  const slides = chunkMethods(methods, CARDS_PER_SLIDE)
  const shouldCycle = methods.length > CARDS_PER_SLIDE

  useEffect(() => {
    setSlide(0)
  }, [page, methods.length])

  useEffect(() => {
    if (!shouldCycle) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % slides.length)
    }, SLIDE_MS)

    return () => window.clearInterval(timer)
  }, [shouldCycle, slides.length])

  return (
    <section className="wallet">
      <div className="wallet-stage">
        <div className="wallet-stage-top">
          <div className="wallet-intro">
            <h1>Hola, {user.username}</h1>
            <p className="wallet-email">{user.email}</p>
            <p className="lead">
              Administra tus métodos de pago de forma segura.
            </p>

            <div className="wallet-summary">
              <p className="wallet-summary-label">Tu wallet</p>
              <p className="wallet-summary-count">{methodCount}</p>
              <p className="wallet-summary-caption">
                {methodCount === 1 ? 'método activo' : 'métodos activos'}
              </p>
            </div>

            <Link className="button button-light" to="/metodos/nuevo">
              + Agregar método
            </Link>
          </div>

          <WalletVisual />
        </div>

        <div className="wallet-methods">
          <ErrorMessage error={error} />

          {loading ? <p className="status">Cargando métodos de pago…</p> : null}

          {!loading && methods.length === 0 ? (
            <div className="wallet-ready">
              <h2>Tu wallet está lista</h2>
              <p>Agrega tu primer método de pago para comenzar.</p>
              <Link className="button button-light" to="/metodos/nuevo">
                + Agregar método
              </Link>
            </div>
          ) : null}

          {methods.length > 0 ? (
            <>
              <div className="wallet-section-head">
                <h2>Métodos activos</h2>
              </div>

              <div
                className={
                  shouldCycle ? 'wallet-carousel wallet-carousel-cycle' : 'wallet-carousel'
                }
              >
                {slides.map((group, groupIndex) => (
                  <ul
                    key={group.map((method) => method.id).join('-')}
                    className={
                      shouldCycle && groupIndex === slide
                        ? 'wallet-method-list is-active'
                        : 'wallet-method-list'
                    }
                    data-count={group.length}
                    aria-hidden={shouldCycle && groupIndex !== slide}
                    inert={shouldCycle && groupIndex !== slide ? true : undefined}
                  >
                    {group.map((method) => (
                      <MethodCard
                        key={method.id}
                        method={method}
                        deletingId={deletingId}
                        onOpen={() => navigate(`/metodos/${method.id}`)}
                        onDelete={() => handleDelete(method)}
                      />
                    ))}
                  </ul>
                ))}
              </div>
            </>
          ) : null}

        </div>
      </div>
    </section>
  )
}

function MethodCard({ method, deletingId, onOpen, onDelete }) {
  return (
    <li className="card wallet-method">
      <div className="wallet-method-top">
        <span className="type-badge">
          {PAYMENT_TYPE_LABELS[method.type] || method.type}
        </span>
        <span
          className={
            method.status === 'ACTIVE'
              ? 'status-chip status-chip-active'
              : 'status-chip status-chip-inactive'
          }
        >
          {method.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <h3>{method.alias}</h3>
      <p className="method-meta">{method.institution}</p>

      <div className="wallet-method-pan">
        <span className="masked">
          •••• •••• •••• {method.last_four || '••••'}
        </span>
        <span>{method.currency}</span>
      </div>

      <div className="wallet-method-actions">
        <button type="button" className="text-action" onClick={onOpen}>
          Ver detalles
        </button>
        <button
          type="button"
          className="text-danger"
          disabled={deletingId === method.id}
          onClick={onDelete}
        >
          {deletingId === method.id ? 'Eliminando…' : 'Desactivar'}
        </button>
      </div>
    </li>
  )
}

function chunkMethods(methods, size) {
  const groups = []

  for (let index = 0; index < methods.length; index += size) {
    groups.push(methods.slice(index, index + size))
  }

  return groups
}

function WalletVisual() {
  return (
    <aside className="wallet-visual" aria-hidden="true">
      <span className="wallet-dot wallet-dot-one" />
      <span className="wallet-dot wallet-dot-two" />
      <span className="wallet-dot wallet-dot-three" />

      <article className="wallet-plastic">
        <div className="wallet-plastic-top">
          <span>Secure Wallet</span>
          <span className="auth-chip" />
        </div>
        <p className="wallet-plastic-pan">•••• •••• •••• 4821</p>
        <div className="wallet-plastic-bottom">
          <span>Card holder</span>
        </div>
      </article>
    </aside>
  )
}
