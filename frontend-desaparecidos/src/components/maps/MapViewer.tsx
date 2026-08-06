'use client';
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { predictionApi } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

interface MapViewerProps {
  puntoA: { lat: number; lng: number };
  puntoB?: { lat: number; lng: number };
  casoId: string;
  casoNombre?: string;
}

export default function MapViewer({ puntoA, puntoB, casoId, casoNombre = 'Último Lugar Visto' }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  const STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const STYLE_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

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
            tiles: [STYLE_SATELLITE],
            tileSize: 256,
            attribution: '© Esri'
          }
        },
        layers: [{
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19
        }]
      });
    } else {
      map.current.setStyle(STYLE_DARK);
    }
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [puntoA.lng, puntoA.lat],
      zoom: 14
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    const mapInstance = map.current;

    const initMap = async () => {
      // Marcador del Punto A (siempre visible — §3.4)
      new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([puntoA.lng, puntoA.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
          `<div style="color: #1e3a5f; font-weight: 600;">${casoNombre}</div><p style="margin:4px 0 0;color:#64748b;">Último lugar visto</p>`
        ))
        .addTo(mapInstance);

      // Marcador del Punto B si el caso fue localizado
      if (puntoB) {
        new maplibregl.Marker({ color: '#10b981' })
          .setLngLat([puntoB.lng, puntoB.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
            '<div style="color: #10b981; font-weight: 600;">Lugar de Localización</div>'
          ))
          .addTo(mapInstance);

        // Ajustar vista para mostrar ambos puntos
        const bounds = new maplibregl.LngLatBounds(
          [puntoA.lng, puntoA.lat],
          [puntoB.lng, puntoB.lat]
        );
        mapInstance.fitBounds(bounds, { padding: 60 });
      }

      // Cargar capas analíticas solo si el usuario tiene rol privilegiado — §3.4
      const user = getUser();
      const userRole = user?.rol;

      if (userRole === 'ADMIN' || userRole === 'FAMILIAR') {
        const token = getToken();
        if (token) {
          try {
            const polygonData = await predictionApi.poligono(casoId, token);

            // Fix: Verificar si el mapa ya cargó o esperar evento load
            const addLayers = () => {
              if (!mapInstance || !polygonData) return;

              mapInstance.addSource('prediction-polygon', {
                type: 'geojson',
                data: polygonData as any
              });
              mapInstance.addLayer({
                id: 'prediction-fill',
                type: 'fill',
                source: 'prediction-polygon',
                paint: {
                  'fill-color': 'rgba(245, 158, 11, 0.15)',
                  'fill-outline-color': '#f59e0b'
                }
              });
              mapInstance.addLayer({
                id: 'prediction-outline',
                type: 'line',
                source: 'prediction-polygon',
                paint: {
                  'line-color': '#f59e0b',
                  'line-width': 2,
                  'line-dasharray': [3, 2]
                }
              });
            };

            if (mapInstance.loaded()) {
              addLayers();
            } else {
              mapInstance.on('load', addLayers);
            }

          } catch (err) {
            console.error('Error al cargar capas predictivas:', err);
          }
        }
      }
    };

    initMap();

    return () => {
      mapInstance.remove();
      map.current = null; // Fix: Reset ref for React Strict Mode
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntoA.lat, puntoA.lng, casoId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      <div ref={mapContainer} className="map-container map-full" />
    </div>
  );
}
