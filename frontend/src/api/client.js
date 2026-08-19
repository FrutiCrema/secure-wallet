const CSRF_HEADER = 'X-CSRFToken'
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

let csrfToken = null

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken
  }

  const response = await fetch('/api/auth/csrf/', {
    credentials: 'include',
  })

  const data = await parseJson(response)

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    )
  }

  csrfToken = data.csrfToken
  return csrfToken
}

export function clearCsrfToken() {
  csrfToken = null
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = { Accept: 'application/json', ...options.headers }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (UNSAFE_METHODS.has(method)) {
    headers[CSRF_HEADER] = await ensureCsrfToken()
  }

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    if (response.status === 403 && UNSAFE_METHODS.has(method)) {
      clearCsrfToken()
    }

    throw new ApiError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    )
  }

  return data
}

export function getFieldErrors(error) {
  if (!error?.data || typeof error.data !== 'object') {
    return {}
  }

  const fields = {}

  for (const [key, value] of Object.entries(error.data)) {
    if (key === 'detail' || key === 'message') {
      continue
    }

    if (Array.isArray(value)) {
      fields[key] = value.map(String).join(' ')
    } else if (typeof value === 'string') {
      fields[key] = value
    }
  }

  return fields
}

export function getErrorMessage(data, status) {
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (Array.isArray(data.detail)) {
      return data.detail.map(String).join(' ')
    }

    const fieldMessages = Object.entries(data)
      .filter(([key]) => key !== 'detail' && key !== 'message')
      .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
      .map(String)

    if (fieldMessages.length > 0) {
      return fieldMessages.join(' ')
    }

    if (typeof data.message === 'string') {
      return data.message
    }
  }

  return statusMessage(status)
}

function statusMessage(status) {
  switch (status) {
    case 400:
      return 'Hay errores en el formulario.'
    case 401:
      return 'Credenciales inválidas.'
    case 403:
      return 'No tienes permiso para realizar esta acción.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 409:
      return 'Ya existe un registro con estos datos.'
    default:
      return 'Ocurrió un error. Inténtalo de nuevo.'
  }
}

async function parseJson(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { detail: text }
  }
}
