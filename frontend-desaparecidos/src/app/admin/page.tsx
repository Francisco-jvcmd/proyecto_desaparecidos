'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getUser, getToken } from '@/lib/auth';
import { adminApi } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('casos');
  const [authorized, setAuthorized] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [stats, setStats] = useState({
    total_casos: 0,
    casos_pendientes: 0,
    casos_aprobados: 0,
    casos_localizados: 0,
    total_pistas: 0,
    pistas_pendientes: 0,
  });

  const [casosPendientes, setCasosPendientes] = useState<any[]>([]);
  const [colaPistas, setColaPistas] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Protección de ruta: verificar rol ADMIN
  useEffect(() => {
    const user = getUser();
    if (!user || user.rol !== 'ADMIN') {
      router.push('/');
      return;
    }
    setAuthorized(true);
  }, [router]);

  const loadData = async () => {
    const token = getToken();
    if (!token) return;

    setLoadingData(true);
    try {
      const [statsRes, casosRes, pistasRes] = await Promise.allSettled([
        adminApi.estadisticas(token),
        adminApi.casosPendientes(token),
        adminApi.colaPistas(token),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value as any);
      }
      if (casosRes.status === 'fulfilled' && Array.isArray(casosRes.value)) {
        setCasosPendientes(casosRes.value);
      }
      if (pistasRes.status === 'fulfilled' && Array.isArray(pistasRes.value)) {
        setColaPistas(pistasRes.value);
      }
    } catch (err) {
      console.error('Error al cargar datos del panel admin:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  const handleAprobarCaso = async (casoId: string) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(casoId);
    try {
      await adminApi.aprobarCaso(casoId, token);
      setNotification('✓ Caso aprobado exitosamente. Ya es público en la plataforma.');
      await loadData();
    } catch (err: any) {
      setNotification(`⚠️ Error al aprobar: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazarCaso = async (casoId: string) => {
    const token = getToken();
    if (!token) return;
    if (!confirm('¿Estás seguro de archivar/rechazar este caso?')) return;

    setActionLoading(casoId);
    try {
      await adminApi.rechazarCaso(casoId, token);
      setNotification('ℹ️ Caso archivado correctamente.');
      await loadData();
    } catch (err: any) {
      setNotification(`⚠️ Error al rechazar: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerarPista = async (pistaId: string, estado: 'APROBADA' | 'DESCARTADA') => {
    const token = getToken();
    if (!token) return;
    setActionLoading(pistaId);
    try {
      await adminApi.moderarPista(pistaId, { estado }, token);
      setNotification(`✓ Pista ${estado.toLowerCase()} exitosamente.`);
      await loadData();
    } catch (err: any) {
      setNotification(`⚠️ Error al moderar pista: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setActionLoading(null);
    }
  };

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
            className={`admin-sidebar-item ${activeTab === 'casos' ? 'active' : ''}`}
            onClick={() => setActiveTab('casos')}
          >
            📝 Casos Pendientes <span className="item-count">{casosPendientes.length}</span>
          </div>
          <div 
            className={`admin-sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard y Estadísticas
          </div>
          <div 
            className={`admin-sidebar-item ${activeTab === 'pistas' ? 'active' : ''}`}
            onClick={() => setActiveTab('pistas')}
          >
            🧩 Moderación de Pistas <span className="item-count">{colaPistas.length}</span>
          </div>
        </aside>

        <main>
          <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Administración DMQ</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Gestión oficial de reportes, validación de identidades y moderación ciudadana.
              </p>
            </div>
            <Button variant="outline" onClick={loadData} loading={loadingData} style={{ fontSize: '0.8125rem' }}>
              🔄 Actualizar Datos
            </Button>
          </div>

          {notification && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: notification.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${notification.startsWith('✓') ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
              color: notification.startsWith('✓') ? '#10b981' : '#38bdf8',
              fontSize: '0.875rem',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{notification}</span>
              <button 
                onClick={() => setNotification(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div>
              <div className="stats-grid">
                <Card className="stat-card">
                  <div className="stat-value">{stats.total_casos}</div>
                  <div className="stat-label">Total Casos Registrados</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.casos_pendientes}</div>
                  <div className="stat-label">Casos por Aprobar</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.casos_localizados}</div>
                  <div className="stat-label">Casos Localizados</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--color-info)' }}>{stats.pistas_pendientes}</div>
                  <div className="stat-label">Pistas Pendientes</div>
                </Card>
              </div>
              
              <Card style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Estado del Sistema</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  • Casos Aprobados Activos: <strong>{stats.casos_aprobados}</strong><br />
                  • Total de Pistas Recibidas: <strong>{stats.total_pistas}</strong><br />
                  • Cumplimiento LOPDP: <strong>100% Cifrado AES-256 + Blind Index</strong>
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'casos' && (
            <Card style={{ padding: '24px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Casos Pendientes de Aprobación ({casosPendientes.length})</h3>
              </div>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /></div>
              ) : casosPendientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✓</div>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>No hay casos pendientes de revisión.</p>
                  <p style={{ fontSize: '0.8125rem' }}>Todos los casos reportados han sido procesados.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cédula</th>
                      <th>Nombre del Desaparecido</th>
                      <th>Edad / Sexo</th>
                      <th>Sector / Parroquia</th>
                      <th>Fecha Desaparición</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casosPendientes.map((caso) => (
                      <tr key={caso.id}>
                        <td><code>{caso.cedula_desaparecido || 'N/A'}</code></td>
                        <td><strong>{caso.nombres} {caso.apellidos}</strong></td>
                        <td>{caso.edad} años • {caso.sexo}</td>
                        <td>{caso.parroquia_desaparicion || caso.barrio || 'DMQ'}</td>
                        <td>{caso.fecha_desaparicion}</td>
                        <td><Badge estado={caso.estado} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Button 
                              variant="primary" 
                              loading={actionLoading === caso.id}
                              onClick={() => handleAprobarCaso(caso.id)}
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              ✓ Aprobar
                            </Button>
                            <Button 
                              variant="danger" 
                              loading={actionLoading === caso.id}
                              onClick={() => handleRechazarCaso(caso.id)}
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            >
                              ✕ Rechazar
                            </Button>
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `🚨 ALERTA OFICIAL DE BÚSQUEDA DMQ 🚨\n\n👤 Persona: ${caso.nombres} ${caso.apellidos}\n🎂 Edad: ${caso.edad} años (${caso.sexo})\n📍 Sector: ${caso.parroquia_desaparicion || caso.barrio || 'Quito'}\n🗓️ Fecha: ${caso.fecha_desaparicion}\n👕 Vestimenta: ${caso.ropa_descripcion || 'No detallada'}\n🔍 Señas: ${caso.senas_particulares || 'Ninguna'}\n\n🔗 Afiche oficial y reporte de pistas:\nhttps://proyecto-desaparecidos.vercel.app/casos/${caso.id}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: '#25D366', color: '#25D366' }}
                              title="Publicar en Canal de WhatsApp"
                            >
                              📢 Difundir
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

          {activeTab === 'pistas' && (
            <Card style={{ padding: '24px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Cola de Moderación de Pistas ({colaPistas.length})</h3>
              </div>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /></div>
              ) : colaPistas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✓</div>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>No hay pistas pendientes de moderación.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Caso</th>
                      <th>Descripción de la Pista</th>
                      <th>Fecha de Envío</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colaPistas.map((pista) => (
                      <tr key={pista.id}>
                        <td><code>{pista.desaparecido_id?.slice(0, 8)}...</code></td>
                        <td style={{ maxWidth: '300px' }}>{pista.descripcion}</td>
                        <td>{pista.created_at?.slice(0, 10) || 'Reciente'}</td>
                        <td><Badge estado={pista.estado} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                              variant="primary" 
                              loading={actionLoading === pista.id}
                              onClick={() => handleModerarPista(pista.id, 'APROBADA')}
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              ✓ Aprobar
                            </Button>
                            <Button 
                              variant="danger" 
                              loading={actionLoading === pista.id}
                              onClick={() => handleModerarPista(pista.id, 'DESCARTADA')}
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              ✕ Descartar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
