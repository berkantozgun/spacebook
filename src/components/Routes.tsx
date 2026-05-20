// =============================================
// SPACEBOOK — Route Guard Bileşenleri
// =============================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <div style={{
    minHeight:  '100vh',
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: dark
      ? 'linear-gradient(160deg, #1a0a0f 0%, #2d0f1a 100%)'
      : '#fafafa',
    fontFamily: "'Montserrat', sans-serif",
    color:      dark ? 'rgba(255,255,255,0.4)' : '#9D9D9D',
    fontSize:   '0.875rem',
  }}>
    Yukleniyor...
  </div>
)

// Giriş yapmış herhangi bir kullanıcı — firma seçimi yapılmış olmalı
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, selectedCompany, companies, loading } = useAuth()
  if (loading) return <Spinner />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.is_superadmin) return <>{children}</>
  if (companies.length === 0) return <Navigate to="/unauthorized" replace />
  if (!selectedCompany && companies.length > 1) return <Navigate to="/select-company" replace />
  return <>{children}</>
}

// Admin rolü gerekli (seçili firmada)
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, selectedCompany, isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  if (!profile) return <Navigate to="/login" replace />
  if (profile.is_superadmin) return <>{children}</>
  if (!selectedCompany) return <Navigate to="/select-company" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

// Superadmin rolü gerekli
export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!profile) return <Navigate to="/login" replace />
  if (!profile.is_superadmin) return <Navigate to="/" replace />
  return <>{children}</>
}

// Display route: room_id URL param ile çalışır
// Erişim kontrolü DisplayPage içinde yapılır
export function DisplayRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <Spinner dark />
  if (!profile) return <Navigate to="/login" replace />
  return <>{children}</>
}
