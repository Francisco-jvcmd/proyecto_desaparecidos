'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getUser } from '@/lib/auth';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authorized, setAuthorized] = useState(false);

  // Protección de ruta: verificar rol ADMIN — §3.3
  useEffect(() => {
    const user = getUser();
    if (!user || user.rol !== 'ADMIN') {
      router.push('/');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="page-container loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1440px' }}>
      <div className="admin-panel">
        <aside className="admin-sidebar">
          <h3 style={{ marginBottom: '24px', padding: '0 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Panel de Control
          </h3>
          <div 
            className={`admin-sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </div>
          <div 
            className={`admin-sidebar-item ${activeTab === 'casos' ? 'active' : ''}`}
            onClick={() => setActiveTab('casos')}
          >
            📝 Casos Pendientes <span className="item-count">3</span>
          </div>
          <div 
            className={`admin-sidebar-item ${activeTab === 'pistas' ? 'active' : ''}`}
            onClick={() => setActiveTab('pistas')}
          >
            🧩 Moderación de Pistas <span className="item-count">7</span>
          </div>
        </aside>

        <main>
          <div className="page-header" style={{ marginBottom: '24px' }}>
            <h1>Administración DMQ</h1>
          </div>

          {activeTab === 'dashboard' && (
            <div>
              <div className="stats-grid">
                <Card className="stat-card">
                  <div className="stat-value">16,729</div>
                  <div className="stat-label">Total Casos Registrados</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Casos por Aprobar</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>1,526</div>
                  <div className="stat-label">Casos Localizados</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--color-info)' }}>7</div>
                  <div className="stat-label">Pistas Pendientes</div>
                </Card>
              </div>
              
              <Card style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Actividad Reciente</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No hay actividad reciente.</p>
              </Card>
            </div>
          )}

          {activeTab === 'casos' && (
            <Card style={{ padding: '24px', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID / Cédula</th>
                    <th>Nombre</th>
                    <th>Fecha Reporte</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1712345678</td>
                    <td>Pedro Rodríguez</td>
                    <td>2024-03-01</td>
                    <td><Badge estado="PENDIENTE" /></td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Aprobar</Button>
                      <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Rechazar</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}

          {activeTab === 'pistas' && (
            <Card style={{ padding: '24px', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Caso</th>
                    <th>Descripción de Pista</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pedro Rodríguez</td>
                    <td>Visto cerca de la estación de buses del Trolebús en La Marín...</td>
                    <td><Badge estado="PENDIENTE" /></td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Aprobar</Button>
                      <Button variant="danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Descartar</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
