'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { comunidadApi } from '@/lib/api';

export default function CasosPage() {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [parroquiaFilter, setParroquiaFilter] = useState('');
  const [sexoFilter, setSexoFilter] = useState('');

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
        console.error('Error al cargar casos aprobados:', err);
        setCasos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCasos();
  }, []);

  const filteredCasos = casos.filter(caso => {
    const nombre = (caso.nombre || `${caso.nombres || ''} ${caso.apellidos || ''}`).toLowerCase();
    const parroquia = (caso.parroquia || caso.parroquia_desaparicion || '').toLowerCase();
    const sexo = (caso.sexo || '').toUpperCase();

    const matchesSearch = !searchQuery || nombre.includes(searchQuery.trim().toLowerCase());
    const matchesParroquia = !parroquiaFilter || parroquia === parroquiaFilter.toLowerCase();
    const matchesSexo = !sexoFilter || sexo === sexoFilter.toUpperCase();

    return matchesSearch && matchesParroquia && matchesSexo;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Casos Activos</h1>
        <p>Personas desaparecidas en el DMQ que requieren tu ayuda.</p>
      </div>
      
      <div className="filters-bar">
        <Input 
          label="" 
          placeholder="Buscar por nombre..." 
          className="flex-1" 
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
        <select 
          className="input-field" 
          value={parroquiaFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParroquiaFilter(e.target.value)}
        >
          <option value="">Todas las parroquias</option>
          <option value="La Mariscal">La Mariscal</option>
          <option value="Calderón">Calderón</option>
          <option value="Quitumbe">Quitumbe</option>
          <option value="Tumbaco">Tumbaco</option>
          <option value="Chillogallo">Chillogallo</option>
          <option value="Belisario Quevedo">Belisario Quevedo</option>
          <option value="Centro Histórico">Centro Histórico</option>
          <option value="Cotocollao">Cotocollao</option>
          <option value="Iñaquito">Iñaquito</option>
        </select>
        <select 
          className="input-field"
          value={sexoFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSexoFilter(e.target.value)}
        >
          <option value="">Cualquier sexo</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><span className="spinner" /></div>
      ) : filteredCasos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '8px' }}>🔍 No se encontraron casos con los filtros seleccionados.</p>
          <p style={{ fontSize: '0.875rem' }}>Prueba ajustando el nombre, la parroquia o el sexo.</p>
        </div>
      ) : (
        <div className="cases-grid">
          {filteredCasos.map(caso => {
            const displayName = caso.nombre || `${caso.nombres || ''} ${caso.apellidos || ''}`.trim();
            const displayParroquia = caso.parroquia || caso.parroquia_desaparicion || 'DMQ';
            const displayFecha = caso.fecha || caso.fecha_desaparicion || 'Sin fecha';

            return (
              <Link key={caso.id} href={`/casos/${caso.id}`}>
                <Card className="case-card" style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{
                    width: '100%',
                    height: '240px',
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
                        <div style={{ fontSize: '4rem', marginBottom: '4px' }}>👤</div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sin Fotografía</span>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(220, 38, 38, 0.9)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
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

      <div className="pagination">
        <button disabled>Anterior</button>
        <button className="active">1</button>
        <button>Siguiente</button>
      </div>
    </div>
  );
}
