const STATUS_HINTS = {
  400: 'Revisa los datos e inténtalo de nuevo.',
  401: 'No se pudo iniciar sesión.',
  403: 'Tu sesión no es válida o expiró.',
  404: 'El recurso no existe o no te pertenece.',
  409: 'Este método de pago ya está registrado.',
}

export function ErrorMessage({ error }) {
  if (!error) {
    return null
  }

  const status = error.status
  const message =
    typeof error === 'string' ? error : error.message || 'Ocurrió un error.'

  return (
    <div className={`banner banner-error${status ? ` status-${status}` : ''}`} role="alert">
      <strong>{status ? `Error ${status}` : 'Error'}</strong>
      <span> {message}</span>
      {STATUS_HINTS[status] ? <span> {STATUS_HINTS[status]}</span> : null}
    </div>
  )
}

export function FieldError({ id, message }) {
  if (!message) {
    return null
  }

  return (
    <p id={id} className="field-error">
      {message}
    </p>
  )
}
