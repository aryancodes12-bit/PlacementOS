import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuthStore()
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}