import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import { AuthProvider } from './contexts/AuthContext'
import {
  ProtectedRoute,
  AdminRoute,
  SuperAdminRoute,
  DisplayRoute,
} from './components/Routes'

import {
  CallbackPage,
  CompanySelectPage,
  UnauthorizedPage,
} from './pages/AuthPages'

import LoginPage      from './pages/LoginPage'
import BookingPage    from './pages/BookingPage'
import DisplayPage    from './pages/DisplayPage'
import AdminPage      from './pages/AdminPage'
import SuperAdminPage from './pages/SuperAdminPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/auth/callback"  element={<CallbackPage />} />
          <Route path="/unauthorized"   element={<UnauthorizedPage />} />

          {/* Firma secimi */}
          <Route path="/select-company" element={<CompanySelectPage />} />

          {/* Display — her oda kendi URL'inde */}
          <Route path="/display/:roomId" element={
            <DisplayRoute>
              <DisplayPage />
            </DisplayRoute>
          } />

          {/* Rezervasyon — giris gerekli */}
          <Route path="/" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />

          {/* Admin — firma admin'i gerekli */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />

          {/* Superadmin — platform operatoru */}
          <Route path="/superadmin" element={
            <SuperAdminRoute>
              <SuperAdminPage />
            </SuperAdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
