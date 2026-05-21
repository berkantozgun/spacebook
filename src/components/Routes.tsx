import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { profile, selectedCompany, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (!selectedCompany) {
    return <Navigate to="/select-company" replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: ProtectedRouteProps) {
  const { profile, selectedCompany, loading, isAdmin, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (!selectedCompany) {
    return <Navigate to="/select-company" replace />
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function SuperAdminRoute({ children }: ProtectedRouteProps) {
  const { profile, loading, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    )
  }

  if (!profile || !isSuperAdmin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function DisplayRoute({ children }: ProtectedRouteProps) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    )
  }

  return <>{children}</>
}
