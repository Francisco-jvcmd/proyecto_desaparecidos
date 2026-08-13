'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { familiarApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No se proporcionó ningún token de verificación en el enlace.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await familiarApi.verificarEmail(token);
        setSuccess(true);
        setMessage(res.message || '¡Tu correo electrónico ha sido verificado con éxito!');
        
        if (res.access_token && res.rol) {
          saveAuth(res.access_token, res.rol);
        }
      } catch (err: unknown) {
        const apiErr = err as { detail?: string; message?: string };
        setError(apiErr?.detail || apiErr?.message || 'El enlace de verificación es inválido o ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="page-container" style={{ maxWidth: '500px', margin: '60px auto' }}>
      <div style={{
        padding: '40px 32px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        textAlign: 'center'
      }}>
        {loading ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }} className="spinner-icon">🔄</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              Verificando tu cuenta...
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Por favor espera un momento mientras validamos tu enlace de activación.
            </p>
          </div>
        ) : success ? (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 20px',
              color: '#10b981'
            }}>
              ✓
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              ¡Cuenta Verificada con Éxito!
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '28px' }}>
              {message} Ahora tienes acceso completo a la plataforma para reportar y gestionar casos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/registro" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                📋 Reportar un Caso Ahora
              </Link>
              <Link href="/casos" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                🔍 Ver Casos Activos
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 20px',
              color: '#ef4444'
            }}>
              ⚠️
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              No pudimos verificar tu cuenta
            </h1>

            <p style={{ color: '#f87171', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '28px' }}>
              {error}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/registro-familiar" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                Volver a Registrarse
              </Link>
              <Link href="/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                Ir al Inicio de Sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <span className="spinner" />
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  );
}
