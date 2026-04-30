import { useEffect, useMemo, useState } from 'react';
import { subscribeAllMessages, subscribeApprovedPhotos } from '../../firebase/messageWall.js';
import { subscribeAdminContributions } from '../../firebase/contributions.js';
import { useConfig } from '../../hooks/useConfig.js';
import { generateMessagesPdf, downloadPdf } from '../../utils/exportPdf.js';
import { generatePhotosZip, downloadBlob } from '../../utils/exportZip.js';
import styles from './ExportTools.module.css';

export default function ExportTools() {
  const [allMessages, setAllMessages] = useState([]);
  const [approvedPhotos, setApprovedPhotos] = useState([]);
  const [contributions, setContributions] = useState([]);
  const { config } = useConfig();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState(null);

  useEffect(() => {
    const unsubM = subscribeAllMessages(setAllMessages);
    const unsubP = subscribeApprovedPhotos(setApprovedPhotos);
    const unsubC = subscribeAdminContributions(setContributions);
    return () => {
      try { unsubM(); } catch { /* noop */ }
      try { unsubP(); } catch { /* noop */ }
      try { unsubC(); } catch { /* noop */ }
    };
  }, []);

  const contributionsById = useMemo(
    () => new Map(contributions.map((c) => [c.id, c])),
    [contributions]
  );

  const visibleMessages = allMessages.filter(
    (m) => !m.messageHidden && m.message && m.message.trim().length > 0
  );

  const handleExportPdf = async () => {
    setPdfBusy(true);
    try {
      const bytes = await generateMessagesPdf(visibleMessages, {
        totalContributors: config?.totalContributors ?? null,
        contributionsById,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadPdf(bytes, `mensajes-mariangeles-${stamp}.pdf`);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF. Revisa la consola.');
    } finally {
      setPdfBusy(false);
    }
  };

  const handleExportZip = async () => {
    setZipBusy(true);
    setZipProgress({ current: 0, total: approvedPhotos.length });
    try {
      const blob = await generatePhotosZip(approvedPhotos, (p) => setZipProgress(p));
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `fotos-mariangeles-${stamp}.zip`);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el ZIP. Revisa la consola.');
    } finally {
      setZipBusy(false);
      setZipProgress(null);
    }
  };

  return (
    <section className={styles.section}>
      <header>
        <h2 className={styles.heading}>Exportar para entrega final</h2>
        <p className={styles.lead}>
          Genera los archivos que entregarás a MªÁngeles. El PDF incluye una
          portada y todos los mensajes maquetados; el ZIP empaqueta todas las
          fotos aprobadas con fecha y nombre.
        </p>
      </header>

      <div className={styles.cards}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Mensajes en PDF</h3>
          <p className={styles.cardBody}>
            {visibleMessages.length === 0
              ? 'Aún no hay mensajes para exportar.'
              : `${visibleMessages.length} mensaje${visibleMessages.length === 1 ? '' : 's'} listos para imprimir.`}
          </p>
          <button
            type="button"
            className="btn"
            disabled={pdfBusy || visibleMessages.length === 0}
            onClick={handleExportPdf}
          >
            {pdfBusy ? 'Generando…' : 'Descargar PDF'}
          </button>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Fotos en ZIP</h3>
          <p className={styles.cardBody}>
            {approvedPhotos.length === 0
              ? 'Aún no hay fotos aprobadas.'
              : `${approvedPhotos.length} foto${approvedPhotos.length === 1 ? '' : 's'} aprobada${approvedPhotos.length === 1 ? '' : 's'} listas para empaquetar.`}
          </p>
          {zipProgress && zipBusy && (
            <p className={styles.progress}>
              Descargando {zipProgress.current} / {zipProgress.total}…
            </p>
          )}
          <button
            type="button"
            className="btn"
            disabled={zipBusy || approvedPhotos.length === 0}
            onClick={handleExportZip}
          >
            {zipBusy ? 'Generando…' : 'Descargar ZIP'}
          </button>
        </article>
      </div>
    </section>
  );
}
