import { apiRequest } from './client'

export function listPaymentMethods(page = 1) {
  return apiRequest(`/api/payment-methods/?page=${page}`)
}

export async function listAllPaymentMethods() {
  const results = []
  let page = 1
  let count = 0

  while (true) {
    const response = await listPaymentMethods(page)
    count = response.count ?? 0
    results.push(...(response.results ?? []))

    if (!response.next) {
      break
    }

    page += 1
  }

  return { results, count }
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
