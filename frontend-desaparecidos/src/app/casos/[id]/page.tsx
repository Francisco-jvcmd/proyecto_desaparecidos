'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MapViewer from '@/components/maps/MapViewer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { familiarApi } from '@/lib/api';

type Props = {
  params: { id: string };
};

export default function CasoDetail({ params }: Props) {
  const [caso, setCaso] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCaso = async () => {
      try {
        const data = await familiarApi.obtenerCaso(params.id);
        setCaso(data);
      } catch (err: any) {
        console.error('Error al cargar caso:', err);
        setError(err.message || 'El caso no fue encontrado o aún no ha sido aprobado públicamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchCaso();
  }, [params.id]);

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !caso) {
    return (
      <div className="page-container" style={{ maxWidth: '540px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Caso no disponible</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {error || 'El caso solicitado no existe o se encuentra en proceso de revisión administrativa.'}
          </p>
          <Link href="/casos" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            ← Volver a Casos Activos
          </Link>
        </div>
      </div>
    );
  }

  const nombreCompleto = `${caso.nombres || ''} ${caso.apellidos || ''}`.trim() || 'Persona Desaparecida';
  const sector = caso.parroquia_desaparicion || caso.barrio || 'Distrito Metropolitano de Quito';
  const fecha = caso.fecha_desaparicion || 'No especificada';
  const vestimenta = caso.ropa_descripcion || 'No detallada al momento del reporte.';
  const senas = caso.senas_particulares || 'Sin señas particulares reportadas.';
  const puntoA = {
    lat: caso.punto_a_lat || -0.180653,
    lng: caso.punto_a_lng || -78.467834,
  };

  const shareText = encodeURIComponent(
    `URGENTE: Ayúdanos a encontrar a ${nombreCompleto}, desaparecido/a en ${sector}. Más información oficial: https://proyecto-desaparecidos.vercel.app/casos/${caso.id}`
  );
  const waLink = `https://wa.me/?text=${shareText}`;

  return (
    <div className="page-container">
      <div className="detail-layout">
        <div className="detail-info">
          <div className="detail-header">
            <div className="detail-photo" style={{
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              overflow: 'hidden'
            }}>
              {caso.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={caso.foto_url} alt={nombreCompleto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '👤'
              )}
            </div>
            <div>
              <h1 style={{ background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {nombreCompleto}
              </h1>
              <Badge estado={caso.estado || 'APROBADO'} />
              
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
                  <span className="meta-value">{fecha}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Sector / Parroquia</span>
                  <span className="meta-value">{sector}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, background: '#25D366', textAlign: 'center', justifyContent: 'center' }}>
              📱 Difundir en WhatsApp
            </a>
          </div>

          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', color: 'var(--color-accent)' }}>Descripción Física y Ropa</h3>
            <p style={{ marginBottom: '16px' }}><strong>Vestimenta:</strong> {vestimenta}</p>
            <p><strong>Señas Particulares:</strong> {senas}</p>
          </Card>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>Último Lugar Visto (Punto A)</h3>
          <MapViewer puntoA={puntoA} casoId={caso.id} casoNombre={nombreCompleto} />
        </div>
      </div>
    </div>
  );
}
