import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />
      <main style={{
        flexGrow: 1, 
        marginLeft: 'var(--sidebar-width-expanded)', 
        transition: 'margin-left var(--transition-normal)',
        padding: 'var(--space-xl)'
      }}>
        {children}
      </main>
    </div>
  );
}
