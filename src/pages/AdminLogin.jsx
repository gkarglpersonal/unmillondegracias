import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function AdminLogin() {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError('Credenciales incorrectas.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-narrow section" style={{ paddingTop: 'var(--space-9)' }}>
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--fs-h2)', marginBottom: 'var(--space-2)' }}>Panel admin</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
          Acceso restringido.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 'var(--space-4)' }}>
            <span style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--fw-medium)' }}>
              Correo
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label style={{ display: 'block', marginBottom: 'var(--space-5)' }}>
            <span style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--fw-medium)' }}>
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)', fontSize: 'var(--fs-body-sm)' }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
