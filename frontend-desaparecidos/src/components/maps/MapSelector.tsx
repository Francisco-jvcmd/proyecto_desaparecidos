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
  const [isSatellite, setIsSatellite] = useState(false);

  const STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  const toggleMapStyle = () => {
    if (!map.current) return;
    const newIsSatellite = !isSatellite;
    setIsSatellite(newIsSatellite);
    if (newIsSatellite) {
      map.current.setStyle({
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
          },
          'esri-transportation': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256
          },
          'esri-labels': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 19
          },
          {
            id: 'esri-transportation-layer',
            type: 'raster',
            source: 'esri-transportation',
            minzoom: 0,
            maxzoom: 19
          },
          {
            id: 'esri-labels-layer',
            type: 'raster',
            source: 'esri-labels',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      });
    } else {
      map.current.setStyle(STYLE_DARK);
    }
  };

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
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={toggleMapStyle}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 10,
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s'
          }}
        >
          {isSatellite ? '🗺️ Mapa' : '🛰️ Satélite'}
        </button>
        <div ref={mapContainer} className="map-container" />
      </div>
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</span>}
      {coords && (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </span>
      )}
    </div>
  );
}
