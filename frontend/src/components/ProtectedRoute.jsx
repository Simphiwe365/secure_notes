/**
 * components/ProtectedRoute.jsx
 * CONTROL: Client-side route guards mirroring server-side RBAC
 * (Server always re-validates — these guards improve UX only)
 */
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export function AdminRoute({ children }) {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin)         return <Navigate to="/dashboard" replace />
  return children
}

export function EditorRoute({ children }) {
  const isEditor = useAuthStore((s) => s.isEditor())
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isEditor)        return <Navigate to="/dashboard" replace />
  return children
}
