import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './auth/context'
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute'
import { ErrorMessage } from './components/ErrorMessage'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { PaymentMethodDetailPage } from './pages/PaymentMethodDetailPage'
import { PaymentMethodNewPage } from './pages/PaymentMethodNewPage'
import { RegisterPage } from './pages/RegisterPage'
import { WalletPage } from './pages/WalletPage'

export default function App() {
  const { bootError } = useAuth()

  return (
    <>
      {bootError ? (
        <div className="boot-alert">
          <ErrorMessage error={bootError} />
        </div>
      ) : null}

      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<WalletPage />} />
            <Route path="/metodos/nuevo" element={<PaymentMethodNewPage />} />
            <Route path="/metodos/:id" element={<PaymentMethodDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
