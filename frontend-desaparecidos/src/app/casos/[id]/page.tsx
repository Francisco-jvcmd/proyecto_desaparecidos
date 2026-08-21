'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MapViewer from '@/components/maps/MapViewer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { familiarApi, comunidadApi } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { descargarFichaOficial } from '@/lib/fichaGenerator';

type Props = {
  params: { id: string };
};

export default function CasoDetail({ params }: Props) {
  const [caso, setCaso] = useState<any | null>(null);
  const [pistas, setPistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingFicha, setDownloadingFicha] = useState(false);

  // Estado del Modal para Aportar Pista
  const [showPistaModal, setShowPistaModal] = useState(false);
  const [pistaDescripcion, setPistaDescripcion] = useState('');
  const [pistaLat, setPistaLat] = useState<number | undefined>(undefined);
  const [pistaLng, setPistaLng] = useState<number | undefined>(undefined);
  const [pistaLoading, setPistaLoading] = useState(false);
  const [pistaError, setPistaError] = useState('');
  const [pistaSuccess, setPistaSuccess] = useState('');

  useEffect(() => {
    const fetchCasoAndPistas = async () => {
      try {
        const [casoData, pistasData] = await Promise.allSettled([
          familiarApi.obtenerCaso(params.id),
          comunidadApi.pistasDelCaso(params.id)
        ]);

        if (casoData.status === 'fulfilled' && casoData.value) {
          setCaso(casoData.value);
        } else {
          throw new Error('El caso no fue encontrado o aún no ha sido aprobado públicamente.');
        }

        if (pistasData.status === 'fulfilled' && Array.isArray(pistasData.value)) {
          setPistas(pistasData.value);
        }
      } catch (err: any) {
        console.error('Error al cargar caso:', err);
        setError(err.message || 'El caso no fue encontrado o se encuentra en revisión.');
      } finally {
        setLoading(false);
      }
    };
    fetchCasoAndPistas();
  }, [params.id]);

  const handleDescargarFicha = async () => {
    if (!caso) return;
    setDownloadingFicha(true);
    try {
      await descargarFichaOficial({
        id: caso.id,
        nombres: caso.nombres,
        apellidos: caso.apellidos,
        edad: caso.edad,
        sexo: caso.sexo,
        fecha_desaparicion: caso.fecha_desaparicion,
        parroquia_desaparicion: caso.parroquia_desaparicion,
        barrio: caso.barrio,
        ropa_descripcion: caso.ropa_descripcion,
        senas_particulares: caso.senas_particulares,
        foto_url: caso.foto_url
      });
    } catch (err) {
      console.error('Error al generar ficha:', err);
      alert('No se pudo generar la ficha. Intente nuevamente.');
    } finally {
      setDownloadingFicha(false);
    }
  };

  const handleEnviarPista = async (e: React.FormEvent) => {
    e.preventDefault();
    setPistaError('');
    setPistaSuccess('');

    if (pistaDescripcion.trim().length < 10) {
      setPistaError('Por favor detalla la pista con al menos 10 caracteres.');
      return;
    }

    const token = getToken();
    if (!token) {
      setPistaError('Debes iniciar sesión con tu cuenta para aportar información confidencial y verificable.');
      return;
    }

    setPistaLoading(true);
    try {
      await comunidadApi.enviarPista({
        desaparecido_id: params.id,
        descripcion: pistaDescripcion.trim(),
        lat: pistaLat,
        lng: pistaLng
      }, token);

      setPistaSuccess('¡Muchas gracias! Tu pista ha sido registrada y está en revisión por las autoridades para su verificación.');
      setPistaDescripcion('');
    } catch (err: any) {
      setPistaError(err.message || 'Error al enviar la pista. Intente nuevamente.');
    } finally {
      setPistaLoading(false);
    }
  };

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
    `🚨 ALERTA DE BÚSQUEDA DMQ 🚨\n\n👤 Persona: ${nombreCompleto}\n🎂 Edad: ${caso.edad} años (${caso.sexo})\n📍 Último lugar visto: ${sector}\n🗓️ Fecha: ${fecha}\n👕 Vestimenta: ${vestimenta}\n🔍 Señas: ${senas}\n\n🔗 Ingresa para ver el afiche oficial y aportar pistas:\nhttps://proyecto-desaparecidos.vercel.app/casos/${caso.id}`
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
              overflow: 'hidden',
              position: 'relative'
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

          {/* Botones de Acción Oficial */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
            <Button 
              variant="primary" 
              onClick={handleDescargarFicha}
              loading={downloadingFicha}
              style={{ flex: '1 1 200px', justifyContent: 'center' }}
            >
              📥 Descargar Ficha Oficial (PNG)
            </Button>
            <Button 
              variant="accent" 
              onClick={() => setShowPistaModal(true)}
              style={{ flex: '1 1 180px', justifyContent: 'center' }}
            >
              🧩 Aportar Pista / Avistamiento
            </Button>
            <a 
              href={waLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline" 
              style={{ flex: '1 1 180px', textAlign: 'center', justifyContent: 'center', borderColor: '#25D366', color: '#25D366' }}
            >
              📱 Compartir en WhatsApp
            </a>
          </div>

          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', color: 'var(--color-accent)' }}>Descripción Física y Ropa</h3>
            <p style={{ marginBottom: '16px' }}><strong>Vestimenta:</strong> {vestimenta}</p>
            <p><strong>Señas Particulares:</strong> {senas}</p>
          </Card>

          {/* Sección de Pistas y Avistamientos Verificados */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧩</span> Pistas y Avistamientos Verificados ({pistas.length})
            </h3>
            {pistas.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Aún no hay pistas verificadas para este caso. Si tienes información sobre su paradero, haz clic en <strong>Aportar Pista</strong>.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pistas.map((pista) => (
                  <div key={pista.id} style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-accent)', fontWeight: 600 }}>
                      <span>✓ Avistamiento Verificado</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pista.created_at?.slice(0, 10)}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>{pista.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px' }}>Último Lugar Visto (Punto A)</h3>
          <MapViewer puntoA={puntoA} casoId={caso.id} casoNombre={nombreCompleto} />
        </div>
      </div>

      {/* Modal de Aporte de Pista */}
      {showPistaModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                🧩 Aportar Información o Pista
              </h2>
              <button 
                onClick={() => { setShowPistaModal(false); setPistaError(''); setPistaSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {!pistaSuccess ? (
              <form onSubmit={handleEnviarPista}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  Tu información es tratada bajo estricta confidencialidad (LOPDP) y será revisada de inmediato por las autoridades para verificar el avistamiento.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <Input
                    multiline
                    label="Descripción de lo que viste (Lugar, hora, vestimenta, compañía)"
                    placeholder="Ej. Lo vi el día de ayer a las 15:00 cerca de la parada del trolebús en la Villaflora con una mochila azul..."
                    value={pistaDescripcion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPistaDescripcion(e.target.value)}
                    required
                  />
                </div>

                {pistaError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '0.8125rem',
                    marginBottom: '16px'
                  }}>
                    ⚠️ {pistaError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowPistaModal(false)}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                  <Button type="submit" loading={pistaLoading}>
                    Enviar Pista a Revisión
                  </Button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✓</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>
                  ¡Información Recibida!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  {pistaSuccess}
                </p>
                <Button onClick={() => { setShowPistaModal(false); setPistaSuccess(''); }} style={{ width: '100%', justifyContent: 'center' }}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
