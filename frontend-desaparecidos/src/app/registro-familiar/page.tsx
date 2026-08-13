'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { familiarApi } from '@/lib/api';
import { analizarCedulaEC, validarCedulaEC } from '@/lib/validators';

export default function RegistroFamiliarPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentLOPDP, setConsentLOPDP] = useState(false);
  const [consentTratamiento, setConsentTratamiento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para la pantalla de verificación de correo
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const infoCedula = analizarCedulaEC(cedula);

  const validate = (): string | null => {
    if (nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!email.includes('@')) return 'Ingrese un correo electrónico válido.';
    if (!/^09\d{8}$/.test(telefono)) return 'El teléfono debe tener formato ecuatoriano (ej. 0991234567).';
    if (!validarCedulaEC(cedula)) {
      return infoCedula.mensaje || 'Cédula no válida según el algoritmo oficial del Registro Civil (Módulo 10).';
    }
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    if (!consentLOPDP) return 'Debe aceptar la Política de Privacidad para continuar.';
    if (!consentTratamiento) return 'Debe autorizar el tratamiento de datos personales.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await familiarApi.registrarUsuario({
        nombre,
        email,
        telefono,
        cedula,
        password,
      });

      if (res && res.requiere_verificacion) {
        setEmailSent(true);
      }
    } catch (err: unknown) {
      const apiErr = err as { detail?: string; message?: string };
      setError(apiErr?.detail || apiErr?.message || 'Error al crear la cuenta. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setResendMessage('');
    try {
      const res = await familiarApi.reenviarVerificacion(email);
      setResendMessage(res.message || 'Correo reenviado con éxito.');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const apiErr = err as { detail?: string; message?: string };
      setResendMessage(apiErr?.detail || apiErr?.message || 'Error al reenviar el correo.');
    } finally {
      setResending(false);
    }
  };

  // === PANTALLA: Correo de Verificación Enviado ===
  if (emailSent) {
    return (
      <div className="page-container" style={{ maxWidth: '520px', margin: '40px auto' }}>
        <div style={{
          padding: '40px 32px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-glass)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            margin: '0 auto 24px'
          }}>
            📧
          </div>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            ¡Revisa tu correo electrónico!
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '20px' }}>
            Hemos enviado un enlace de activación a:
          </p>

          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            fontFamily: 'monospace',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-accent)',
            marginBottom: '24px',
            wordBreak: 'break-all'
          }}>
            {email}
          </div>

          <div style={{
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            textAlign: 'left',
            marginBottom: '28px'
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)' }}>Pasos a seguir:</p>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Abre tu bandeja de entrada (revisa también la carpeta de <em>Spam / No deseados</em>).</li>
              <li>Haz clic en el botón <strong>"Confirmar y Activar mi Cuenta"</strong>.</li>
              <li>Tu cuenta quedará activada y podrás ingresar de inmediato.</li>
            </ol>
          </div>

          {resendMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#38bdf8',
              fontSize: '0.875rem',
              marginBottom: '20px'
            }}>
              {resendMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              type="button"
              variant="outline"
              loading={resending}
              disabled={resendCooldown > 0}
              onClick={handleResend}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {resendCooldown > 0 
                ? `Reenviar correo (${resendCooldown}s)` 
                : '🔄 Reenviar correo de activación'}
            </Button>

            <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // === PANTALLA: Formulario de Registro ===
  return (
    <div className="page-container" style={{ maxWidth: '520px', margin: '40px auto' }}>
      <div style={{
        padding: '36px 32px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👤</div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Crear Cuenta de Familiar
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Regístrese para reportar y dar seguimiento a casos de personas desaparecidas
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <Input
              label="Nombre Completo"
              placeholder="Juan Pérez García"
              value={nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
              required
            />
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="ejemplo@dominio.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Teléfono (formato ecuatoriano)"
              placeholder="0991234567"
              maxLength={10}
              value={telefono}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelefono(e.target.value)}
              required
            />
            <div>
              <Input
                label="Cédula de Identidad (10 dígitos)"
                placeholder="1712345678"
                maxLength={10}
                value={cedula}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCedula(e.target.value.replace(/\D/g, ''))}
                required
              />
              {cedula.length > 0 && (
                <div style={{
                  marginTop: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: infoCedula.valida ? '#10b981' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{infoCedula.valida ? '✓' : '⚠️'}</span>
                  <span>{infoCedula.mensaje}</span>
                </div>
              )}
            </div>
            <Input
              label="Contraseña (mínimo 8 caracteres)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar Contraseña"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* LOPDP Consent Section */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
              🛡️ Protección de Datos Personales (LOPDP)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              De conformidad con la <strong>Ley Orgánica de Protección de Datos Personales</strong> (R.O. 459, 26-may-2021) 
              y su Reglamento, le informamos que los datos personales que proporcione serán tratados de manera confidencial 
              y utilizados exclusivamente para la gestión de casos de personas desaparecidas en el Distrito Metropolitano de Quito.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Consent 1: Privacy Policy */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                cursor: 'pointer',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                <input
                  type="checkbox"
                  checked={consentLOPDP}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsentLOPDP(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: 'var(--color-accent)' }}
                />
                <span>
                  He leído y acepto la{' '}
                  <Link href="/privacidad" target="_blank" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                    Política de Privacidad
                  </Link>{' '}
                  y conozco mis <strong>derechos ARCO</strong> (Acceso, Rectificación, Cancelación y Oposición) 
                  conforme a los artículos 13 al 17 de la LOPDP.
                </span>
              </label>

              {/* Consent 2: Data Treatment */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                cursor: 'pointer',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                <input
                  type="checkbox"
                  checked={consentTratamiento}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsentTratamiento(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: 'var(--color-accent)' }}
                />
                <span>
                  Autorizo el <strong>tratamiento de mis datos personales</strong> (nombre, cédula, teléfono, correo electrónico) 
                  con la finalidad exclusiva de gestionar reportes de personas desaparecidas. 
                  Entiendo que mis datos están cifrados con <strong>AES-256-GCM</strong> y que puedo revocar 
                  este consentimiento en cualquier momento (Art. 8, LOPDP).
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.875rem',
              marginBottom: '20px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={!consentLOPDP || !consentTratamiento}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Crear Mi Cuenta
          </Button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-glass)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
