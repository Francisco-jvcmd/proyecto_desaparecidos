import React from 'react';
import type { Metadata } from 'next';
import MapViewer from '@/components/maps/MapViewer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type Props = {
  params: { id: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // En producción: fetch de API para obtener datos reales del caso
  return {
    title: `Búsqueda: Juan Pérez - Desaparecidos DMQ`,
    description: `Juan Pérez, 35 años, desaparecido en La Mariscal. Ayúdanos a encontrarlo.`,
    openGraph: {
      title: 'Ayúdanos a encontrar a Juan Pérez',
      description: 'Desaparecido en La Mariscal, DMQ',
      type: 'article',
    }
  };
}

export default function CasoDetail({ params }: Props) {
  // Mock data para SSR (en producción: fetch del backend)
  const caso = {
    id: params.id,
    nombre: 'Juan Pérez',
    edad: 35,
    sexo: 'Masculino',
    fecha: '2023-10-12',
    parroquia: 'La Mariscal',
    vestimenta: 'Chaqueta azul, pantalón jean negro, zapatos deportivos blancos.',
    senasParticulares: 'Cicatriz en la ceja izquierda. Tatuaje en el antebrazo derecho.',
    estado: 'APROBADO',
    puntoA: { lat: -0.203, lng: -78.490 }
  };

  const shareText = encodeURIComponent(`Ayúdanos a encontrar a ${caso.nombre}, desaparecido en ${caso.parroquia}. Más información: https://plataforma-dmq.ec/casos/${caso.id}`);
  const waLink = `https://wa.me/?text=${shareText}`;

  return (
    <div className="page-container">
      <div className="detail-layout">
        <div className="detail-info">
          <div className="detail-header">
            <div className="detail-photo" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
              👤
            </div>
            <div>
              <h1 style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {caso.nombre}
              </h1>
              <Badge estado={caso.estado} />
              
              <div className="detail-meta">
                <div className="detail-meta-item">
                  <span className="meta-label">Edad</span>
                  <span className="meta-value">{caso.edad} años</span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Sexo</span>
                  <span className="meta-value">{caso.sexo}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Fecha Desaparición</span>
                  <span className="meta-value">{caso.fecha}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Sector</span>
                  <span className="meta-value">{caso.parroquia}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, background: '#25D366', textAlign: 'center' }}>
              📱 Compartir en WhatsApp
            </a>
            <Button variant="accent" style={{ flex: 1 }}>
              🧩 Aportar Pista
            </Button>
          </div>

          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', color: 'var(--color-accent)' }}>Descripción Física y Ropa</h3>
            <p style={{ marginBottom: '16px' }}><strong>Vestimenta:</strong> {caso.vestimenta}</p>
            <p><strong>Señas Particulares:</strong> {caso.senasParticulares}</p>
          </Card>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>Último Lugar Visto</h3>
          {/* MapViewer ahora lee el rol dinámicamente desde localStorage — §3.4 */}
          <MapViewer puntoA={caso.puntoA} casoId={caso.id} casoNombre={caso.nombre} />
        </div>
      </div>
    </div>
  );
}
