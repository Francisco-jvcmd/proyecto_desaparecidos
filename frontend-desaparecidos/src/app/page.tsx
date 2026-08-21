'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { comunidadApi } from '@/lib/api';

export default function Home() {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCasos = async () => {
      try {
        const res = await comunidadApi.casosAprobados();
        if (Array.isArray(res)) {
          setCasos(res);
        } else {
          setCasos([]);
        }
      } catch (err) {
        console.error('Error al cargar casos en inicio:', err);
        setCasos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCasos();
  }, []);

  return (
    <div className="page-container">
      <section className="hero">
        <h1 className="hero-title animate-slide-up">
          Cada Minuto <span className="highlight">Cuenta</span>
        </h1>
        <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Plataforma tecnológica de apoyo comunitario para la búsqueda y localización de personas desaparecidas en el Distrito Metropolitano de Quito.
        </p>
        
        <div className="hero-stats animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="hero-stat">
            <div className="stat-number">16,729</div>
            <div className="stat-label">Casos Registrados</div>
          </div>
          <div className="hero-stat">
            <div className="stat-number">1,526</div>
            <div className="stat-label">Casos Resueltos</div>
          </div>
          <div className="hero-stat">
            <div className="stat-number">DMQ</div>
            <div className="stat-label">2017 - 2025</div>
          </div>
        </div>
        
        <div className="hero-actions animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/registro" className="btn btn-primary">
            Reportar Desaparición
          </Link>
          <Link href="/casos" className="btn btn-accent">
            Ver Casos
          </Link>
        </div>
      </section>

      <section style={{ margin: '80px 0' }}>
        <div className="page-header text-center">
          <h2>Casos Recientes</h2>
          <p>Ayúdanos a encontrarlos. Si tienes información, colabora con una pista.</p>
        </div>
        
        {loading ? (
          <div className="loading-container"><span className="spinner" /></div>
        ) : casos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '8px' }}>✓ No hay casos activos reportados en este momento.</p>
            <p style={{ fontSize: '0.875rem' }}>Todos los casos validados aparecerán automáticamente en esta sección.</p>
          </div>
        ) : (
          <div className="cases-grid">
            {casos.slice(0, 6).map(caso => {
              const displayName = caso.nombre || `${caso.nombres || ''} ${caso.apellidos || ''}`.trim();
              const displayParroquia = caso.parroquia || caso.parroquia_desaparicion || 'DMQ';
              const displayFecha = caso.fecha || caso.fecha_desaparicion || 'Sin fecha';

              return (
                <Link key={caso.id} href={`/casos/${caso.id}`}>
                  <Card className="case-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{
                      width: '100%',
                      height: '220px',
                      background: 'var(--bg-secondary)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {caso.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={caso.foto_url}
                          alt={displayName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '3.5rem', marginBottom: '4px' }}>👤</div>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sin Fotografía</span>
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(220, 38, 38, 0.9)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        backdropFilter: 'blur(4px)'
                      }}>
                        ALERTA ACTIVA
                      </div>
                    </div>
                    <div className="case-body" style={{ padding: '16px' }}>
                      <h3 className="case-name" style={{ fontSize: '1.125rem', marginBottom: '6px' }}>{displayName}</h3>
                      <div className="case-meta" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span>Edad: {caso.edad} años</span>
                        <span>•</span>
                        <span>{displayParroquia}</span>
                      </div>
                      <div className="case-date" style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        Desapareció el: <strong style={{ color: 'var(--text-secondary)' }}>{displayFecha}</strong>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ margin: '80px 0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem' }}>¿Cómo Funciona?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <Card className="p-6">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
            <h3>1. Registra</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Familiar registra los datos validados del caso.</p>
          </Card>
          <Card className="p-6">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <h3>2. Analiza</h3>
            <p style={{ color: 'var(--text-secondary)' }}>El sistema genera zonas probables de búsqueda.</p>
          </Card>
          <Card className="p-6">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
            <h3>3. Colabora</h3>
            <p style={{ color: 'var(--text-secondary)' }}>La comunidad aporta pistas anónimas y valiosas.</p>
          </Card>
        </div>
      </section>

      <section className="legal-disclaimer" style={{ textAlign: 'center' }}>
        <h2>Líneas de Emergencia Oficiales</h2>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '16px' }}>
          <strong>ECU-911</strong>
          <strong>DINASED: 1800-DELITO (335486)</strong>
        </div>
      </section>
    </div>
  );
}
