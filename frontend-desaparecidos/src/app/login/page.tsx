'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { familiarApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendStatus('');
    setLoading(true);

    try {
      const res = await familiarApi.login({ email, password });
      saveAuth(res.access_token, res.rol);
      
      if (res.rol === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/casos');
      }
    } catch (err: unknown) {
      const apiErr = err as { detail?: string; message?: string };
      setError(apiErr?.detail || apiErr?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const res = await familiarApi.reenviarVerificacion(email);
      setResendStatus(res.message || 'Se ha reenviado el correo de activación.');
    } catch (err: unknown) {
      const apiErr = err as { detail?: string; message?: string };
      setResendStatus(apiErr?.detail || apiErr?.message || 'Error al reenviar correo.');
    } finally {
      setResending(false);
    }
  };

  const isUnverified = error.toLowerCase().includes('verificad') || error.toLowerCase().includes('activaci');

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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔐</div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Iniciar Sesión
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Acceso seguro a la plataforma DMQ Desaparecidos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="ejemplo@dominio.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
              <p style={{ margin: '0 0 8px' }}>⚠️ {error}</p>
              {isUnverified && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent)',
                    textDecoration: 'underline',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 600
                  }}
                >
                  {resending ? 'Enviando...' : 'Reenviar enlace de activación a este correo'}
                </button>
              )}
            </div>
          )}

          {resendStatus && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.875rem',
              marginBottom: '20px'
            }}>
              ℹ️ {resendStatus}
            </div>
          )}

          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
            Ingresar a la Plataforma
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
          ¿No tienes una cuenta?{' '}
          <Link href="/registro-familiar" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            Crear Cuenta de Familiar
          </Link>
        </div>
      </div>
    </div>
  );
}
