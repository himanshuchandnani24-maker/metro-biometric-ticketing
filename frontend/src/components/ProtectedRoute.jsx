import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (requireAdmin) {
      return <Navigate to="/?admin=1" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
