import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

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

  return (
    <div className="container section">
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Panel admin</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Sesión: {user.email}
        </p>
      </header>

      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>Aportaciones</h2>
        <p style={{ color: 'var(--text-muted)' }}>(Lane E — lista, marcar pagado, manuales)</p>
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>Mensajes</h2>
        <p style={{ color: 'var(--text-muted)' }}>(Lane E — moderar / ocultar)</p>
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>Fotos</h2>
        <p style={{ color: 'var(--text-muted)' }}>(Lane E — aprobar / rechazar)</p>
      </div>
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>Partidas del viaje</h2>
        <p style={{ color: 'var(--text-muted)' }}>(Lane E — CRUD)</p>
      </div>
      <div className="card">
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>Exportar</h2>
        <p style={{ color: 'var(--text-muted)' }}>(Lane E — PDF mensajes, ZIP fotos)</p>
      </div>
    </div>
  );
}
