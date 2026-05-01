import { useEffect, useMemo, useState } from 'react';
import {
  subscribePendingPhotos,
  subscribeApprovedPhotos,
  approvePhoto,
  unapprovePhoto,
  rejectPhoto,
} from '../../firebase/messageWall.js';
import { getAdminPhotoUrl } from '../../firebase/storage.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './PhotosModeration.module.css';

const FILTERS = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobadas' },
];

/**
 * Cuando una foto está pendiente, vive en `photos/pending/...` y solo el
 * admin puede leerla. Como no hay URL pública, el componente pide una
 * URL temporal con token vía `getDownloadURL` (que respeta las reglas de
 * Storage). Las fotos aprobadas usan directamente `photoUrl` del doc.
 */
function PendingPhotoImg({ storagePath, alt }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setError(false);
    if (!storagePath) return undefined;
    getAdminPhotoUrl(storagePath).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (error) {
    return <div className={styles.imgFallback}>Sin previsualización</div>;
  }
  if (!url) {
    return <div className={styles.imgFallback}>Cargando…</div>;
  }
  return <img src={url} alt={alt} className={styles.img} />;
}

export default function PhotosModeration() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const unsubP = subscribePendingPhotos((d) => {
      setPending(d);
      setLoading(false);
    });
    const unsubA = subscribeApprovedPhotos(setApproved);
    const t = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(t);
      try { unsubP(); } catch { /* noop */ }
      try { unsubA(); } catch { /* noop */ }
    };
  }, []);

  const items = useMemo(
    () => (filter === 'pending' ? pending : approved),
    [filter, pending, approved]
  );

  const handleApprove = async (id) => {
    setBusyId(id);
    setActionError(null);
    try {
      await approvePhoto(id);
    } catch (err) {
      console.error('approvePhoto:', err);
      setActionError('No se pudo aprobar la foto. Vuelve a intentarlo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnapprove = async (id) => {
    if (!confirm('¿Quitar la aprobación? La foto desaparecerá de la galería.')) return;
    setBusyId(id);
    setActionError(null);
    try {
      await unapprovePhoto(id);
    } catch (err) {
      console.error('unapprovePhoto:', err);
      setActionError('No se pudo quitar la aprobación. Vuelve a intentarlo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item) => {
    if (!confirm('¿Borrar esta foto del todo? El mensaje (si lo hay) también se elimina.')) return;
    setBusyId(item.id);
    setActionError(null);
    try {
      await rejectPhoto(item.id);
    } catch (err) {
      console.error('rejectPhoto:', err);
      setActionError('No se pudo rechazar la foto. Vuelve a intentarlo.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Fotos</h2>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className={styles.count}>
                {f.id === 'pending' ? pending.length : approved.length}
              </span>
            </button>
          ))}
        </div>
      </header>

      {actionError && <p className={styles.actionError}>{actionError}</p>}

      {loading ? (
        <p className={styles.empty}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {filter === 'pending' ? 'No hay fotos pendientes de aprobar.' : 'Aún no hay fotos aprobadas.'}
        </p>
      ) : (
        <ul className={styles.grid}>
          {items.map((p) => (
            <li key={p.id} className={styles.card}>
              <div className={styles.imgWrap}>
                {filter === 'pending' ? (
                  <PendingPhotoImg
                    storagePath={p.photoStoragePath}
                    alt={`Foto de ${p.name}`}
                  />
                ) : (
                  <img src={p.photoUrl} alt={`Foto de ${p.name}`} className={styles.img} />
                )}
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.name}>{p.name}</span>
                  {p.createdAt && <span className={styles.time}>{relativeTime(p.createdAt)}</span>}
                </div>
                <div className={styles.actions}>
                  {filter === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="btn"
                        disabled={busyId === p.id}
                        onClick={() => handleApprove(p.id)}
                      >
                        {busyId === p.id ? 'Aprobando…' : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        disabled={busyId === p.id}
                        onClick={() => handleReject(p)}
                      >
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busyId === p.id}
                      onClick={() => handleUnapprove(p.id)}
                    >
                      Quitar de galería
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
