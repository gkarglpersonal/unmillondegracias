import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';

export default function Admin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        Cargando…
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return <AdminLayout />;
}
