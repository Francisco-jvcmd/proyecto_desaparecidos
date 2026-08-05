'use client';
import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import MapSelector from '../maps/MapSelector';
import { comunidadApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface PistaFormProps {
  casoId: string;
  onSuccess?: () => void;
}

export default function PistaForm({ casoId, onSuccess }: PistaFormProps) {
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descripcion.length < 10) {
      setError('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    
    const token = getToken();
    if (!token) {
      setError('Debes iniciar sesión para enviar una pista.');
      return;
    }

    setLoading(true);
    try {
      await comunidadApi.enviarPista({ caso_id: casoId, descripcion, ...ubicacion }, token);
      setSuccess('Pista enviada exitosamente.');
      setDescripcion('');
      setUbicacion(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al enviar pista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input 
        multiline 
        label="Descripción de la Pista" 
        value={descripcion} 
        onChange={(e) => setDescripcion(e.target.value)} 
        placeholder="Ej: Lo vi caminando cerca de..." 
        required 
      />
      
      <div>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Ubicación aproximada (Opcional)</label>
        <MapSelector onLocationSelect={(loc) => setUbicacion(loc)} />
      </div>

      {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>{success}</div>}

      <Button type="submit" loading={loading} variant="accent">Enviar Pista</Button>
    </form>
  );
}
