'use client';
import { useState } from 'react';
import LegalDisclaimer from '../LegalDisclaimer';
import ConsentCheckbox from '../ConsentCheckbox';
import Button from '../ui/Button';
import Input from '../ui/Input';
import MapSelector from '../maps/MapSelector';
import { familiarApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { validarCedulaEC, analizarCedulaEC, validarEdad, validarFechaNoFutura, validarCoordenadasDMQ } from '@/lib/validators';

export default function RegistroForm() {
  const [formData, setFormData] = useState({
    nombres: '', apellidos: '', cedula: '',
    edad: '', sexo: 'M', fechaDesaparicion: '',
    vestimenta: '', senasParticulares: '',
    parroquia: '', lat: 0, lng: 0
  });
  
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLocation = (loc: { lat: number, lng: number }) => {
    setFormData(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WebP.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!validarCedulaEC(formData.cedula)) return 'Cédula inválida.';
    if (!validarEdad(parseInt(formData.edad))) return 'Edad inválida.';
    if (!validarFechaNoFutura(formData.fechaDesaparicion)) return 'Fecha no puede ser futura.';
    if (!validarCoordenadasDMQ(formData.lat, formData.lng)) return 'Ubicación fuera del DMQ o no seleccionada.';
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    try {
      const token = getToken() || '';
      await familiarApi.registrarCaso(formData, token);
      setSuccess('Caso registrado exitosamente.');
    } catch (err: any) {
      setError(err.message || 'Error al registrar caso.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <LegalDisclaimer />
      
      <div className="form-section">
        <h3 className="form-section-title">Datos Personales</h3>
        <div className="form-grid">
          <Input label="Nombres" name="nombres" value={formData.nombres} onChange={handleInputChange} required />
          <Input label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleInputChange} required />
          <div>
            <Input 
              label="Cédula (10 dígitos)" 
              name="cedula" 
              maxLength={10} 
              value={formData.cedula} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, cedula: val }));
              }} 
              required 
            />
            {formData.cedula.length > 0 && (
              <div style={{
                marginTop: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: analizarCedulaEC(formData.cedula).valida ? '#10b981' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>{analizarCedulaEC(formData.cedula).valida ? '✓' : '⚠️'}</span>
                <span>{analizarCedulaEC(formData.cedula).mensaje}</span>
              </div>
            )}
          </div>
          <Input label="Edad" name="edad" type="number" value={formData.edad} onChange={handleInputChange} required />
          <div className="input-group">
            <label>Sexo</label>
            <select name="sexo" className="input-field" value={formData.sexo} onChange={handleInputChange}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <Input label="Fecha de Desaparición" name="fechaDesaparicion" type="date" value={formData.fechaDesaparicion} onChange={handleInputChange} required />
        </div>
      </div>
      
      <div className="form-section">
        <h3 className="form-section-title">Fotografía de la Persona</h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '24px',
          border: '2px dashed var(--border-glass)',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          cursor: 'pointer',
          transition: 'border-color 0.3s'
        }}>
          {photoPreview ? (
            <div style={{ position: 'relative' }}>
              <img
                src={photoPreview}
                alt="Vista previa"
                style={{
                  width: '180px',
                  height: '220px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '2px solid var(--color-accent)'
                }}
              />
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--color-danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📷</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>
                Haz clic para seleccionar una foto
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                JPG, PNG o WebP • Máx. 5MB
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      </div>
      
      <div className="form-section">
        <h3 className="form-section-title">Descripción</h3>
        <div className="form-grid">
          <Input multiline label="Vestimenta" name="vestimenta" value={formData.vestimenta} onChange={handleInputChange} required />
          <Input multiline label="Señas Particulares" name="senasParticulares" value={formData.senasParticulares} onChange={handleInputChange} />
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Último Lugar Visto</h3>
        <Input label="Parroquia (DMQ)" name="parroquia" value={formData.parroquia} onChange={handleInputChange} required className="mb-4" />
        
        {/* === Alerta LOPDP Art. 21, 25 — Protección NNA === */}
        {parseInt(formData.edad) > 0 && parseInt(formData.edad) < 18 && (
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.4)', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '16px',
            fontSize: '0.875rem'
          }}>
            <strong>⚠️ Caso de Menor de Edad (Art. 21, 25 LOPDP):</strong>
            <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
              Al tratarse de una persona menor de 18 años, este reporte debe ser realizado 
              por un <strong>representante legal</strong> debidamente identificado. Los datos de NNA 
              (Niñas, Niños y Adolescentes) son considerados categoría especial y recibirán 
              protección reforzada conforme a la LOPDP.
            </p>
          </div>
        )}
        
        <MapSelector onLocationSelect={handleLocation} />
      </div>
      
      {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-success)', marginBottom: '16px' }}>{success}</div>}
      
      <ConsentCheckbox onChange={setConsent} />
      
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" disabled={!consent} loading={loading}>Registrar Caso</Button>
      </div>
    </form>
  );
}
