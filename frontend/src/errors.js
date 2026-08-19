export function getFormAlertMessage(error, fieldErrors = {}) {
  const fromFields = Object.values(fieldErrors || {}).filter(Boolean)

  if (fromFields.length > 0) {
    return fromFields.join(' ')
  }

  if (!error) {
    return ''
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message || 'Ocurrió un error. Inténtalo de nuevo.'
}

export function logAppError(context, error) {
  console.error(context, {
    status: error?.status,
    data: error?.data,
    message: typeof error === 'string' ? error : error?.message,
  })
}
