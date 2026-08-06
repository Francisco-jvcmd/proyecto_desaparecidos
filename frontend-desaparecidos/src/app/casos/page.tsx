'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { comunidadApi } from '@/lib/api';

// Mock data as fallback
const mockCasos = [
  { id: '1', nombre: 'Juan Pérez', edad: 35, fecha: '2023-10-12', parroquia: 'La Mariscal', sexo: 'M' },
  { id: '2', nombre: 'María Gómez', edad: 22, fecha: '2023-11-05', parroquia: 'Calderón', sexo: 'F' },
  { id: '3', nombre: 'Carlos López', edad: 45, fecha: '2023-11-20', parroquia: 'Quitumbe', sexo: 'M' },
  { id: '4', nombre: 'Ana Torres', edad: 19, fecha: '2024-01-10', parroquia: 'Tumbaco', sexo: 'F' },
  { id: '5', nombre: 'Luis Simbaña', edad: 60, fecha: '2024-02-15', parroquia: 'Chillogallo', sexo: 'M' },
];

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
        if (Array.isArray(res) && res.length > 0) {
          setCasos(res as any[]);
        } else {
          setCasos(mockCasos);
        }
      } catch (err) {
        // Fallback
        setCasos(mockCasos);
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
                <Card className="case-card">
                  <div className="case-image-placeholder">👤</div>
                  <div className="case-body">
                    <h3 className="case-name">{displayName}</h3>
                    <div className="case-meta">
                      <span>Edad: {caso.edad} años</span>
                      <span>•</span>
                      <span>{displayParroquia}</span>
                    </div>
                    <div className="case-date">Desapareció el: {displayFecha}</div>
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
