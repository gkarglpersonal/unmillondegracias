import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import ContributionsList from './ContributionsList.jsx';
import MessagesModeration from './MessagesModeration.jsx';
import PhotosModeration from './PhotosModeration.jsx';
import TripItemsManager from './TripItemsManager.jsx';
import ManualContributionForm from './ManualContributionForm.jsx';
import ManualPhotoUploadForm from './ManualPhotoUploadForm.jsx';
import ExportTools from './ExportTools.jsx';
import EmailJsAlert from './EmailJsAlert.jsx';
import AdminDashboardCards from './AdminDashboardCards.jsx';
import styles from './AdminLayout.module.css';

const TABS = [
  { id: 'contributions', label: 'Aportaciones', component: ContributionsList },
  { id: 'messages', label: 'Mensajes', component: MessagesModeration },
  { id: 'photos', label: 'Fotos', component: PhotosModeration },
  { id: 'trip-items', label: 'Partidas', component: TripItemsManager },
  { id: 'manual', label: 'Aportación manual', component: ManualContributionForm },
  { id: 'manual-photo', label: 'Subir foto', component: ManualPhotoUploadForm },
  { id: 'export', label: 'Exportar', component: ExportTools },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('contributions');

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || ContributionsList;

  return (
    <div className={styles.shell}>
      <EmailJsAlert />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel admin</h1>
          <p className={styles.user}>{user?.email}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </header>

      <AdminDashboardCards />

      <nav className={styles.tabs} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className={styles.main} role="tabpanel">
        <ActiveComponent />
      </main>
    </div>
  );
}
