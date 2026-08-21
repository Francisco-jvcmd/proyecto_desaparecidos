'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LegalDisclaimer from '../LegalDisclaimer';
import ConsentCheckbox from '../ConsentCheckbox';
import Button from '../ui/Button';
import Input from '../ui/Input';
import MapSelector from '../maps/MapSelector';
import { familiarApi } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { validarCedulaEC, analizarCedulaEC, validarEdad, validarFechaNoFutura, validarCoordenadasDMQ } from '@/lib/validators';

export default function RegistroForm() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    nombres: '', apellidos: '', cedula: '',
    edad: '', sexo: 'MASCULINO', fechaDesaparicion: '',
    vestimenta: '', senasParticulares: '',
    parroquia: '', lat: 0, lng: 0
  });
  
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);
  
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
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no debe superar los 10MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WebP.');
      return;
    }
    setPhotoFile(file);

    // Compresión ligera en cliente para rendimiento óptimo
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setPhotoPreview(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (formData.nombres.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (formData.apellidos.trim().length < 2) return 'Los apellidos deben tener al menos 2 caracteres.';
    if (!validarCedulaEC(formData.cedula)) return 'Cédula del desaparecido inválida según Módulo 10.';
    if (!formData.edad || !validarEdad(parseInt(formData.edad, 10))) return 'Edad inválida (debe estar entre 0 y 120 años).';
    if (!formData.fechaDesaparicion || !validarFechaNoFutura(formData.fechaDesaparicion)) return 'Fecha de desaparición no puede estar en el futuro.';
    if (!formData.parroquia.trim()) return 'Debe ingresar la parroquia o sector de desaparición.';
    if (!validarCoordenadasDMQ(formData.lat, formData.lng)) return 'Debe seleccionar una ubicación válida en el mapa dentro del DMQ.';
    if (!consent) return 'Debe aceptar la declaración de consentimiento informado.';
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

    const token = getToken();
    if (!token) {
      setError('Debes iniciar sesión para reportar un caso.');
      setIsAuth(false);
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        cedula_desaparecido: formData.cedula.trim(),
        edad: parseInt(formData.edad, 10),
        sexo: formData.sexo,
        fecha_desaparicion: formData.fechaDesaparicion,
        ropa_descripcion: formData.vestimenta.trim() || undefined,
        senas_particulares: formData.senasParticulares.trim() || undefined,
        parroquia_desaparicion: formData.parroquia.trim(),
        punto_a_lat: formData.lat,
        punto_a_lng: formData.lng,
        consentimiento_firmado: true,
        foto_url: photoPreview || undefined,
      };

      await familiarApi.reportarCaso(payload, token);
      setSuccess('¡Caso registrado exitosamente! Ha sido enviado para revisión y aprobación administrativa.');
    } catch (err: unknown) {
      let errorMsg = 'Error al registrar el caso. Verifique la información ingresada.';
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMsg = 'El servidor se estaba iniciando en la nube (arranque en frío). Por favor vuelve a hacer clic en "Registrar Caso".';
        } else if (err.message.includes('401') || err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('expirado')) {
          errorMsg = 'Tu sesión ha expirado por seguridad. Por favor cierra sesión e ingresa nuevamente.';
        } else {
          errorMsg = err.message;
        }
      } else if (typeof err === 'object' && err !== null) {
        const obj = err as any;
        errorMsg = typeof obj.detail === 'string' ? obj.detail : (typeof obj.message === 'string' ? obj.message : JSON.stringify(err));
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isAuth === false) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 24px',
        maxWidth: '520px',
        margin: '0 auto',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.15)',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.25rem',
          margin: '0 auto 20px',
          color: 'var(--color-accent)'
        }}>
          🔐
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '12px',
          color: 'var(--text-primary)'
        }}>
          Identificación Requerida
        </h2>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          marginBottom: '28px'
        }}>
          Para reportar un caso de desaparición, necesitas contar con una cuenta activa en la plataforma conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
            🔑 Iniciar Sesión con mi Cuenta
          </Link>
          <Link href="/registro-familiar" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
            👤 Crear Nueva Cuenta de Familiar
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }}>
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.75rem',
          margin: '0 auto 20px',
          color: '#10b981'
        }}>
          ✓
        </div>

        <div style={{
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fbbf24',
          fontSize: '0.8125rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          ⏳ Estado: Pendiente de Validación
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
          ¡Reporte Ingresado Exitosamente!
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '20px' }}>
          Tu reporte ha sido registrado en el sistema. Conforme a los protocolos de seguridad ciudadana y la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong>, el equipo de administración validará la información para activar de inmediato la alerta oficial y el modelo predictivo geoespacial.
        </p>

        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          color: '#38bdf8',
          fontSize: '0.85rem',
          textAlign: 'left',
          marginBottom: '28px',
          lineHeight: 1.5
        }}>
          ℹ️ <strong>¿Qué sucede ahora?</strong><br />
          1. El administrador revisará los datos aportados.<br />
          2. Al ser aprobado, se generará la ficha de difusión oficial y se publicará en el mapa comunitario.<br />
          3. Podrás hacer seguimiento en tiempo real desde tu perfil.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/casos" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
            📁 Ver Casos en la Plataforma
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccess('');
              setFormData({
                nombres: '', apellidos: '', cedula: '',
                edad: '', sexo: 'MASCULINO', fechaDesaparicion: '',
                vestimenta: '', senasParticulares: '',
                parroquia: '', lat: 0, lng: 0
              });
              setPhotoPreview(null);
              setPhotoFile(null);
            }}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}
          >
            📋 Reportar Otro Caso de Desaparición
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <LegalDisclaimer />
      
      <div className="form-section">
        <h3 className="form-section-title">Datos Personales del Desaparecido</h3>
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
          <Input label="Edad" name="edad" type="number" min={0} max={120} value={formData.edad} onChange={handleInputChange} required />
          <div className="input-group">
            <label>Sexo</label>
            <select name="sexo" className="input-field" value={formData.sexo} onChange={handleInputChange}>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <h3 className="form-section-title">Descripción y Rasgos</h3>
        <div className="form-grid">
          <Input multiline label="Vestimenta (Ropa y accesorios)" name="vestimenta" value={formData.vestimenta} onChange={handleInputChange} required />
          <Input multiline label="Señas Particulares (Cicatrices, tatuajes, etc.)" name="senasParticulares" value={formData.senasParticulares} onChange={handleInputChange} />
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Último Lugar Visto</h3>
        <Input label="Parroquia / Barrio / Sector (DMQ)" name="parroquia" value={formData.parroquia} onChange={handleInputChange} required className="mb-4" />
        
        {/* === Alerta LOPDP Art. 21, 25 — Protección NNA === */}
        {parseInt(formData.edad, 10) > 0 && parseInt(formData.edad, 10) < 18 && (
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
      
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          fontSize: '0.875rem',
          marginBottom: '16px'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      <ConsentCheckbox onChange={setConsent} />
      
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" disabled={!consent} loading={loading}>
          📋 Registrar Caso de Desaparición
        </Button>
      </div>
    </form>
  );
}
