'use client';
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { validarCoordenadasDMQ } from '@/lib/validators';

interface MapSelectorProps {
  onLocationSelect: (loc: { lat: number; lng: number }) => void;
}

export default function MapSelector({ onLocationSelect }: MapSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState('');

  // Función reutilizable para adjuntar listener de dragend con validación DMQ
  const attachDragEndListener = (m: maplibregl.Marker) => {
    m.on('dragend', () => {
      const lngLat = m.getLngLat();
      if (!validarCoordenadasDMQ(lngLat.lat, lngLat.lng)) {
        setError('Ubicación fuera del DMQ. Arrastra el marcador dentro de Quito.');
        // Regresar marcador a la última posición válida
        if (coords) {
          m.setLngLat([coords.lng, coords.lat]);
        }
        return;
      }
      setError('');
      setCoords({ lat: lngLat.lat, lng: lngLat.lng });
      onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
    });
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-78.4678, -0.1807], // Centro de Quito
      zoom: 11
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (!validarCoordenadasDMQ(lat, lng)) {
        setError('Ubicación fuera del DMQ. Por favor, selecciona un punto dentro de Quito.');
        return;
      }
      setError('');
      setCoords({ lat, lng });
      onLocationSelect({ lat, lng });

      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new maplibregl.Marker({ draggable: true, color: '#f59e0b' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        attachDragEndListener(marker.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null; // Fix: Reset ref to allow re-initialization in Strict Mode
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      if (!validarCoordenadasDMQ(lat, lng)) {
        setError('Tu ubicación actual está fuera del DMQ.');
        return;
      }

      map.current?.flyTo({ center: [lng, lat], zoom: 15 });
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new maplibregl.Marker({ draggable: true, color: '#f59e0b' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        attachDragEndListener(marker.current); // Fix: attach listener for geolocation marker
      }
      setCoords({ lat, lng });
      onLocationSelect({ lat, lng });
      setError('');
    }, () => {
      setError('No se pudo obtener la ubicación.');
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button 
        type="button" 
        onClick={handleGeolocation}
        className="btn"
        style={{ alignSelf: 'flex-start', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}
      >
        📍 Usar mi ubicación
      </button>
      <div ref={mapContainer} className="map-container" />
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</span>}
      {coords && (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </span>
      )}
    </div>
  );
}
