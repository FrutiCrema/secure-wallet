import { apiRequest, refreshCsrfToken } from './client'

export function fetchCsrfToken() {
  return refreshCsrfToken()
}

export function registerUser(payload) {
  return apiRequest('/api/auth/register/', {
    method: 'POST',
    body: payload,
  })
}

export async function loginUser(payload) {
  const data = await apiRequest('/api/auth/login/', {
    method: 'POST',
    body: payload,
  })

  await refreshCsrfToken()
  return data
}

export function fetchCurrentUser() {
  return apiRequest('/api/auth/me/')
}

export async function logoutUser() {
  const data = await apiRequest('/api/auth/logout/', {
    method: 'POST',
  })

  await refreshCsrfToken()
  return data
}
