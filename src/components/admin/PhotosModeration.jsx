import { useEffect, useState } from 'react';
import {
  subscribePendingPhotos,
  subscribeApprovedPhotos,
  setPhotoApproved,
  deleteMessage,
} from '../../firebase/messageWall.js';
import { deletePhoto } from '../../firebase/storage.js';
import { relativeTime } from '../../utils/formatDate.js';
import styles from './PhotosModeration.module.css';

const FILTERS = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobadas' },
];

export default function PhotosModeration() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);

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

  const items = filter === 'pending' ? pending : approved;

  const handleApprove = async (id) => {
    setBusyId(id);
    try { await setPhotoApproved(id, true); } finally { setBusyId(null); }
  };

  const handleUnapprove = async (id) => {
    if (!confirm('¿Quitar la aprobación? La foto desaparecerá de la galería.')) return;
    setBusyId(id);
    try { await setPhotoApproved(id, false); } finally { setBusyId(null); }
  };

  const handleReject = async (item) => {
    if (!confirm('¿Borrar esta foto del todo? El mensaje (si lo hay) también se elimina.')) return;
    setBusyId(item.id);
    try {
      if (item.photoStoragePath) await deletePhoto(item.photoStoragePath);
      await deleteMessage(item.id);
    } finally { setBusyId(null); }
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
                <img src={p.photoUrl} alt={`Foto de ${p.name}`} className={styles.img} />
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
                        Aprobar
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
