'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isAuthenticated, isAdmin, logout, getUser } from '@/lib/auth';

export default function NavBar() {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check auth state on mount
    const checkAuth = () => {
      const logged = isAuthenticated();
      setIsLogged(logged);
      if (logged) {
        setIsAdminUser(isAdmin());
        const user = getUser();
        if (user && user.rol) {
          setUserRole(user.rol);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logout();
    setMobileMenuOpen(false);
    window.location.href = '/';
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand" onClick={closeMenu}>
        <span className="brand-icon">🔍</span>
        <span>DMQ Desaparecidos</span>
      </Link>

      {/* Hamburger Button (Mobile Only) */}
      <button
        type="button"
        className="navbar-mobile-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Abrir menú de navegación"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Desktop Navigation */}
      <ul className="navbar-nav desktop-nav">
        <li><Link href="/">Inicio</Link></li>
        <li><Link href="/casos">Casos</Link></li>
        <li><Link href="/registro">Reportar</Link></li>
        <li><Link href="/privacidad">Privacidad</Link></li>
        {!isLogged ? (
          <>
            <li><Link href="/login">Ingresar</Link></li>
            <li>
              <Link href="/registro-familiar" style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-info))',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'opacity 0.2s'
              }}>
                Registrarse
              </Link>
            </li>
          </>
        ) : (
          <>
            {userRole && (
              <li>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-overlay)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'capitalize'
                }}>
                  {userRole}
                </span>
              </li>
            )}
            {isAdminUser && <li><Link href="/admin">Admin</Link></li>}
            {!isAdminUser && <li><Link href="/casos">Mis Casos</Link></li>}
            <li>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cerrar Sesión
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Mobile Drawer (Mobile Only) */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <div className="mobile-drawer-content">
            {userRole && isLogged && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.8125rem',
                color: 'var(--color-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px'
              }}>
                <span>👤 Sesión activa:</span>
                <strong>{userRole}</strong>
              </div>
            )}

            <Link href="/" onClick={closeMenu} className="mobile-nav-link">
              🏠 Inicio
            </Link>
            <Link href="/casos" onClick={closeMenu} className="mobile-nav-link">
              🔍 Casos Activos
            </Link>
            <Link href="/registro" onClick={closeMenu} className="mobile-nav-link">
              📋 Reportar un Caso
            </Link>
            <Link href="/privacidad" onClick={closeMenu} className="mobile-nav-link">
              🛡️ Privacidad LOPDP
            </Link>

            {isLogged && isAdminUser && (
              <Link href="/admin" onClick={closeMenu} className="mobile-nav-link">
                ⚙️ Panel Admin
              </Link>
            )}

            {isLogged && !isAdminUser && (
              <Link href="/casos" onClick={closeMenu} className="mobile-nav-link">
                📁 Mis Casos
              </Link>
            )}

            <div style={{
              height: '1px',
              background: 'var(--border-glass)',
              margin: '12px 0'
            }} />

            {!isLogged ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href="/login" onClick={closeMenu} className="btn btn-outline" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  🔑 Iniciar Sesión
                </Link>
                <Link href="/registro-familiar" onClick={closeMenu} className="btn btn-primary" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  👤 Crear Cuenta de Familiar
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  width: '100%',
                  justifyContent: 'center',
                  fontWeight: 600
                }}
              >
                🚪 Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
