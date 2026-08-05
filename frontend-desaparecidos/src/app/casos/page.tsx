'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { comunidadApi } from '@/lib/api';

export default function CasosPage() {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data as fallback
  const mockCasos = [
    { id: '1', nombre: 'Juan Pérez', edad: 35, fecha: '2023-10-12', parroquia: 'La Mariscal' },
    { id: '2', nombre: 'María Gómez', edad: 22, fecha: '2023-11-05', parroquia: 'Calderón' },
    { id: '3', nombre: 'Carlos López', edad: 45, fecha: '2023-11-20', parroquia: 'Quitumbe' },
    { id: '4', nombre: 'Ana Torres', edad: 19, fecha: '2024-01-10', parroquia: 'Tumbaco' },
    { id: '5', nombre: 'Luis Simbaña', edad: 60, fecha: '2024-02-15', parroquia: 'Chillogallo' },
  ];

  useEffect(() => {
    const fetchCasos = async () => {
      try {
        const res = await comunidadApi.casosAprobados();
        setCasos(res as any[]);
      } catch (err) {
        // Fallback
        setCasos(mockCasos);
      } finally {
        setLoading(false);
      }
    };
    fetchCasos();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Casos Activos</h1>
        <p>Personas desaparecidas en el DMQ que requieren tu ayuda.</p>
      </div>
      
      <div className="filters-bar">
        <Input label="" placeholder="Buscar por nombre..." className="flex-1" />
        <select className="input-field">
          <option value="">Todas las parroquias</option>
          <option value="La Mariscal">La Mariscal</option>
          <option value="Calderón">Calderón</option>
          <option value="Quitumbe">Quitumbe</option>
          <option value="Tumbaco">Tumbaco</option>
        </select>
        <select className="input-field">
          <option value="">Cualquier sexo</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><span className="spinner" /></div>
      ) : (
        <div className="cases-grid">
          {casos.map(caso => (
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
      )}

      <div className="pagination">
        <button disabled>Anterior</button>
        <button className="active">1</button>
        <button>2</button>
        <button>Siguiente</button>
      </div>
    </div>
  );
}
