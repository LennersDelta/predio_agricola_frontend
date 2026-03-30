import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f0f4f1', minHeight: '100vh' }}>
      <Sidebar />
      <div
        id="main-wrapper"
        style={{
          marginLeft: '256px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f0f4f1',
          transition: 'margin-left .28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <Topbar />
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}