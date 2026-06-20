import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.isAdmin !== true) {
    return <Navigate to="/" replace />
  }

  return children
}
