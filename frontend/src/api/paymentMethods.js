import { apiRequest } from './client'

export function listPaymentMethods(page = 1) {
  return apiRequest(`/api/payment-methods/?page=${page}`)
}

export function createPaymentMethod(payload) {
  return apiRequest('/api/payment-methods/', {
    method: 'POST',
    body: payload,
  })
}

export function getPaymentMethod(id) {
  return apiRequest(`/api/payment-methods/${id}/`)
}

export function deletePaymentMethod(id) {
  return apiRequest(`/api/payment-methods/${id}/`, {
    method: 'DELETE',
  })
}
