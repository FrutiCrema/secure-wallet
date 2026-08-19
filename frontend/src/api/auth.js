import { apiRequest, clearCsrfToken, ensureCsrfToken } from './client'

export function fetchCsrfToken() {
  return ensureCsrfToken()
}

export function registerUser(payload) {
  return apiRequest('/api/auth/register/', {
    method: 'POST',
    body: payload,
  })
}

export function loginUser(payload) {
  return apiRequest('/api/auth/login/', {
    method: 'POST',
    body: payload,
  })
}

export function fetchCurrentUser() {
  return apiRequest('/api/auth/me/')
}

export async function logoutUser() {
  const data = await apiRequest('/api/auth/logout/', {
    method: 'POST',
  })
  clearCsrfToken()
  return data
}
