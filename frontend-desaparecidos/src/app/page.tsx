'use client';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function Home() {
  const mockCasos = [
    { id: '1', nombre: 'Juan Pérez', edad: 35, fecha: '2023-10-12', parroquia: 'La Mariscal' },
    { id: '2', nombre: 'María Gómez', edad: 22, fecha: '2023-11-05', parroquia: 'Calderón' },
    { id: '3', nombre: 'Carlos López', edad: 45, fecha: '2023-11-20', parroquia: 'Quitumbe' },
  ];

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
        
        <div className="cases-grid">
          {mockCasos.map(caso => (
            <Link key={caso.id} href={`/casos/${caso.id}`}>
              <Card className="case-card">
                <div className="case-image-placeholder">👤</div>
                <div className="case-body">
                  <h3 className="case-name">{caso.nombre}</h3>
                  <div className="case-meta">
                    <span>Edad: {caso.edad} años</span>
                    <span>•</span>
                    <span>{caso.parroquia}</span>
                  </div>
                  <div className="case-date">Desapareció el: {caso.fecha}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
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
