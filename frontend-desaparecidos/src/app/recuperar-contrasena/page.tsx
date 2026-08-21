'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { familiarApi } from '@/lib/api';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await familiarApi.solicitarResetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      let errorMsg = 'Error al procesar la solicitud. Intenta nuevamente.';
      if (err instanceof Error) errorMsg = err.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '440px', margin: '40px auto' }}>
      <div style={{
        padding: '36px 32px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {!sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔑</div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}>
                Recuperar Contraseña
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Ingresa el correo electrónico con el que te registraste y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="ejemplo@dominio.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
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

              <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
                Enviar enlace de recuperación
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
              <Link href="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                ← Volver a Iniciar Sesión
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
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
              📧
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'var(--text-primary)'
            }}>
              Revisa tu correo electrónico
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '12px' }}>
              Si tu correo <strong style={{ color: 'var(--color-accent)' }}>{email}</strong> está registrado en la plataforma, recibirás un enlace para restablecer tu contraseña.
            </p>

            <div style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.8125rem',
              color: '#fbbf24',
              marginBottom: '28px',
              lineHeight: 1.6
            }}>
              ⏱️ El enlace expirará en <strong>15 minutos</strong>. Revisa también tu carpeta de spam.
            </div>

            <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
              ← Volver a Iniciar Sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
