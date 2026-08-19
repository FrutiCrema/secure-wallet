import { useEffect, useMemo, useState } from 'react'

import {
  fetchCurrentUser,
  fetchCsrfToken,
  loginUser,
  logoutUser,
  registerUser,
} from '../api/auth'
import { ApiError } from '../api/client'
import { AuthContext } from './context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        await fetchCsrfToken()
        const data = await fetchCurrentUser()
        if (!cancelled) {
          setUser(data.user)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setUser(null)
        } else {
          setBootError(error.message || 'No se pudo iniciar la aplicación.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      bootError,
      async register(payload) {
        const data = await registerUser(payload)
        return data
      },
      async login(payload) {
        const data = await loginUser(payload)
        setUser(data.user)
        return data
      },
      async logout() {
        await logoutUser()
        setUser(null)
      },
    }),
    [user, loading, bootError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
