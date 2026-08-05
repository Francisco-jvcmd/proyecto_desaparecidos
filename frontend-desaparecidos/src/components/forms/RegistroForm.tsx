'use client';
import { useState } from 'react';
import LegalDisclaimer from '../LegalDisclaimer';
import ConsentCheckbox from '../ConsentCheckbox';
import Button from '../ui/Button';
import Input from '../ui/Input';
import MapSelector from '../maps/MapSelector';
import { familiarApi } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { validarCedulaEC, validarEdad, validarFechaNoFutura, validarCoordenadasDMQ } from '@/lib/validators';

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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLocation = (loc: { lat: number, lng: number }) => {
    setFormData(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
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
          <Input label="Cédula (10 dígitos)" name="cedula" maxLength={10} value={formData.cedula} onChange={handleInputChange} required />
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
