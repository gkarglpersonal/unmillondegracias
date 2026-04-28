import styles from './Layout.module.css';

export default function Layout({ children, sidebar, floating }) {
  return (
    <div className={`${styles.shell} ${sidebar ? styles.withSidebar : ''}`}>
      <main className={styles.main}>{children}</main>
      {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
      {floating}
    </div>
  );
}
